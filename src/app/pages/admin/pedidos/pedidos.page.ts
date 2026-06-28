import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonMenuButton,
  IonIcon
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  searchOutline,
  funnelOutline,
  syncOutline,
  printOutline,
  eyeOutline
} from 'ionicons/icons';

import {
  Firestore,
  collection,
  collectionData,
  doc,
  updateDoc
} from '@angular/fire/firestore';

import { Subscription } from 'rxjs';

@Component({
  selector: 'app-pedidos',
  templateUrl: './pedidos.page.html',
  styleUrls: ['./pedidos.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonMenuButton,
    IonIcon
  ],
  providers: [DatePipe]
})
export class PedidosPage implements OnInit, OnDestroy {

  private firestore = inject(Firestore);
  private pedidosSub?: Subscription;

  fechaActual: string = '';

  totalPendientes = 0;
  totalCocina = 0;
  totalListos = 0;
  totalCuenta = 0;
  totalPagados = 0;
  totalAnulados = 0;
  montoTotalGlobal = 0;

  listaPedidos: any[] = [];
  pedidosFiltrados: any[] = [];

  terminoBusqueda: string = '';
  estadoSeleccionado: string = 'Todos';

  constructor(private datePipe: DatePipe) {
    addIcons({
      searchOutline,
      funnelOutline,
      syncOutline,
      printOutline,
      eyeOutline
    });
  }

  ngOnInit() {
    this.configurarFecha();
    this.cargarPedidosFirebase();
  }

  ngOnDestroy() {
    this.pedidosSub?.unsubscribe();
  }

  configurarFecha() {
    const hoy = new Date();

    this.fechaActual =
      this.datePipe.transform(
        hoy,
        "EEEE, d 'de' MMMM 'de' yyyy",
        '',
        'es-PE'
      ) || '';
  }

  cargarPedidosFirebase() {
    const hoyString = new Date().toDateString();
    const pedidosRef = collection(this.firestore, 'pedidos');

    this.pedidosSub = collectionData(pedidosRef, { idField: 'id' }).subscribe({
      next: (pedidos: any[]) => {

        const pedidosHoy = pedidos.filter(p => {
          if (!p.fecha) return false;

          const fechaObj = this.convertirFecha(p.fecha);
          return fechaObj.toDateString() === hoyString;
        });

        this.listaPedidos = pedidosHoy.map(p => {
          const productos = p.productos || p.items || [];

          return {
            id: p.id,
            mesa: p.mesa ? `Mesa ${p.mesa}` : 'Llevar / Delivery',
            numMesaRaw: p.mesa || '',
            mesero: p.mesero || 'No asignado',
            items: Array.isArray(productos)
              ? productos.reduce(
                  (acc: number, item: any) => acc + (Number(item.cantidad) || 1),
                  0
                )
              : 0,
            descripcion: Array.isArray(productos)
              ? productos
                  .map((item: any) => item.nombre || item.producto || 'Producto')
                  .join(' + ')
              : 'Sin productos',
            total: Number(p.total) || 0,
            estado: (p.estado || 'pendiente_cocina').toLowerCase(),
            hora: this.extraerHora(p.fecha),
            fechaOrden: this.convertirFecha(p.fecha).getTime()
          };
        });

        this.listaPedidos.sort((a, b) => b.fechaOrden - a.fechaOrden);

        this.calcularMetricas();
        this.filtrarPedidos();

        console.log(`✅ ${this.listaPedidos.length} pedidos de hoy procesados en vivo.`);
      },
      error: (error) => {
        console.error('❌ Error en canal de datos de pedidos:', error);
      }
    });
  }

  convertirFecha(fecha: any): Date {
    if (!fecha) return new Date(0);

    if (fecha?.seconds) {
      return new Date(fecha.seconds * 1000);
    }

    if (fecha?.toDate) {
      return fecha.toDate();
    }

    return new Date(fecha);
  }

  extraerHora(fecha: any): string {
    if (!fecha) return '--:--';

    try {
      const date = this.convertirFecha(fecha);

      return !isNaN(date.getTime())
        ? date.toLocaleTimeString('es-PE', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          })
        : '--:--';
    } catch {
      return '--:--';
    }
  }

  calcularMetricas() {
    this.totalPendientes = this.listaPedidos.filter(
      p => p.estado === 'pendiente_cocina'
    ).length;

    this.totalCocina = this.listaPedidos.filter(
      p => p.estado === 'preparando'
    ).length;

    this.totalListos = this.listaPedidos.filter(
      p => p.estado === 'listo'
    ).length;

    this.totalCuenta = this.listaPedidos.filter(
      p => p.estado === 'cuenta'
    ).length;

    this.totalPagados = this.listaPedidos.filter(
      p => p.estado === 'pagado'
    ).length;

    this.totalAnulados = this.listaPedidos.filter(
      p => p.estado === 'anulado'
    ).length;

    this.montoTotalGlobal = this.listaPedidos
      .filter(p => p.estado === 'pagado')
      .reduce((acc, p) => acc + (Number(p.total) || 0), 0);
  }

  filtrarPedidos() {
    this.pedidosFiltrados = this.listaPedidos.filter(p => {
      const estadoFiltro = this.normalizarFiltroEstado(this.estadoSeleccionado);

      const cumpleEstado =
        estadoFiltro === 'todos' ||
        p.estado === estadoFiltro;

      const busqueda = this.terminoBusqueda.trim().toLowerCase();

      const cumpleBusqueda =
        !busqueda ||
        String(p.id).toLowerCase().includes(busqueda) ||
        String(p.mesa).toLowerCase().includes(busqueda) ||
        String(p.numMesaRaw).toLowerCase().includes(busqueda) ||
        String(p.mesero).toLowerCase().includes(busqueda) ||
        String(p.descripcion).toLowerCase().includes(busqueda);

      return cumpleEstado && cumpleBusqueda;
    });
  }

  normalizarFiltroEstado(estado: string): string {
    const e = estado.toLowerCase();

    if (e === 'todos') return 'todos';
    if (e === 'pendiente' || e === 'pendientes') return 'pendiente_cocina';
    if (e === 'cocina' || e === 'preparando') return 'preparando';
    if (e === 'listo' || e === 'listos') return 'listo';
    if (e === 'cuenta') return 'cuenta';
    if (e === 'pagado' || e === 'pagados') return 'pagado';
    if (e === 'anulado' || e === 'anulados') return 'anulado';

    return e;
  }

  seleccionarFiltroEstado(estado: string) {
    this.estadoSeleccionado = estado;
    this.filtrarPedidos();
  }

  async cambiarEstadoPedido(
    idPedido: string,
    nuevoEstado:
      | 'pendiente_cocina'
      | 'preparando'
      | 'listo'
      | 'entregado_mesa'
      | 'cuenta'
      | 'pagado'
      | 'anulado'
  ) {
    try {
      const pedidoDocRef = doc(this.firestore, 'pedidos', idPedido);

      await updateDoc(pedidoDocRef, {
        estado: nuevoEstado
      });

      console.log(`Estado del pedido ${idPedido} actualizado a: ${nuevoEstado}`);

    } catch (error) {
      console.error(`Error al actualizar el estado del pedido ${idPedido}:`, error);
    }
  }

  actualizarDatos() {
    this.pedidosSub?.unsubscribe();
    this.cargarPedidosFirebase();
  }

  exportarReporte() {
    console.log('Exportando listado de pedidos del día a CSV/PDF...');
  }

  verDetallePedido(id: string) {
    console.log('Abriendo modal o navegación del pedido ID:', id);
  }

  obtenerEstadoTexto(estado: string): string {
    switch (estado) {
      case 'pendiente_cocina':
        return 'Pendiente cocina';
      case 'preparando':
        return 'Preparando';
      case 'listo':
        return 'Listo';
      case 'entregado_mesa':
        return 'Entregado mesa';
      case 'cuenta':
        return 'En cuenta';
      case 'pagado':
        return 'Pagado';
      case 'anulado':
        return 'Anulado';
      default:
        return estado;
    }
  }
}