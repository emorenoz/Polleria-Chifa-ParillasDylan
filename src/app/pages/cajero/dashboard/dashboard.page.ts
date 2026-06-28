import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonButton
} from '@ionic/angular/standalone';

import {
  Firestore,
  collection,
  collectionData,
  doc,
  updateDoc,
  addDoc,
  getDocs,
  query,
  where,
  runTransaction
} from '@angular/fire/firestore';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonButton
  ]
})
export class DashboardPage implements OnInit, OnDestroy {

  private db = inject(Firestore);
  private router = inject(Router);

  horaActual: string = new Date().toLocaleTimeString();
  totalRecaudado: number = 0;

  ObjectDate = Date;

  private relojInterval: any;
  private mesasSubscription?: Subscription;
  private ventasSubscription?: Subscription;

  mesas: any[] = [];
  mesasPorCobrar: any[] = [];
  historialVentas: any[] = [];
  mesaSeleccionada: any | null = null;

  subtotalSeleccionado: number = 0;
  descuento: number = 0;
  totalSeleccionado: number = 0;
  metodoPago: 'Efectivo' | 'Yape' | 'Plin' | 'Tarjeta' = 'Efectivo';

  mostrarQr: boolean = false;
  rutaImagenQr: string = 'assets/qr-yape.png';

  ngOnInit() {
    this.iniciarReloj();
    this.cargarMesasRealtime();
    this.calcularRecaudacionDelDia();
  }

  ngOnDestroy() {
    if (this.relojInterval) clearInterval(this.relojInterval);
    if (this.mesasSubscription) this.mesasSubscription.unsubscribe();
    if (this.ventasSubscription) this.ventasSubscription.unsubscribe();
  }

  iniciarReloj() {
    this.relojInterval = setInterval(() => {
      this.horaActual = new Date().toLocaleTimeString();
    }, 1000);
  }

  cargarMesasRealtime() {
    const mesasRef = collection(this.db, 'mesas');

    this.mesasSubscription = collectionData(mesasRef, { idField: 'id' }).subscribe(async (data: any[]) => {
      this.mesas = data;

      const promesasMesas = data.map(async (m) => {
        const estadoNormalizado = m.estado?.toLowerCase();

        if (
          estadoNormalizado === 'activa' ||
          estadoNormalizado === 'listo' ||
          estadoNormalizado === 'cuenta'
        ) {
          const itemsPedido = await this.obtenerItemsPedidoDeMesa(m.id);
          return { ...m, pedido: itemsPedido };
        } else {
          return { ...m, pedido: [] };
        }
      });

      const mesasProcesadas = await Promise.all(promesasMesas);

      this.mesasPorCobrar = mesasProcesadas.filter(m => {
        const est = m.estado?.toLowerCase();
        return est === 'cuenta' || est === 'listo' || est === 'activa';
      });

      if (this.mesaSeleccionada) {
        const actualizada = mesasProcesadas.find(m => m.id === this.mesaSeleccionada.id);

        if (
          actualizada &&
          (
            actualizada.estado?.toLowerCase() === 'cuenta' ||
            actualizada.estado?.toLowerCase() === 'listo' ||
            actualizada.estado?.toLowerCase() === 'activa'
          )
        ) {
          this.seleccionarMesa(actualizada);
        } else {
          this.mesaSeleccionada = null;
        }
      }
    });
  }

  async obtenerItemsPedidoDeMesa(idMesa: string): Promise<any[]> {
    try {
      const pedidosRef = collection(this.db, 'pedidos');

      const q = query(
        pedidosRef,
        where('idMesa', '==', idMesa),
        where('estado', 'in', [
          'pendiente_cocina',
          'preparando',
          'listo',
          'entregado_mesa',
          'cuenta'
        ])
      );

      const querySnapshot = await getDocs(q);

      let listaProductos: any[] = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();

        const arrayOriginal =
          data['productos'] ??
          data['items'] ??
          data['pedido'] ??
          null;

        if (arrayOriginal && Array.isArray(arrayOriginal)) {
          listaProductos = [...listaProductos, ...arrayOriginal];
        }
      });

      return listaProductos;

    } catch (e) {
      console.error('Error recuperando productos para la caja:', e);
      return [];
    }
  }

  convertirFecha(fecha: any): Date {
    if (!fecha) return new Date(0);

    if (fecha?.seconds) {
      return new Date(fecha.seconds * 1000);
    }

    return new Date(fecha);
  }

  calcularRecaudacionDelDia() {
    const ventasRef = collection(this.db, 'ventas');

    this.ventasSubscription = collectionData(ventasRef).subscribe((ventas: any[]) => {
      const hoy = new Date().toDateString();

      const ventasDeHoy = [...ventas].filter(v => {
        const fechaVenta = this.convertirFecha(v.fecha);
        return v.fecha && fechaVenta.toDateString() === hoy;
      });

      this.totalRecaudado = ventasDeHoy.reduce(
        (acc, v) => acc + (Number(v.total) || 0),
        0
      );

      this.historialVentas = ventasDeHoy.sort((a, b) => {
        const fechaB = this.convertirFecha(b.fecha);
        const fechaA = this.convertirFecha(a.fecha);

        return fechaB.getTime() - fechaA.getTime();
      });
    });
  }

  seleccionarMesa(mesa: any) {
    this.mesaSeleccionada = mesa;
    this.subtotalSeleccionado = this.calcularTotalMesa(mesa);
    this.descuento = 0;
    this.recubicarTotal();
  }

  calcularTotalMesa(mesa: any): number {
    if (!mesa || !mesa.pedido || !Array.isArray(mesa.pedido)) return 0;

    return mesa.pedido.reduce((acc: number, item: any) => {
      const precio =
        item.precio ??
        item.precioUnitario ??
        item.precio_venta ??
        item.producto?.precio ??
        0;

      const cantidad =
        item.cantidad ??
        item.cant ??
        0;

      return acc + (Number(precio) * Number(cantidad));
    }, 0);
  }

  recubicarTotal() {
    const calculo = this.subtotalSeleccionado - this.descuento;
    this.totalSeleccionado = calculo > 0 ? calculo : 0;
  }

  obtenerMeseroDeMesa(mesa: any): string {
    return mesa.mesero || 'Mesero del Salón';
  }

  cambiarMetodoPago(metodo: 'Efectivo' | 'Yape' | 'Plin' | 'Tarjeta') {
    this.metodoPago = metodo;

    if (metodo === 'Yape' || metodo === 'Plin') {
      this.mostrarQr = true;
    }
  }

  cerrarModalQr() {
    this.mostrarQr = false;
  }

  generarIdInventario(nombre: string): string {
    return nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/1\/2/g, 'medio')
      .replace(/1\/4/g, 'cuarto')
      .replace(/1\/8/g, 'octavo')
      .replace(/\+/g, '')
      .replace(/\//g, '')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  }

  async descontarStockVenta(items: any[]) {
    try {
      for (const item of items) {
        const nombreProducto =
          item.producto ??
          item.nombre ??
          item.producto?.nombre ??
          '';

        const cantidadVendida = Number(
          item.cantidad ??
          item.cant ??
          0
        );

        if (!nombreProducto || cantidadVendida <= 0) continue;

        const idInventario =
          item.id ??
          item.productoId ??
          item.idProducto ??
          item.producto?.id ??
          this.generarIdInventario(nombreProducto);

        const inventarioRef = doc(this.db, 'inventario', idInventario);

        await runTransaction(this.db, async (transaction) => {
          const inventarioSnap = await transaction.get(inventarioRef);

          if (!inventarioSnap.exists()) {
            console.warn('⚠️ No existe en inventario:', nombreProducto, idInventario);
            return;
          }

          const data: any = inventarioSnap.data();
          const stockActual = Number(data.cantidad || 0);
          const nuevoStock = stockActual - cantidadVendida;

          transaction.update(inventarioRef, {
            cantidad: nuevoStock < 0 ? 0 : nuevoStock
          });
        });
      }

      console.log('✅ Stock descontado automáticamente');

    } catch (error) {
      console.error('❌ Error descontando stock:', error);
    }
  }

  async cobrarYLiberarMesa() {
    if (!this.mesaSeleccionada) return;

    const itemsProcesados = this.mesaSeleccionada.pedido.map((i: any) => {
      return {
        id: i.id ?? i.productoId ?? i.idProducto ?? i.producto?.id ?? null,
        producto: i.nombre ?? i.producto?.nombre ?? 'Producto',
        cantidad: i.cantidad ?? i.cant ?? 0,
        precioUnitario: i.precio ?? i.precioUnitario ?? i.producto?.precio ?? 0
      };
    });

    const ventaRegistro = {
      mesa: this.mesaSeleccionada.numero,
      idMesa: this.mesaSeleccionada.id,
      items: itemsProcesados,
      subtotal: this.subtotalSeleccionado,
      descuento: this.descuento,
      total: this.totalSeleccionado,
      metodoPago: this.metodoPago,
      fecha: new Date().toISOString(),
      mesero: this.obtenerMeseroDeMesa(this.mesaSeleccionada)
    };

    try {
      await addDoc(collection(this.db, 'ventas'), ventaRegistro);

      await this.descontarStockVenta(itemsProcesados);

      const pedidosRef = collection(this.db, 'pedidos');

      const q = query(
        pedidosRef,
        where('idMesa', '==', this.mesaSeleccionada.id),
        where('estado', 'in', [
          'pendiente_cocina',
          'preparando',
          'listo',
          'entregado_mesa',
          'cuenta'
        ])
      );

      const querySnapshot = await getDocs(q);

      for (const documento of querySnapshot.docs) {
        const pedDocRef = doc(this.db, 'pedidos', documento.id);
        await updateDoc(pedDocRef, {
          estado: 'pagado'
        });
      }

      this.imprimirComprobanteSimulado(ventaRegistro);

      const mesaRef = doc(this.db, 'mesas', this.mesaSeleccionada.id);

      await updateDoc(mesaRef, {
        estado: 'libre',
        pedido: []
      });

      this.mostrarQr = false;
      this.mesaSeleccionada = null;

      console.log('✅ Cobro completado con éxito, stock descontado y mesa liberada.');

    } catch (error) {
      console.error('Error crítico al guardar cobro en Firestore:', error);
    }
  }

  imprimirComprobanteSimulado(venta: any) {
    const contenidoHtml = `
      <html>
        <head>
          <title>Ticket Mesa ${venta.mesa} - Pollería Dylan</title>
          <style>
            @page { size: 105mm auto; margin: 0; }
            body {
              font-family: 'Courier New', monospace;
              width: 95mm;
              margin: 0 auto;
              padding: 20px;
              font-size: 15px;
              color: #000;
              line-height: 1.4;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .bold { font-weight: bold; }
            .divider { border-top: 2px dashed #000; margin: 12px 0; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th, td { padding: 6px 0; }
          </style>
        </head>

        <body>
          <div class="text-center">
            <span class="bold" style="font-size: 22px;">POLLERÍA DYLAN</span><br>
            <span style="font-size: 13px;">RUC: 20123456789</span><br>
            <span class="bold" style="font-size: 14px;">COMPROBANTE DE PAGO SIMULADO</span>
          </div>

          <div class="divider"></div>

          <div>
            <span><b>MESA:</b> ${venta.mesa}</span><br>
            <span><b>ATENDIÓ:</b> ${venta.mesero}</span><br>
            <span><b>MÉTODO PAGO:</b> ${venta.metodoPago}</span><br>
            <span><b>FECHA:</b> ${new Date(venta.fecha).toLocaleString('es-PE')}</span>
          </div>

          <div class="divider"></div>

          <table>
            <thead>
              <tr>
                <th style="text-align: left; width: 15%;">Cant</th>
                <th style="text-align: left; width: 55%;">Producto</th>
                <th class="text-right" style="width: 30%;">Total</th>
              </tr>
            </thead>

            <tbody>
              ${venta.items.map((i: any) => `
                <tr>
                  <td>${i.cantidad}</td>
                  <td>${i.producto}</td>
                  <td class="text-right">S/ ${(i.cantidad * i.precioUnitario).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="divider"></div>

          <div class="bold" style="font-size: 17px; margin: 10px 0;">
            <div style="display:flex; justify-content:space-between;">
              <span>TOTAL PAGADO:</span>
              <span>S/ ${venta.total.toFixed(2)}</span>
            </div>
          </div>

          <div class="divider"></div>

          <div class="text-center" style="font-size: 12px; margin-top: 15px;">
            <p class="bold">*** DOCUMENTO SIMULADO ***</p>
            <p>¡Gracias por su preferencia!</p>
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([contenidoHtml], {
      type: 'text/html;charset=utf-8'
    });

    const enlaceDescarga = document.createElement('a');
    enlaceDescarga.href = URL.createObjectURL(blob);
    enlaceDescarga.download = `Ticket_Mesa_${venta.mesa}.html`;
    document.body.appendChild(enlaceDescarga);
    enlaceDescarga.click();
    document.body.removeChild(enlaceDescarga);
  }

  cerrarSesion() {
    this.router.navigate(['/select-role']);
  }

  logout() {
    this.cerrarSesion();
  }

  salir() {
    this.cerrarSesion();
  }
}