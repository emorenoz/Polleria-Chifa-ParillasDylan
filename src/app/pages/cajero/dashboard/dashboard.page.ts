import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

// Componentes standalone nativos de Ionic
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

// Módulos funcionales de Firebase Cloud Firestore
import {
  Firestore,
  collection,
  collectionData,
  doc,
  updateDoc,
  addDoc
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

  // ==========================================================================
  // INYECCIÓN DE SERVICIOS
  // ==========================================================================
  private db = inject(Firestore);
  private router = inject(Router);

  // ==========================================================================
  // ESTADO DE CAJA (MÉTRICAS Y REFERENCIAS NATIVAS)
  // ==========================================================================
  horaActual: string = new Date().toLocaleTimeString();
  totalRecaudado: number = 0;

  // Exposición de la clase constructora Date para su renderizado directo en la vista HTML
  ObjectDate = Date;

  private relojInterval: any;
  private mesasSubscription?: Subscription;
  private ventasSubscription?: Subscription;

  // ==========================================================================
  // LISTADOS DE SALÓN, HISTORIAL Y SELECCIÓN REACTIVA
  // ==========================================================================
  mesas: any[] = [];
  mesasPorCobrar: any[] = [];
  historialVentas: any[] = []; // 🚀 Almacén para el nuevo feed en vivo de operaciones
  mesaSeleccionada: any | null = null;

  // Parámetros calculados para el ticket de pago activo
  subtotalSeleccionado: number = 0;
  descuento: number = 0;
  totalSeleccionado: number = 0;
  metodoPago: 'Efectivo' | 'Yape' | 'Plin' | 'Tarjeta' = 'Efectivo';

  // CONTROL VISUAL PARA EL MODAL DE YAPE
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

  // ==========================================================================
  // CONEXIÓN EN TIEMPO REAL - SISTEMA DE MESAS (SALÓN)
  // ==========================================================================
  cargarMesasRealtime() {
    const mesasRef = collection(this.db, 'mesas');

    this.mesasSubscription = collectionData(mesasRef, { idField: 'id' }).subscribe((data: any[]) => {
      this.mesas = data;
      this.mesasPorCobrar = data.filter(m => m.estado === 'cuenta');

      if (this.mesaSeleccionada) {
        const actualizada = this.mesas.find(m => m.id === this.mesaSeleccionada.id);
        if (actualizada && actualizada.estado === 'cuenta') {
          this.seleccionarMesa(actualizada);
        } else {
          this.mesaSeleccionada = null;
        }
      }
    });
  }

  // ==========================================================================
  // MONITOREO AUTOMÁTICO DE VENTAS E HISTORIAL DEL DÍA
  // ==========================================================================
  calcularRecaudacionDelDia() {
    const ventasRef = collection(this.db, 'ventas');

    this.ventasSubscription = collectionData(ventasRef).subscribe((ventas: any[]) => {
      const hoy = new Date().toDateString();

      // Filtrar las ventas que corresponden estrictamente al día de hoy
      const ventasDeHoy = ventas.filter(v => v.fecha && new Date(v.fecha).toDateString() === hoy);

      // Calcular la sumatoria de la caja diaria
      this.totalRecaudado = ventasDeHoy.reduce((acc, v) => acc + (v.total || 0), 0);

      // Inyectar al historial ordenando cronológicamente de forma descendente (Más reciente primero)
      this.historialVentas = ventasDeHoy.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    });
  }

  // ==========================================================================
  // INTERRUPTORES Y CONTROLADORES DE INTERFAZ (UI)
  // ==========================================================================
  seleccionarMesa(mesa: any) {
    this.mesaSeleccionada = mesa;
    this.subtotalSeleccionado = this.calcularTotalMesa(mesa);
    this.descuento = 0;
    this.recubicarTotal();
  }

  calcularTotalMesa(mesa: any): number {
    if (!mesa || !mesa.pedido || !Array.isArray(mesa.pedido)) return 0;
    return mesa.pedido.reduce((acc: number, item: any) => {
      const precio = item.precio ?? item.producto?.precio ?? 0;
      const cantidad = item.cantidad ?? 0;
      return acc + (precio * cantidad);
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
    if (metodo === 'Yape') {
      this.mostrarQr = true;
    }
  }

  cerrarModalQr() {
    this.mostrarQr = false;
  }

  // ==========================================================================
  // TRANSACCIÓN ESCALABLE DE COBRO (CIERRE DE ORDEN Y LIBERACIÓN)
  // ==========================================================================
  async cobrarYLiberarMesa() {
    if (!this.mesaSeleccionada) return;

    const itemsProcesados = this.mesaSeleccionada.pedido.map((i: any) => {
      return {
        producto: i.nombre ?? i.producto?.nombre ?? 'Producto',
        cantidad: i.cantidad ?? 0,
        precioUnitario: i.precio ?? i.producto?.precio ?? 0
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
      // 1. Guardamos en histórico de Firestore
      await addDoc(collection(this.db, 'ventas'), ventaRegistro);

      // 2. Ejecutar la descarga automática del ticket simulado
      this.imprimirComprobanteSimulado(ventaRegistro);

      // 3. Limpiar Mesa en Firestore
      const mesaRef = doc(this.db, 'mesas', this.mesaSeleccionada.id);
      await updateDoc(mesaRef, {
        estado: 'libre',
        pedido: []
      });

      // Asegurar el reseteo de los controladores visuales
      this.mostrarQr = false;
      this.mesaSeleccionada = null;

    } catch (error) {
      console.error("Error crítico al guardar cobro en Firestore:", error);
    }
  }

  // ==========================================================================
  // MOTOR DE GENERACIÓN Y DESCARGA AUTOMÁTICA DEL COMPROBANTE (FORMATO TICKET)
  // ==========================================================================
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

    const blob = new Blob([contenidoHtml], { type: 'text/html;charset=utf-8' });
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