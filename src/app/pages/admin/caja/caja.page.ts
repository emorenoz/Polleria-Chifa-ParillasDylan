import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonIcon,
  IonButtons,
  IonMenuButton
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  walletOutline,
  printOutline,
  trendingUpOutline,
  trendingDownOutline,
  cashOutline,
  addOutline,
  removeOutline
} from 'ionicons/icons';

import {
  Firestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  collectionData
} from '@angular/fire/firestore';

import { Subscription } from 'rxjs';

@Component({
  selector: 'app-caja',
  templateUrl: './caja.page.html',
  styleUrls: ['./caja.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonIcon,
    IonButtons,
    IonMenuButton
  ]
})
export class CajaPage implements OnInit, OnDestroy {

  private firestore = inject(Firestore);

  private pedidosSub?: Subscription;

  fechaActual = '';
  usuarioCaja = 'Admin';
  horaApertura = '08:00';
  fondoInicial = 350;

  totalCaja = 0;
  totalIngresos = 0;
  totalEgresos = 0;

  cantidadIngresos = 0;
  cantidadEgresos = 0;

  totalEfectivo = 0;
  totalTarjeta = 0;
  totalYape = 0;

  porcentajeEfectivo = 0;
  porcentajeTarjeta = 0;
  porcentajeYape = 0;

  totalPendienteCobro = 0;

  mostrarFormulario = false;

  nuevoMovimiento = {
    tipo: '',
    metodo: '',
    monto: null as number | null,
    descripcion: ''
  };

  historial: any[] = [];
  pedidosPorCobrar: any[] = [];

  constructor() {
    addIcons({
      walletOutline,
      printOutline,
      trendingUpOutline,
      trendingDownOutline,
      cashOutline,
      addOutline,
      removeOutline
    });
  }

  async ngOnInit() {
    this.configurarFecha();
    await this.cargarMovimientosFirebase();
    this.cargarPedidosPendientesCaja();
  }

  ngOnDestroy() {
    this.pedidosSub?.unsubscribe();
  }

  configurarFecha() {
    const opciones: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };

    this.fechaActual = new Date().toLocaleDateString('es-PE', opciones);
  }

  cargarPedidosPendientesCaja() {
    const pedidosRef = collection(this.firestore, 'pedidos');

    this.pedidosSub = collectionData(pedidosRef, { idField: 'id' }).subscribe((pedidos: any[]) => {
      this.pedidosPorCobrar = pedidos
        .filter(p => this.normalizarEstado(p.estado) === 'cuenta')
        .map(p => {
          const productos = p.productos || p.items || [];

          return {
            ...p,
            estado: this.normalizarEstado(p.estado),
            productos,
            total: Number(p.total) || 0,
            mesaTexto: p.tipoPedido === 'para_llevar'
              ? 'Para llevar'
              : (p.mesa ? `Mesa ${p.mesa}` : 'Mesa'),
            clienteTexto: p.clienteNombre || 'Cliente general',
            meseroTexto: p.mesero || 'No asignado',
            horaTexto: this.extraerHora(p.fecha || p.fechaPedido),
            descripcion: Array.isArray(productos)
              ? productos.map((i: any) => i.nombre || i.producto || 'Producto').join(' + ')
              : 'Sin productos',
            fechaOrden: this.convertirFecha(p.fecha || p.fechaPedido).getTime()
          };
        })
        .sort((a, b) => b.fechaOrden - a.fechaOrden);

      this.totalPendienteCobro = this.pedidosPorCobrar
        .reduce((sum, pedido) => sum + Number(pedido.total || 0), 0);
    });
  }

  async cargarMovimientosFirebase() {
    try {
      const movimientosRef = query(
        collection(this.firestore, 'caja'),
        orderBy('fecha', 'desc')
      );

      const querySnapshot = await getDocs(movimientosRef);

      this.historial = [];

      querySnapshot.forEach((docSnap) => {
        this.historial.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });

      this.calcularTotales();

    } catch (error) {
      console.error('❌ Error cargando movimientos:', error);
    }
  }

  prepararIngreso() {
    this.mostrarFormulario = true;

    this.nuevoMovimiento = {
      tipo: 'ingreso',
      metodo: 'Efectivo',
      monto: null,
      descripcion: ''
    };
  }

  prepararEgreso() {
    this.mostrarFormulario = true;

    this.nuevoMovimiento = {
      tipo: 'egreso',
      metodo: 'Retiro',
      monto: null,
      descripcion: ''
    };
  }

  async registrarMovimiento() {
    if (!this.nuevoMovimiento.tipo || !this.nuevoMovimiento.monto) {
      return;
    }

    const movimiento = {
      tipo: this.nuevoMovimiento.tipo,
      metodo: this.nuevoMovimiento.metodo || (
        this.nuevoMovimiento.tipo === 'ingreso' ? 'Efectivo' : 'Retiro'
      ),
      monto: Number(this.nuevoMovimiento.monto),
      descripcion: this.nuevoMovimiento.descripcion.trim() || (
        this.nuevoMovimiento.tipo === 'ingreso'
          ? 'Ingreso manual'
          : 'Egreso manual'
      ),
      fecha: new Date(),
      fechaCaja: this.obtenerFechaCaja(),
      origen: 'manual_admin',
      usuario: this.usuarioCaja
    };

    try {
      const docRef = await addDoc(
        collection(this.firestore, 'caja'),
        movimiento
      );

      this.historial.unshift({
        id: docRef.id,
        ...movimiento
      });

      this.calcularTotales();

      this.nuevoMovimiento = {
        tipo: '',
        metodo: '',
        monto: null,
        descripcion: ''
      };

      this.mostrarFormulario = false;

    } catch (error) {
      console.error('❌ Error registrando movimiento:', error);
    }
  }

  calcularTotales() {
    const hoyString = new Date().toDateString();

    const movimientosHoy = this.historial.filter(mov => {
      const fecha = this.convertirFecha(mov.fecha || mov.fechaCaja);
      return fecha.toDateString() === hoyString;
    });

    this.totalIngresos = movimientosHoy
      .filter(mov => mov.tipo === 'ingreso')
      .reduce((sum, mov) => sum + Number(mov.monto || 0), 0);

    this.totalEgresos = movimientosHoy
      .filter(mov => mov.tipo === 'egreso')
      .reduce((sum, mov) => sum + Number(mov.monto || 0), 0);

    this.totalCaja = this.fondoInicial + this.totalIngresos - this.totalEgresos;

    this.cantidadIngresos = movimientosHoy
      .filter(mov => mov.tipo === 'ingreso').length;

    this.cantidadEgresos = movimientosHoy
      .filter(mov => mov.tipo === 'egreso').length;

    this.totalEfectivo = movimientosHoy
      .filter(mov => mov.tipo === 'ingreso' && mov.metodo === 'Efectivo')
      .reduce((sum, mov) => sum + Number(mov.monto || 0), 0);

    this.totalTarjeta = movimientosHoy
      .filter(mov => mov.tipo === 'ingreso' && mov.metodo === 'Tarjeta')
      .reduce((sum, mov) => sum + Number(mov.monto || 0), 0);

    this.totalYape = movimientosHoy
      .filter(mov => mov.tipo === 'ingreso' && mov.metodo === 'Yape')
      .reduce((sum, mov) => sum + Number(mov.monto || 0), 0);

    const totalMetodos = this.totalEfectivo + this.totalTarjeta + this.totalYape;

    this.porcentajeEfectivo = totalMetodos > 0
      ? (this.totalEfectivo / totalMetodos) * 100
      : 0;

    this.porcentajeTarjeta = totalMetodos > 0
      ? (this.totalTarjeta / totalMetodos) * 100
      : 0;

    this.porcentajeYape = totalMetodos > 0
      ? (this.totalYape / totalMetodos) * 100
      : 0;
  }

  obtenerFechaCaja(): string {
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');
    const day = String(hoy.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  convertirFecha(fecha: any): Date {
    if (!fecha) return new Date(0);

    if (fecha?.toDate) {
      return fecha.toDate();
    }

    if (fecha?.seconds) {
      return new Date(fecha.seconds * 1000);
    }

    const fechaConvertida = new Date(fecha);

    return isNaN(fechaConvertida.getTime())
      ? new Date(0)
      : fechaConvertida;
  }

  extraerHora(fecha: any): string {
    const date = this.convertirFecha(fecha);

    if (isNaN(date.getTime())) return '--:--';

    return date.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  normalizarEstado(estado: any): string {
    const e = String(estado || '').toLowerCase().trim();

    if (e === 'entregado') return 'entregado_mesa';
    if (e === 'recogido') return 'entregado_mesa';
    if (e === 'cancelado') return 'anulado';

    return e;
  }

  cerrarTurno() {
    window.print();
  }
}