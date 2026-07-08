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
  private pedidosSubscription?: Subscription;

  mesas: any[] = [];
  mesasPorCobrar: any[] = [];
  private mesasPorCobrarMesas: any[] = [];
  private pedidosParaLlevarPorCobrar: any[] = [];

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
    this.cargarPedidosParaLlevarRealtime();
    this.calcularRecaudacionDelDia();
  }

  ngOnDestroy() {
    if (this.relojInterval) clearInterval(this.relojInterval);
    if (this.mesasSubscription) this.mesasSubscription.unsubscribe();
    if (this.ventasSubscription) this.ventasSubscription.unsubscribe();
    if (this.pedidosSubscription) this.pedidosSubscription.unsubscribe();
  }

  iniciarReloj() {
    this.relojInterval = setInterval(() => {
      this.horaActual = new Date().toLocaleTimeString();
    }, 1000);
  }

  obtenerFechaCaja(): string {
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');
    const day = String(hoy.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  actualizarListaPorCobrar() {
    this.mesasPorCobrar = [
      ...this.mesasPorCobrarMesas,
      ...this.pedidosParaLlevarPorCobrar
    ];
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
          return {
            ...m,
            tipoPedido: 'mesa',
            pedido: itemsPedido
          };
        } else {
          return {
            ...m,
            tipoPedido: 'mesa',
            pedido: []
          };
        }
      });

      const mesasProcesadas = await Promise.all(promesasMesas);

      this.mesasPorCobrarMesas = mesasProcesadas.filter(m => {
        const est = m.estado?.toLowerCase();
        return est === 'cuenta' || est === 'listo' || est === 'activa';
      });

      this.actualizarListaPorCobrar();

      if (this.mesaSeleccionada && this.mesaSeleccionada.tipoPedido !== 'para_llevar') {
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

  cargarPedidosParaLlevarRealtime() {
    const pedidosRef = collection(this.db, 'pedidos');

    this.pedidosSubscription = collectionData(
      pedidosRef,
      { idField: 'id' }
    ).subscribe((pedidos: any[]) => {

      this.pedidosParaLlevarPorCobrar = pedidos
        .filter(p => {
          const estado = (p.estado || '').toLowerCase();

          return p.tipoPedido === 'para_llevar' &&
            (
              estado === 'listo' ||
              estado === 'cuenta' ||
              estado === 'entregado_mesa'
            );
        })
        .map(p => ({
          id: p.id,
          numero: 'Para llevar',
          mesa: 'Para llevar',
          tipoPedido: 'para_llevar',
          clienteNombre: p.clienteNombre || 'Cliente',
          clienteTelefono: p.clienteTelefono || '',
          mesero: p.mesero || 'Mesero',
          estado: p.estado || 'cuenta',
          pedido: p.productos || p.items || [],
          total: Number(p.total || 0),
          fechaPedido: p.fechaPedido || p.fecha || '',
          fechaCaja: p.fechaCaja || ''
        }));

      this.actualizarListaPorCobrar();

      if (this.mesaSeleccionada && this.mesaSeleccionada.tipoPedido === 'para_llevar') {
        const actualizada = this.pedidosParaLlevarPorCobrar.find(p => p.id === this.mesaSeleccionada.id);

        if (actualizada) {
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

  obtenerTipoCliente(totalPedidos: number): string {
    if (totalPedidos >= 5) return 'Frecuente';
    if (totalPedidos >= 2) return 'Regular';
    return 'Nuevo';
  }

  async actualizarClientePorVenta(venta: any): Promise<void> {
    const telefonoLimpio = String(
      venta.clienteTelefono ||
      this.mesaSeleccionada?.clienteTelefono ||
      ''
    ).replace(/[^0-9]/g, '');

    if (!telefonoLimpio) {
      console.warn('⚠️ Venta sin teléfono de cliente. No se actualizó clientes.');
      return;
    }

    const nombreCliente =
      venta.clienteNombre ||
      this.mesaSeleccionada?.clienteNombre ||
      'Cliente';

    const clienteRef = doc(this.db, 'clientes', telefonoLimpio);
    const fechaActual = new Date().toISOString();
    const totalVenta = Number(venta.total || 0);

    try {
      await runTransaction(this.db, async (transaction) => {
        const clienteSnap = await transaction.get(clienteRef);

        const dataAnterior: any = clienteSnap.exists()
          ? clienteSnap.data()
          : {};

        const totalPedidosAnterior = Number(dataAnterior.totalPedidos || 0);
        const totalGastadoAnterior = Number(dataAnterior.totalGastado || 0);

        const totalPedidosNuevo = totalPedidosAnterior + 1;
        const totalGastadoNuevo = totalGastadoAnterior + totalVenta;
        const tipoNuevo = this.obtenerTipoCliente(totalPedidosNuevo);

        transaction.set(clienteRef, {
          documento: dataAnterior.documento || '',
          nombre: nombreCliente,
          telefono: telefonoLimpio,
          direccion: dataAnterior.direccion || '',
          totalPedidos: totalPedidosNuevo,
          totalGastado: totalGastadoNuevo,
          tipo: tipoNuevo,
          origen: venta.tipoPedido || 'cajero',
          ultimaCompra: fechaActual,
          ultimaVisita: fechaActual,
          fechaCaja: this.obtenerFechaCaja(),
          actualizadoEn: fechaActual
        }, { merge: true });
      });

      console.log('✅ Cliente actualizado con monto y pedidos:', nombreCliente, totalVenta);

    } catch (error) {
      console.error('❌ Error actualizando cliente:', error);
    }
  }

  async cobrarYLiberarMesa() {
    if (!this.mesaSeleccionada) return;

    if (this.mesaSeleccionada.tipoPedido === 'para_llevar') {
      await this.cobrarPedidoParaLlevar();
      return;
    }

    const itemsProcesados = this.mesaSeleccionada.pedido.map((i: any) => {
      return {
        id: i.id ?? i.productoId ?? i.idProducto ?? i.producto?.id ?? null,
        producto: i.nombre ?? i.producto?.nombre ?? i.producto ?? 'Producto',
        cantidad: i.cantidad ?? i.cant ?? 0,
        precioUnitario: i.precio ?? i.precioUnitario ?? i.producto?.precio ?? 0
      };
    });

    const ventaRegistro = {
      tipoPedido: 'mesa',
      mesa: this.mesaSeleccionada.numero,
      idMesa: this.mesaSeleccionada.id,
      clienteNombre: this.mesaSeleccionada.clienteNombre || '',
      clienteTelefono: this.mesaSeleccionada.clienteTelefono || '',
      items: itemsProcesados,
      productos: itemsProcesados,
      subtotal: this.subtotalSeleccionado,
      descuento: this.descuento,
      total: this.totalSeleccionado,
      metodoPago: this.metodoPago,
      fecha: new Date().toISOString(),
      fechaCaja: this.obtenerFechaCaja(),
      mesero: this.obtenerMeseroDeMesa(this.mesaSeleccionada),
      estado: 'pagado'
    };

    try {
      await addDoc(collection(this.db, 'ventas'), ventaRegistro);

      await this.actualizarClientePorVenta(ventaRegistro);

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
          estado: 'pagado',
          pagado: true,
          fechaPago: new Date().toISOString()
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

      console.log('✅ Cobro completado con éxito, cliente actualizado, stock descontado y mesa liberada.');

    } catch (error) {
      console.error('Error crítico al guardar cobro en Firestore:', error);
    }
  }

  async cobrarPedidoParaLlevar() {
    if (!this.mesaSeleccionada) return;

    const itemsProcesados = this.mesaSeleccionada.pedido.map((i: any) => {
      return {
        id: i.id ?? i.productoId ?? i.idProducto ?? i.producto?.id ?? null,
        producto: i.nombre ?? i.producto ?? i.producto?.nombre ?? 'Producto',
        cantidad: i.cantidad ?? i.cant ?? 0,
        precioUnitario: i.precio ?? i.precioUnitario ?? i.producto?.precio ?? 0
      };
    });

    const ventaRegistro = {
      tipoPedido: 'para_llevar',
      mesa: 'Para llevar',
      idPedido: this.mesaSeleccionada.id,
      clienteNombre: this.mesaSeleccionada.clienteNombre || 'Cliente',
      clienteTelefono: this.mesaSeleccionada.clienteTelefono || '',
      items: itemsProcesados,
      productos: itemsProcesados,
      subtotal: this.subtotalSeleccionado,
      descuento: this.descuento,
      total: this.totalSeleccionado,
      metodoPago: this.metodoPago,
      fecha: new Date().toISOString(),
      fechaCaja: this.obtenerFechaCaja(),
      mesero: this.obtenerMeseroDeMesa(this.mesaSeleccionada),
      estado: 'pagado'
    };

    try {
      await addDoc(collection(this.db, 'ventas'), ventaRegistro);

      await this.actualizarClientePorVenta(ventaRegistro);

      await this.descontarStockVenta(itemsProcesados);

      const pedidoRef = doc(this.db, 'pedidos', this.mesaSeleccionada.id);

      await updateDoc(pedidoRef, {
        estado: 'pagado',
        pagado: true,
        fechaPago: new Date().toISOString(),
        metodoPago: this.metodoPago
      });

      this.imprimirComprobanteSimulado(ventaRegistro);

      this.mostrarQr = false;
      this.mesaSeleccionada = null;

      console.log('✅ Pedido para llevar cobrado correctamente y cliente actualizado.');

    } catch (error) {
      console.error('❌ Error cobrando pedido para llevar:', error);
    }
  }

  imprimirComprobanteSimulado(venta: any) {
    const tituloTicket = venta.tipoPedido === 'para_llevar'
      ? `Ticket Para Llevar - Pollería Dylan`
      : `Ticket Mesa ${venta.mesa} - Pollería Dylan`;

    const clienteHtml = venta.tipoPedido === 'para_llevar'
      ? `
        <span><b>CLIENTE:</b> ${venta.clienteNombre || 'Cliente'}</span><br>
        <span><b>TELÉFONO:</b> ${venta.clienteTelefono || '-'}</span><br>
      `
      : '';

    const contenidoHtml = `
      <html>
        <head>
          <title>${tituloTicket}</title>
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
            <span class="bold" style="font-size: 14px;">COMPROBANTE DE PAGO</span>
          </div>

          <div class="divider"></div>

          <div>
            <span><b>TIPO:</b> ${venta.tipoPedido === 'para_llevar' ? 'PARA LLEVAR' : 'MESA'}</span><br>
            <span><b>MESA:</b> ${venta.mesa}</span><br>
            ${clienteHtml}
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
              <span>S/ ${Number(venta.total || 0).toFixed(2)}</span>
            </div>
          </div>

          <div class="divider"></div>

          <div class="text-center" style="font-size: 12px; margin-top: 15px;">
            <p class="bold">*** EL MEJOR SAZON QUE PODRAS POBRAR EN TODO COMAS ***</p>
            <p>¡Gracias por su preferencia!</p>
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([contenidoHtml], {
      type: 'text/html;charset=utf-8'
    });

    const nombreArchivo = venta.tipoPedido === 'para_llevar'
      ? `Ticket_Para_Llevar_${venta.clienteNombre || 'Cliente'}.html`
      : `Ticket_Mesa_${venta.mesa}.html`;

    const enlaceDescarga = document.createElement('a');
    enlaceDescarga.href = URL.createObjectURL(blob);
    enlaceDescarga.download = nombreArchivo;
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