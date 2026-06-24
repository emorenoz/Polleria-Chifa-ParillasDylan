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
  collectionData
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

  // Contadores analíticos superiores
  totalPendientes = 0;
  totalCocina = 0;
  totalEntregados = 0;
  totalAnulados = 0;
  montoTotalGlobal = 0;

  // Colecciones de datos de control
  listaPedidos: any[] = [];         // Datos puros de Firebase filtrados por hoy
  pedidosFiltrados: any[] = [];     // Datos que se muestran en el HTML tras buscar/filtrar

  // Variables de control de UI (Filtros activos)
  terminoBusqueda: string = '';
  estadoSeleccionado: string = 'Todos'; // Controla las pestañas superiores

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
    // Liberar la conexión a Firestore al salir de la página
    if (this.pedidosSub) {
      this.pedidosSub.unsubscribe();
    }
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

  // 🔥 CARGAR PEDIDOS DESDE FIREBASE EN TIEMPO REAL
  cargarPedidosFirebase() {
    const hoyString = new Date().toDateString(); // Formato estándar: "Wed Jun 24 2026"
    const pedidosRef = collection(this.firestore, 'pedidos');

    // Escucha activa reactiva
    this.pedidosSub = collectionData(pedidosRef, { idField: 'id' }).subscribe({
      next: (pedidos: any[]) => {

        // 1. Filtrar estrictamente los pedidos creados el día de hoy
        const pedidosHoy = pedidos.filter(p => {
          if (!p.fecha) return false;
          // Validar si viene como Timestamp de Firebase (.seconds) o fecha nativa ISO/Date string
          const fechaObj = p.fecha?.seconds ? new Date(p.fecha.seconds * 1000) : new Date(p.fecha);
          return fechaObj.toDateString() === hoyString;
        });

        // 2. Mapear y procesar la estructura limpia sin romper la UI
        this.listaPedidos = pedidosHoy.map(p => ({
          id: p.id,
          mesa: p.mesa ? `Mesa ${p.mesa}` : 'Llevar / Delivery',
          numMesaRaw: p.mesa || '', // Para búsquedas precisas por número
          mesero: p.mesero || 'No asignado',
          items: Array.isArray(p.productos) ? p.productos.reduce((acc: number, item: any) => acc + (item.cantidad || 1), 0) : (p.items || 0),
          total: p.total || 0,
          estado: (p.estado || 'pendiente').toLowerCase(),
          hora: this.extraerHora(p.fecha)
        }));

        // 3. Ordenar cronológicamente (Del más reciente al más antiguo)
        this.listaPedidos.sort((a, b) => b.hora.localeCompare(a.hora));

        // 4. Calcular métricas globales de las tarjetas
        this.calcularMetricas();

        // 5. Aplicar filtros iniciales
        this.filtrarPedidos();

        console.log(`✅ ${this.listaPedidos.length} Pedidos de hoy procesados en vivo.`);
      },
      error: (error) => {
        console.error('❌ Error en canal de datos de pedidos:', error);
      }
    });
  }

  // 🔥 EXTRAER HORA DESDE CUALQUIER FORMATO DE TIMESTAMP
  extraerHora(fecha: any): string {
    if (!fecha) return '--:--';
    try {
      const date = fecha.seconds
        ? new Date(fecha.seconds * 1000)
        : (fecha.toDate ? fecha.toDate() : new Date(fecha));

      return !isNaN(date.getTime())
        ? date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false })
        : '--:--';
    } catch {
      return '--:--';
    }
  }

  calcularMetricas() {
    this.totalPendientes = this.listaPedidos.filter(p => p.estado === 'pendiente').length;
    this.totalCocina = this.listaPedidos.filter(p => p.estado === 'cocina').length;
    this.totalEntregados = this.listaPedidos.filter(p => p.estado === 'entregado').length;
    this.totalAnulados = this.listaPedidos.filter(p => p.estado === 'anulado').length;

    // Solo se suma al monto global recaudado los pedidos que ya fueron entregados/cobrados
    this.montoTotalGlobal = this.listaPedidos
      .filter(p => p.estado === 'entregado')
      .reduce((acc, p) => acc + p.total, 0);
  }

  // 🔍 BUSCADOR INTERACTIVO Y FILTRO POR PESTAÑAS (Pendiente, Cocina, etc.)
  filtrarPedidos() {
    this.pedidosFiltrados = this.listaPedidos.filter(p => {
      // Filtro 1: Por la pestaña de estado seleccionada
      const cumpleEstado = this.estadoSeleccionado === 'Todos' || p.estado === this.estadoSeleccionado.toLowerCase();

      // Filtro 2: Por el cuadro de búsqueda (Mesa, Mesero, o ID)
      const busqueda = this.terminoBusqueda.trim().toLowerCase();
      const cumpleBusqueda = !busqueda ||
        p.id.toLowerCase().includes(busqueda) ||
        p.mesa.toLowerCase().includes(busqueda) ||
        p.numMesaRaw.toString().includes(busqueda) ||
        p.mesero.toLowerCase().includes(busqueda);

      return cumpleEstado && cumpleBusqueda;
    });
  }

  // Cambiar de pestaña superior (Todos, Pendientes, Cocina...)
  seleccionarFiltroEstado(estado: string) {
    this.estadoSeleccionado = estado;
    this.filtrarPedidos();
  }

  // Botón manual de sincronización (fuerza la reinicialización si fuese necesario)
  actualizarDatos() {
    if (this.pedidosSub) this.pedidosSub.unsubscribe();
    this.cargarPedidosFirebase();
  }

  exportarReporte() {
    console.log('Exportando listado de pedidos del día a CSV/PDF...');
  }

  verDetallePedido(id: string) {
    console.log('Abriendo modal o navegación del pedido ID:', id);
  }
}