import {
  Component,
  OnInit,
  OnDestroy,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';

import {
  Firestore,
  collection,
  collectionData
} from '@angular/fire/firestore';

import { addIcons } from 'ionicons';

import {
  arrowBackOutline,
  calendarOutline,
  cardOutline,
  cashOutline,
  filterOutline,
  phonePortraitOutline,
  receiptOutline,
  refreshOutline,
  restaurantOutline,
  searchOutline,
  walletOutline
} from 'ionicons/icons';

interface GrupoVentas {
  fecha: string;
  fechaOrden: number;
  ventas: any[];
  cantidadVentas: number;
  totalDia: number;
  totalEfectivo: number;
  totalYape: number;
  totalPlin: number;
  totalTarjeta: number;
}

type MetodoPago =
  | 'todos'
  | 'Efectivo'
  | 'Yape'
  | 'Plin'
  | 'Tarjeta';

type TipoPedido =
  | 'todos'
  | 'mesa'
  | 'para_llevar';

@Component({
  selector: 'app-historial',
  templateUrl: './historial.page.html',
  styleUrls: ['./historial.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonTitle,
    IonToolbar
  ]
})
export class HistorialPage implements OnInit, OnDestroy {

  private firestore = inject(Firestore);
  private router = inject(Router);

  private ventasSubscription?: Subscription;

  ventas: any[] = [];
  ventasFiltradas: any[] = [];
  ventasAgrupadas: GrupoVentas[] = [];

  textoBusqueda: string = '';
  fechaDesde: string = '';
  fechaHasta: string = '';

  metodoSeleccionado: MetodoPago = 'todos';
  tipoSeleccionado: TipoPedido = 'todos';

  totalGeneral: number = 0;
  totalVentas: number = 0;

  totalEfectivo: number = 0;
  totalYape: number = 0;
  totalPlin: number = 0;
  totalTarjeta: number = 0;

  ticketPromedio: number = 0;

  constructor() {
    addIcons({
      arrowBackOutline,
      calendarOutline,
      cardOutline,
      cashOutline,
      filterOutline,
      phonePortraitOutline,
      receiptOutline,
      refreshOutline,
      restaurantOutline,
      searchOutline,
      walletOutline
    });
  }

  ngOnInit(): void {
    this.cargarVentas();
  }

  ngOnDestroy(): void {
    if (this.ventasSubscription) {
      this.ventasSubscription.unsubscribe();
    }
  }

  // =====================================================
  // CARGAR TODAS LAS VENTAS
  // =====================================================

  cargarVentas(): void {
    const ventasRef = collection(
      this.firestore,
      'ventas'
    );

    this.ventasSubscription = collectionData(
      ventasRef,
      { idField: 'id' }
    ).subscribe({
      next: (ventas: any[]) => {
        this.ventas = (ventas || [])
          .filter(venta => {
            const estado =
              this.normalizarTexto(venta.estado);

            return (
              estado === 'pagado' ||
              estado === 'completado' ||
              estado === 'vendido' ||
              !estado
            );
          })
          .sort(
            (a, b) =>
              this.obtenerTime(b.fecha) -
              this.obtenerTime(a.fecha)
          );

        this.aplicarFiltros();
      },

      error: error => {
        console.error(
          'Error cargando historial de ventas:',
          error
        );

        this.ventas = [];
        this.ventasFiltradas = [];
        this.ventasAgrupadas = [];

        this.calcularTotales();
      }
    });
  }

  // =====================================================
  // FILTROS
  // =====================================================

  aplicarFiltros(): void {
    const busqueda =
      this.normalizarTexto(this.textoBusqueda);

    const fechaInicio = this.fechaDesde
      ? new Date(`${this.fechaDesde}T00:00:00`)
      : null;

    const fechaFin = this.fechaHasta
      ? new Date(`${this.fechaHasta}T23:59:59`)
      : null;

    this.ventasFiltradas = this.ventas.filter(
      venta => {
        const fechaVenta =
          this.convertirFecha(venta.fecha);

        const tipoPedido =
          this.normalizarTipoPedido(venta);

        const metodoPago =
          String(venta.metodoPago || '');

        const textoVenta =
          this.normalizarTexto(
            [
              venta.id,
              venta.idVenta,
              venta.numeroPedido,
              venta.mesa,
              venta.idMesa,
              venta.clienteNombre,
              venta.nombreCliente,
              venta.clienteTelefono,
              venta.telefonoCliente,
              venta.metodoPago,
              venta.tipoPedido,
              venta.tipo,
              venta.cajero,
              venta.mesero
            ].join(' ')
          );

        const coincideBusqueda =
          !busqueda ||
          textoVenta.includes(busqueda);

        const coincideDesde =
          !fechaInicio ||
          fechaVenta >= fechaInicio;

        const coincideHasta =
          !fechaFin ||
          fechaVenta <= fechaFin;

        const coincideMetodo =
          this.metodoSeleccionado === 'todos' ||
          metodoPago === this.metodoSeleccionado;

        const coincideTipo =
          this.tipoSeleccionado === 'todos' ||
          tipoPedido === this.tipoSeleccionado;

        return (
          coincideBusqueda &&
          coincideDesde &&
          coincideHasta &&
          coincideMetodo &&
          coincideTipo
        );
      }
    );

    this.calcularTotales();
    this.agruparVentasPorDia();
  }

  limpiarFiltros(): void {
    this.textoBusqueda = '';
    this.fechaDesde = '';
    this.fechaHasta = '';
    this.metodoSeleccionado = 'todos';
    this.tipoSeleccionado = 'todos';

    this.aplicarFiltros();
  }

  // =====================================================
  // CALCULAR TOTALES
  // =====================================================

  calcularTotales(): void {
    this.totalVentas =
      this.ventasFiltradas.length;

    this.totalGeneral =
      this.sumarVentas(this.ventasFiltradas);

    this.totalEfectivo =
      this.sumarListaPorMetodo(
        this.ventasFiltradas,
        'Efectivo'
      );

    this.totalYape =
      this.sumarListaPorMetodo(
        this.ventasFiltradas,
        'Yape'
      );

    this.totalPlin =
      this.sumarListaPorMetodo(
        this.ventasFiltradas,
        'Plin'
      );

    this.totalTarjeta =
      this.sumarListaPorMetodo(
        this.ventasFiltradas,
        'Tarjeta'
      );

    this.ticketPromedio =
      this.totalVentas > 0
        ? this.totalGeneral / this.totalVentas
        : 0;
  }

  sumarVentas(ventas: any[]): number {
    return ventas.reduce(
      (total: number, venta: any) =>
        total + Number(venta.total || 0),
      0
    );
  }

  sumarPorMetodo(metodo: string): number {
    return this.sumarListaPorMetodo(
      this.ventasFiltradas,
      metodo
    );
  }

  sumarListaPorMetodo(
    ventas: any[],
    metodo: string
  ): number {
    return ventas
      .filter(
        venta =>
          String(venta.metodoPago || '')
            .toLowerCase() ===
          metodo.toLowerCase()
      )
      .reduce(
        (total: number, venta: any) =>
          total + Number(venta.total || 0),
        0
      );
  }

  // =====================================================
  // AGRUPAR VENTAS POR DÍA
  // =====================================================

  agruparVentasPorDia(): void {
    const mapaVentas =
      new Map<string, any[]>();

    for (const venta of this.ventasFiltradas) {
      const fechaGrupo =
        venta.fechaCaja ||
        this.obtenerFechaCajaDesdeFecha(
          venta.fecha
        );

      if (!mapaVentas.has(fechaGrupo)) {
        mapaVentas.set(fechaGrupo, []);
      }

      mapaVentas.get(fechaGrupo)?.push(venta);
    }

    this.ventasAgrupadas =
      Array.from(mapaVentas.entries())
        .map(([fecha, ventas]) => {
          const fechaOrden =
            fecha === 'sin-fecha'
              ? 0
              : new Date(
                  `${fecha}T00:00:00`
                ).getTime();

          const ventasOrdenadas =
            [...ventas].sort(
              (a, b) =>
                this.obtenerTime(b.fecha) -
                this.obtenerTime(a.fecha)
            );

          return {
            fecha,
            fechaOrden,
            ventas: ventasOrdenadas,
            cantidadVentas:
              ventasOrdenadas.length,

            totalDia:
              this.sumarVentas(
                ventasOrdenadas
              ),

            totalEfectivo:
              this.sumarListaPorMetodo(
                ventasOrdenadas,
                'Efectivo'
              ),

            totalYape:
              this.sumarListaPorMetodo(
                ventasOrdenadas,
                'Yape'
              ),

            totalPlin:
              this.sumarListaPorMetodo(
                ventasOrdenadas,
                'Plin'
              ),

            totalTarjeta:
              this.sumarListaPorMetodo(
                ventasOrdenadas,
                'Tarjeta'
              )
          };
        })
        .sort(
          (a, b) =>
            b.fechaOrden - a.fechaOrden
        );
  }

  // =====================================================
  // PRODUCTOS
  // =====================================================

  obtenerCantidadProductos(
    venta: any
  ): number {
    const productos =
      venta?.items ??
      venta?.productos ??
      venta?.pedido ??
      [];

    if (!Array.isArray(productos)) {
      return 0;
    }

    return productos.reduce(
      (total: number, producto: any) => {
        const cantidad = Number(
          producto?.cantidad ??
          producto?.cant ??
          producto?.unidades ??
          0
        );

        return total +
          (
            Number.isNaN(cantidad)
              ? 0
              : cantidad
          );
      },
      0
    );
  }

  // =====================================================
  // FECHAS
  // =====================================================

  convertirFecha(fecha: any): Date {
    if (!fecha) {
      return new Date(0);
    }

    if (
      typeof fecha.toDate === 'function'
    ) {
      return fecha.toDate();
    }

    if (
      typeof fecha.toMillis === 'function'
    ) {
      return new Date(fecha.toMillis());
    }

    if (
      typeof fecha.seconds === 'number'
    ) {
      return new Date(
        fecha.seconds * 1000
      );
    }

    if (
      typeof fecha._seconds === 'number'
    ) {
      return new Date(
        fecha._seconds * 1000
      );
    }

    const fechaConvertida =
      new Date(fecha);

    return Number.isNaN(
      fechaConvertida.getTime()
    )
      ? new Date(0)
      : fechaConvertida;
  }

  obtenerTime(fecha: any): number {
    return this.convertirFecha(
      fecha
    ).getTime();
  }

  obtenerFechaCajaDesdeFecha(
    fecha: any
  ): string {
    const fechaConvertida =
      this.convertirFecha(fecha);

    if (
      fechaConvertida.getTime() === 0
    ) {
      return 'sin-fecha';
    }

    const year =
      fechaConvertida.getFullYear();

    const month = String(
      fechaConvertida.getMonth() + 1
    ).padStart(2, '0');

    const day = String(
      fechaConvertida.getDate()
    ).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  formatearFechaGrupo(
    fecha: string
  ): string {
    if (
      !fecha ||
      fecha === 'sin-fecha'
    ) {
      return 'Fecha no registrada';
    }

    const fechaConvertida =
      new Date(`${fecha}T00:00:00`);

    if (
      Number.isNaN(
        fechaConvertida.getTime()
      )
    ) {
      return fecha;
    }

    return fechaConvertida
      .toLocaleDateString(
        'es-PE',
        {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        }
      );
  }

  formatearHora(fecha: any): string {
    const fechaConvertida =
      this.convertirFecha(fecha);

    if (
      fechaConvertida.getTime() === 0
    ) {
      return '--:--';
    }

    return fechaConvertida
      .toLocaleTimeString(
        'es-PE',
        {
          hour: '2-digit',
          minute: '2-digit'
        }
      );
  }

  // =====================================================
  // INFORMACIÓN DE LA VENTA
  // =====================================================

  obtenerCodigoVenta(
    venta: any
  ): string {
    const codigo =
      venta?.idVenta ??
      venta?.id ??
      venta?.numeroPedido ??
      'SIN-ID';

    return String(codigo)
      .slice(-6)
      .toUpperCase();
  }

  obtenerTituloVenta(
    venta: any
  ): string {
    const tipo =
      this.normalizarTipoPedido(venta);

    if (tipo === 'para_llevar') {
      return 'Pedido para llevar';
    }

    return `Mesa ${
      venta?.mesa ||
      venta?.numeroMesa ||
      '-'
    }`;
  }

  normalizarTipoPedido(
    venta: any
  ): string {
    const tipo =
      venta?.tipoPedido ??
      venta?.tipo ??
      venta?.modalidad ??
      venta?.origen ??
      '';

    return this.normalizarTexto(tipo)
      .replace(/\s+/g, '_')
      .replace(/-/g, '_');
  }

  normalizarTexto(valor: any): string {
    return String(valor || '')
      .trim()
      .toLowerCase();
  }

  // =====================================================
  // TRACKBY
  // =====================================================

  trackByGrupo(
    index: number,
    grupo: GrupoVentas
  ): string | number {
    return grupo?.fecha || index;
  }

  trackByVenta(
    index: number,
    venta: any
  ): string | number {
    return (
      venta?.id ||
      venta?.idVenta ||
      index
    );
  }

  // =====================================================
  // NAVEGACIÓN
  // =====================================================

  volverInicio(): void {
    this.router.navigate([
      '/cajero/dashboard'
    ]);
  }
}