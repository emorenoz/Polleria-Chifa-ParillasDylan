import {
  Component,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonMenuButton,
  IonToolbar
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';

import {
  addOutline,
  cashOutline,
  printOutline,
  removeOutline,
  trendingDownOutline,
  trendingUpOutline,
  walletOutline
} from 'ionicons/icons';

import {
  Firestore,
  addDoc,
  collection,
  collectionData,
  orderBy,
  query,
  serverTimestamp
} from '@angular/fire/firestore';

import { Subscription } from 'rxjs';

type TipoMovimiento = 'ingreso' | 'egreso' | '';

type MetodoPago =
  | 'Efectivo'
  | 'Tarjeta'
  | 'Yape'
  | 'Plin'
  | 'Retiro'
  | '';

type TipoMensaje =
  | 'exito'
  | 'error'
  | 'advertencia'
  | '';

interface MovimientoCaja {
  id?: string;

  tipo: TipoMovimiento;
  metodo: MetodoPago;

  monto: number;
  descripcion: string;

  fecha: any;
  fechaCaja: string;

  origen: string;
  usuario: string;

  categoria?: string;
}

interface VentaCaja {
  id?: string;
  idVenta?: string;

  total: number;
  metodoPago: string;

  fecha: any;
  fechaCaja?: string;

  estado?: string;
  tipoPedido?: string;

  mesa?: string | number;
  clienteNombre?: string;

  cajero?: string;
  mesero?: string;
}

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

  // =====================================================
  // SERVICIOS
  // =====================================================

  private firestore = inject(Firestore);

  // =====================================================
  // SUSCRIPCIONES
  // =====================================================

  private pedidosSub?: Subscription;
  private movimientosSub?: Subscription;
  private ventasSub?: Subscription;

  // =====================================================
  // INFORMACIÓN GENERAL
  // =====================================================

  fechaActual = '';
  usuarioCaja = 'Admin';

  horaApertura = '';
  fondoInicial = 350;

  cajaCerrada = false;
  procesandoMovimiento = false;
  procesandoCierre = false;

  // =====================================================
  // TOTALES GENERALES
  // =====================================================

  /**
   * Total general:
   * fondo inicial + ingresos y ventas - egresos.
   *
   * Incluye efectivo y pagos digitales.
   */
  totalCaja = 0;

  /**
   * Dinero físico esperado dentro del cajón.
   */
  totalCajaEfectivo = 0;

  totalIngresos = 0;
  totalEgresos = 0;

  totalVentas = 0;
  cantidadVentas = 0;

  cantidadIngresos = 0;
  cantidadEgresos = 0;

  // =====================================================
  // MÉTODOS DE PAGO
  // =====================================================

  totalEfectivo = 0;
  totalTarjeta = 0;
  totalYape = 0;
  totalPlin = 0;

  porcentajeEfectivo = 0;
  porcentajeTarjeta = 0;
  porcentajeYape = 0;
  porcentajePlin = 0;

  /**
   * Ingresos manuales separados.
   */
  ingresosManualesEfectivo = 0;
  ingresosManualesTarjeta = 0;
  ingresosManualesYape = 0;
  ingresosManualesPlin = 0;

  /**
   * Egresos físicos.
   */
  totalEgresosEfectivo = 0;

  // =====================================================
  // PEDIDOS PENDIENTES
  // =====================================================

  totalPendienteCobro = 0;
  pedidosPorCobrar: any[] = [];

  // =====================================================
  // FORMULARIO
  // =====================================================

  mostrarFormulario = false;

  nuevoMovimiento: {
    tipo: TipoMovimiento;
    metodo: MetodoPago;
    monto: number | null;
    descripcion: string;
  } = {
    tipo: '',
    metodo: '',
    monto: null,
    descripcion: ''
  };

  // =====================================================
  // DATOS FIRESTORE
  // =====================================================

  historial: MovimientoCaja[] = [];
  ventas: VentaCaja[] = [];

  // =====================================================
  // MENSAJES
  // =====================================================

  mensaje = '';
  tipoMensaje: TipoMensaje = '';

  private mensajeTimeout:
    ReturnType<typeof setTimeout> | null = null;

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

  // =====================================================
  // CICLO DE VIDA
  // =====================================================

  ngOnInit(): void {
    this.configurarFecha();
    this.configurarHoraApertura();

    this.cargarMovimientosRealtime();
    this.cargarVentasRealtime();
    this.cargarPedidosPendientesCaja();
  }

  ngOnDestroy(): void {
    this.pedidosSub?.unsubscribe();
    this.movimientosSub?.unsubscribe();
    this.ventasSub?.unsubscribe();

    if (this.mensajeTimeout) {
      clearTimeout(this.mensajeTimeout);
    }
  }

  // =====================================================
  // FECHA Y APERTURA
  // =====================================================

  configurarFecha(): void {
    const opciones: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };

    this.fechaActual = new Date().toLocaleDateString(
      'es-PE',
      opciones
    );
  }

  configurarHoraApertura(): void {
    this.horaApertura = new Date().toLocaleTimeString(
      'es-PE',
      {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }
    );
  }

  // =====================================================
  // MOVIMIENTOS DE CAJA EN TIEMPO REAL
  // =====================================================

  cargarMovimientosRealtime(): void {
    const movimientosQuery = query(
      collection(this.firestore, 'caja'),
      orderBy('fecha', 'desc')
    );

    this.movimientosSub = collectionData(
      movimientosQuery,
      { idField: 'id' }
    ).subscribe({
      next: (movimientos: any[]) => {
        this.historial = (movimientos || [])
          .filter(movimiento => {
            /*
             * Los cierres se guardan en la misma colección,
             * pero no deben contarse como ingresos o egresos.
             */
            return movimiento.origen !== 'cierre_caja';
          })
          .map(movimiento => ({
            ...movimiento,
            monto: Number(movimiento.monto || 0),
            tipo: this.normalizarTipoMovimiento(
              movimiento.tipo
            ),
            metodo: this.normalizarMetodoPago(
              movimiento.metodo
            )
          }));

        this.calcularTotales();
      },

      error: error => {
        console.error(
          '❌ Error cargando movimientos de caja:',
          error
        );

        this.mostrarMensaje(
          'No se pudieron cargar los movimientos de caja.',
          'error'
        );
      }
    });
  }

  // =====================================================
  // VENTAS EN TIEMPO REAL
  // =====================================================

  cargarVentasRealtime(): void {
    const ventasQuery = query(
      collection(this.firestore, 'ventas'),
      orderBy('fecha', 'desc')
    );

    this.ventasSub = collectionData(
      ventasQuery,
      { idField: 'id' }
    ).subscribe({
      next: (ventas: any[]) => {
        this.ventas = (ventas || [])
          .filter(venta => {
            const estado = this.normalizarEstado(
              venta.estado
            );

            /*
             * Se aceptan ventas antiguas sin estado
             * y ventas registradas como pagadas.
             */
            return (
              !estado ||
              estado === 'pagado' ||
              estado === 'completado' ||
              estado === 'vendido'
            );
          })
          .map(venta => ({
            ...venta,
            total: Number(venta.total || 0),
            metodoPago: this.normalizarMetodoPago(
              venta.metodoPago
            )
          }));

        this.calcularTotales();
      },

      error: error => {
        console.error(
          '❌ Error cargando ventas:',
          error
        );

        this.mostrarMensaje(
          'No se pudieron cargar las ventas.',
          'error'
        );
      }
    });
  }

  // =====================================================
  // PEDIDOS PENDIENTES EN CAJA
  // =====================================================

  cargarPedidosPendientesCaja(): void {
    const pedidosRef = collection(
      this.firestore,
      'pedidos'
    );

    this.pedidosSub = collectionData(
      pedidosRef,
      { idField: 'id' }
    ).subscribe({
      next: (pedidos: any[]) => {
        this.pedidosPorCobrar = (pedidos || [])
          .filter(pedido => {
            const estado = this.normalizarEstado(
              pedido.estado
            );

            /*
             * La caja debería trabajar principalmente
             * con el estado "cuenta".
             */
            return estado === 'cuenta';
          })
          .map(pedido => {
            const productos =
              this.obtenerProductosPedido(pedido);

            const tipoPedido =
              this.normalizarTipoPedido(pedido);

            return {
              ...pedido,

              estado:
                this.normalizarEstado(
                  pedido.estado
                ),

              tipoPedido,

              productos,

              total:
                this.calcularTotalPedido(
                  pedido
                ),

              mesaTexto:
                tipoPedido === 'para_llevar'
                  ? 'Para llevar'
                  : pedido.mesa
                    ? `Mesa ${pedido.mesa}`
                    : pedido.numeroMesa
                      ? `Mesa ${pedido.numeroMesa}`
                      : 'Mesa',

              clienteTexto:
                pedido.clienteNombre ||
                pedido.nombreCliente ||
                'Cliente general',

              meseroTexto:
                pedido.mesero ||
                'No asignado',

              horaTexto:
                this.extraerHora(
                  pedido.fecha ||
                  pedido.fechaPedido ||
                  pedido.fechaCreacion
                ),

              descripcion:
                productos.length > 0
                  ? productos
                      .map(item =>
                        this.obtenerNombreProducto(item)
                      )
                      .join(' + ')
                  : 'Sin productos',

              fechaOrden:
                this.convertirFecha(
                  pedido.fecha ||
                  pedido.fechaPedido ||
                  pedido.fechaCreacion
                ).getTime()
            };
          })
          .sort(
            (a, b) =>
              b.fechaOrden - a.fechaOrden
          );

        this.totalPendienteCobro =
          this.pedidosPorCobrar.reduce(
            (total, pedido) =>
              total +
              Number(pedido.total || 0),
            0
          );
      },

      error: error => {
        console.error(
          '❌ Error cargando pedidos pendientes:',
          error
        );

        this.mostrarMensaje(
          'No se pudieron cargar los pedidos pendientes.',
          'error'
        );
      }
    });
  }

  // =====================================================
  // PREPARAR FORMULARIOS
  // =====================================================

  prepararIngreso(): void {
    if (this.cajaCerrada) {
      this.mostrarMensaje(
        'La caja está cerrada. No se pueden registrar movimientos.',
        'advertencia'
      );
      return;
    }

    this.mostrarFormulario = true;

    this.nuevoMovimiento = {
      tipo: 'ingreso',
      metodo: 'Efectivo',
      monto: null,
      descripcion: ''
    };
  }

  prepararEgreso(): void {
    if (this.cajaCerrada) {
      this.mostrarMensaje(
        'La caja está cerrada. No se pueden registrar movimientos.',
        'advertencia'
      );
      return;
    }

    this.mostrarFormulario = true;

    this.nuevoMovimiento = {
      tipo: 'egreso',
      metodo: 'Efectivo',
      monto: null,
      descripcion: ''
    };
  }

  cancelarMovimiento(): void {
    this.mostrarFormulario = false;

    this.nuevoMovimiento = {
      tipo: '',
      metodo: '',
      monto: null,
      descripcion: ''
    };
  }

  // =====================================================
  // REGISTRAR MOVIMIENTO
  // =====================================================

  async registrarMovimiento(): Promise<void> {
    if (this.procesandoMovimiento) {
      return;
    }

    if (this.cajaCerrada) {
      this.mostrarMensaje(
        'La caja está cerrada.',
        'advertencia'
      );
      return;
    }

    const tipo =
      this.normalizarTipoMovimiento(
        this.nuevoMovimiento.tipo
      );

    const monto =
      Number(this.nuevoMovimiento.monto);

    if (
      !tipo ||
      !Number.isFinite(monto) ||
      monto <= 0
    ) {
      this.mostrarMensaje(
        'Ingresa un tipo y un monto mayor que cero.',
        'advertencia'
      );
      return;
    }

    let metodo =
      this.normalizarMetodoPago(
        this.nuevoMovimiento.metodo
      );

    if (!metodo) {
      metodo = 'Efectivo';
    }

    /*
     * Los egresos normalmente salen del efectivo físico.
     */
    if (tipo === 'egreso') {
      metodo = 'Efectivo';
    }

    const descripcion =
      this.nuevoMovimiento.descripcion
        .trim() ||
      (
        tipo === 'ingreso'
          ? 'Ingreso manual'
          : 'Egreso manual'
      );

    const movimiento: MovimientoCaja = {
      tipo,
      metodo,
      monto: Number(monto.toFixed(2)),
      descripcion,

      fecha: serverTimestamp(),
      fechaCaja: this.obtenerFechaCaja(),

      origen: 'manual_admin',
      usuario: this.usuarioCaja,

      categoria:
        tipo === 'egreso'
          ? 'Retiro'
          : 'Ingreso manual'
    };

    this.procesandoMovimiento = true;

    try {
      await addDoc(
        collection(
          this.firestore,
          'caja'
        ),
        movimiento
      );

      this.cancelarMovimiento();

      this.mostrarMensaje(
        tipo === 'ingreso'
          ? 'Ingreso registrado correctamente.'
          : 'Egreso registrado correctamente.',
        'exito'
      );

    } catch (error) {
      console.error(
        '❌ Error registrando movimiento:',
        error
      );

      this.mostrarMensaje(
        'No se pudo registrar el movimiento.',
        'error'
      );

    } finally {
      this.procesandoMovimiento = false;
    }
  }

  // =====================================================
  // CÁLCULO DE TOTALES
  // =====================================================

  calcularTotales(): void {
    const fechaCaja = this.obtenerFechaCaja();

    const movimientosHoy =
      this.historial.filter(movimiento => {
        return this.esDelDiaActual(
          movimiento.fecha,
          movimiento.fechaCaja
        );
      });

    const ventasHoy =
      this.ventas.filter(venta => {
        return this.esDelDiaActual(
          venta.fecha,
          venta.fechaCaja
        );
      });

    // -----------------------------------------------------
    // MOVIMIENTOS MANUALES
    // -----------------------------------------------------

    const ingresosManuales =
      movimientosHoy.filter(
        movimiento =>
          movimiento.tipo === 'ingreso'
      );

    const egresosManuales =
      movimientosHoy.filter(
        movimiento =>
          movimiento.tipo === 'egreso'
      );

    const totalIngresosManuales =
      ingresosManuales.reduce(
        (total, movimiento) =>
          total +
          Number(movimiento.monto || 0),
        0
      );

    this.totalEgresos =
      egresosManuales.reduce(
        (total, movimiento) =>
          total +
          Number(movimiento.monto || 0),
        0
      );

    this.cantidadIngresos =
      ingresosManuales.length;

    this.cantidadEgresos =
      egresosManuales.length;

    // -----------------------------------------------------
    // VENTAS
    // -----------------------------------------------------

    this.totalVentas =
      ventasHoy.reduce(
        (total, venta) =>
          total +
          Number(venta.total || 0),
        0
      );

    this.cantidadVentas =
      ventasHoy.length;

    // -----------------------------------------------------
    // INGRESOS TOTALES
    // -----------------------------------------------------

    this.totalIngresos =
      totalIngresosManuales +
      this.totalVentas;

    // -----------------------------------------------------
    // INGRESOS MANUALES POR MÉTODO
    // -----------------------------------------------------

    this.ingresosManualesEfectivo =
      this.sumarMovimientosPorMetodo(
        ingresosManuales,
        'Efectivo'
      );

    this.ingresosManualesTarjeta =
      this.sumarMovimientosPorMetodo(
        ingresosManuales,
        'Tarjeta'
      );

    this.ingresosManualesYape =
      this.sumarMovimientosPorMetodo(
        ingresosManuales,
        'Yape'
      );

    this.ingresosManualesPlin =
      this.sumarMovimientosPorMetodo(
        ingresosManuales,
        'Plin'
      );

    // -----------------------------------------------------
    // VENTAS POR MÉTODO
    // -----------------------------------------------------

    const ventasEfectivo =
      this.sumarVentasPorMetodo(
        ventasHoy,
        'Efectivo'
      );

    const ventasTarjeta =
      this.sumarVentasPorMetodo(
        ventasHoy,
        'Tarjeta'
      );

    const ventasYape =
      this.sumarVentasPorMetodo(
        ventasHoy,
        'Yape'
      );

    const ventasPlin =
      this.sumarVentasPorMetodo(
        ventasHoy,
        'Plin'
      );

    // -----------------------------------------------------
    // TOTALES POR MÉTODO
    // -----------------------------------------------------

    this.totalEfectivo =
      ventasEfectivo +
      this.ingresosManualesEfectivo;

    this.totalTarjeta =
      ventasTarjeta +
      this.ingresosManualesTarjeta;

    this.totalYape =
      ventasYape +
      this.ingresosManualesYape;

    this.totalPlin =
      ventasPlin +
      this.ingresosManualesPlin;

    // -----------------------------------------------------
    // EGRESOS FÍSICOS
    // -----------------------------------------------------

    this.totalEgresosEfectivo =
      egresosManuales
        .filter(movimiento => {
          const metodo =
            this.normalizarMetodoPago(
              movimiento.metodo
            );

          return (
            metodo === 'Efectivo' ||
            metodo === 'Retiro' ||
            !metodo
          );
        })
        .reduce(
          (total, movimiento) =>
            total +
            Number(movimiento.monto || 0),
          0
        );

    // -----------------------------------------------------
    // TOTAL GENERAL
    // -----------------------------------------------------

    this.totalCaja =
      this.fondoInicial +
      this.totalIngresos -
      this.totalEgresos;

    // -----------------------------------------------------
    // EFECTIVO FÍSICO EN CAJÓN
    // -----------------------------------------------------

    this.totalCajaEfectivo =
      this.fondoInicial +
      this.totalEfectivo -
      this.totalEgresosEfectivo;

    // -----------------------------------------------------
    // PORCENTAJES
    // -----------------------------------------------------

    const totalMetodos =
      this.totalEfectivo +
      this.totalTarjeta +
      this.totalYape +
      this.totalPlin;

    this.porcentajeEfectivo =
      this.calcularPorcentaje(
        this.totalEfectivo,
        totalMetodos
      );

    this.porcentajeTarjeta =
      this.calcularPorcentaje(
        this.totalTarjeta,
        totalMetodos
      );

    this.porcentajeYape =
      this.calcularPorcentaje(
        this.totalYape,
        totalMetodos
      );

    this.porcentajePlin =
      this.calcularPorcentaje(
        this.totalPlin,
        totalMetodos
      );

    console.log(
      'Resumen de caja:',
      {
        fechaCaja,
        fondoInicial:
          this.fondoInicial,
        totalVentas:
          this.totalVentas,
        totalIngresos:
          this.totalIngresos,
        totalEgresos:
          this.totalEgresos,
        totalCaja:
          this.totalCaja,
        totalCajaEfectivo:
          this.totalCajaEfectivo
      }
    );
  }

  sumarMovimientosPorMetodo(
    movimientos: MovimientoCaja[],
    metodo: string
  ): number {
    return movimientos
      .filter(movimiento => {
        return (
          this.normalizarMetodoPago(
            movimiento.metodo
          ) ===
          this.normalizarMetodoPago(
            metodo
          )
        );
      })
      .reduce(
        (total, movimiento) =>
          total +
          Number(movimiento.monto || 0),
        0
      );
  }

  sumarVentasPorMetodo(
    ventas: VentaCaja[],
    metodo: string
  ): number {
    return ventas
      .filter(venta => {
        return (
          this.normalizarMetodoPago(
            venta.metodoPago
          ) ===
          this.normalizarMetodoPago(
            metodo
          )
        );
      })
      .reduce(
        (total, venta) =>
          total +
          Number(venta.total || 0),
        0
      );
  }

  calcularPorcentaje(
    valor: number,
    total: number
  ): number {
    if (
      total <= 0 ||
      valor <= 0
    ) {
      return 0;
    }

    return Number(
      (
        (valor / total) * 100
      ).toFixed(2)
    );
  }

  // =====================================================
  // PRODUCTOS Y PEDIDOS
  // =====================================================

  obtenerProductosPedido(
    pedido: any
  ): any[] {
    const productos =
      pedido?.productos ??
      pedido?.items ??
      pedido?.pedido ??
      pedido?.detalle ??
      [];

    return Array.isArray(productos)
      ? productos
      : [];
  }

  obtenerNombreProducto(
    item: any
  ): string {
    if (
      typeof item?.nombre === 'string' &&
      item.nombre.trim()
    ) {
      return item.nombre.trim();
    }

    if (
      typeof item?.producto === 'string' &&
      item.producto.trim()
    ) {
      return item.producto.trim();
    }

    if (
      typeof item?.producto?.nombre ===
        'string' &&
      item.producto.nombre.trim()
    ) {
      return item.producto.nombre.trim();
    }

    if (
      typeof item?.descripcion ===
        'string' &&
      item.descripcion.trim()
    ) {
      return item.descripcion.trim();
    }

    return 'Producto';
  }

  obtenerCantidadProducto(
    item: any
  ): number {
    const cantidad = Number(
      item?.cantidad ??
      item?.cant ??
      item?.unidades ??
      0
    );

    return Number.isFinite(cantidad)
      ? cantidad
      : 0;
  }

  obtenerPrecioProducto(
    item: any
  ): number {
    const precio = Number(
      item?.precio ??
      item?.precioUnitario ??
      item?.precio_venta ??
      item?.precioVenta ??
      item?.producto?.precio ??
      item?.producto?.precioVenta ??
      0
    );

    return Number.isFinite(precio)
      ? precio
      : 0;
  }

  calcularTotalPedido(
    pedido: any
  ): number {
    const totalGuardado =
      Number(pedido?.total || 0);

    if (
      Number.isFinite(totalGuardado) &&
      totalGuardado > 0
    ) {
      return totalGuardado;
    }

    const productos =
      this.obtenerProductosPedido(
        pedido
      );

    const totalCalculado =
      productos.reduce(
        (total: number, item: any) => {
          const cantidad =
            this.obtenerCantidadProducto(
              item
            );

          const precio =
            this.obtenerPrecioProducto(
              item
            );

          return total +
            cantidad * precio;
        },
        0
      );

    return Number(
      totalCalculado.toFixed(2)
    );
  }

  // =====================================================
  // CIERRE DE CAJA
  // =====================================================

  async cerrarTurno(): Promise<void> {
    if (this.procesandoCierre) {
      return;
    }

    if (this.cajaCerrada) {
      this.mostrarMensaje(
        'La caja ya fue cerrada.',
        'advertencia'
      );
      return;
    }

    this.procesandoCierre = true;

    const cierreCaja = {
      origen: 'cierre_caja',
      tipo: 'cierre',

      fechaCaja:
        this.obtenerFechaCaja(),

      fecha:
        serverTimestamp(),

      fechaCierre:
        serverTimestamp(),

      usuario:
        this.usuarioCaja,

      horaApertura:
        this.horaApertura,

      fondoInicial:
        Number(
          this.fondoInicial.toFixed(2)
        ),

      totalVentas:
        Number(
          this.totalVentas.toFixed(2)
        ),

      cantidadVentas:
        this.cantidadVentas,

      totalIngresos:
        Number(
          this.totalIngresos.toFixed(2)
        ),

      totalEgresos:
        Number(
          this.totalEgresos.toFixed(2)
        ),

      totalEfectivo:
        Number(
          this.totalEfectivo.toFixed(2)
        ),

      totalYape:
        Number(
          this.totalYape.toFixed(2)
        ),

      totalPlin:
        Number(
          this.totalPlin.toFixed(2)
        ),

      totalTarjeta:
        Number(
          this.totalTarjeta.toFixed(2)
        ),

      totalCajaGeneral:
        Number(
          this.totalCaja.toFixed(2)
        ),

      efectivoEsperado:
        Number(
          this.totalCajaEfectivo.toFixed(2)
        ),

      totalPendienteCobro:
        Number(
          this.totalPendienteCobro.toFixed(2)
        ),

      cantidadPendientes:
        this.pedidosPorCobrar.length,

      estado: 'cerrada'
    };

    try {
      await addDoc(
        collection(
          this.firestore,
          'cierresCaja'
        ),
        cierreCaja
      );

      this.cajaCerrada = true;

      this.mostrarMensaje(
        'Caja cerrada correctamente.',
        'exito'
      );

      setTimeout(() => {
        window.print();
      }, 300);

    } catch (error) {
      console.error(
        '❌ Error cerrando caja:',
        error
      );

      this.mostrarMensaje(
        'No se pudo cerrar la caja.',
        'error'
      );

    } finally {
      this.procesandoCierre = false;
    }
  }

  imprimirResumen(): void {
    window.print();
  }

  // =====================================================
  // FECHAS
  // =====================================================

  obtenerFechaCaja(): string {
    const hoy = new Date();

    const year =
      hoy.getFullYear();

    const month = String(
      hoy.getMonth() + 1
    ).padStart(2, '0');

    const day = String(
      hoy.getDate()
    ).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  convertirFecha(
    fecha: any
  ): Date {
    if (!fecha) {
      return new Date(0);
    }

    if (
      typeof fecha.toDate ===
      'function'
    ) {
      return fecha.toDate();
    }

    if (
      typeof fecha.toMillis ===
      'function'
    ) {
      return new Date(
        fecha.toMillis()
      );
    }

    if (
      typeof fecha.seconds ===
      'number'
    ) {
      return new Date(
        fecha.seconds * 1000
      );
    }

    if (
      typeof fecha._seconds ===
      'number'
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

  esDelDiaActual(
    fecha: any,
    fechaCaja?: string
  ): boolean {
    const hoy =
      this.obtenerFechaCaja();

    if (
      fechaCaja &&
      fechaCaja === hoy
    ) {
      return true;
    }

    const fechaConvertida =
      this.convertirFecha(fecha);

    if (
      fechaConvertida.getTime() === 0
    ) {
      return false;
    }

    const year =
      fechaConvertida.getFullYear();

    const month = String(
      fechaConvertida.getMonth() + 1
    ).padStart(2, '0');

    const day = String(
      fechaConvertida.getDate()
    ).padStart(2, '0');

    return (
      `${year}-${month}-${day}` === hoy
    );
  }

  extraerHora(
    fecha: any
  ): string {
    const date =
      this.convertirFecha(fecha);

    if (
      date.getTime() === 0
    ) {
      return '--:--';
    }

    return date.toLocaleTimeString(
      'es-PE',
      {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }
    );
  }

  // =====================================================
  // NORMALIZACIÓN
  // =====================================================

  normalizarEstado(
    estado: any
  ): string {
    const valor =
      String(estado || '')
        .toLowerCase()
        .trim();

    if (valor === 'entregado') {
      return 'entregado_mesa';
    }

    if (valor === 'recogido') {
      return 'entregado_mesa';
    }

    if (valor === 'cancelado') {
      return 'anulado';
    }

    if (valor === 'paid') {
      return 'pagado';
    }

    return valor;
  }

  normalizarTipoMovimiento(
    tipo: any
  ): TipoMovimiento {
    const valor =
      String(tipo || '')
        .toLowerCase()
        .trim();

    if (valor === 'ingreso') {
      return 'ingreso';
    }

    if (valor === 'egreso') {
      return 'egreso';
    }

    return '';
  }

  normalizarMetodoPago(
    metodo: any
  ): MetodoPago {
    const valor =
      String(metodo || '')
        .toLowerCase()
        .trim();

    if (valor === 'efectivo') {
      return 'Efectivo';
    }

    if (valor === 'tarjeta') {
      return 'Tarjeta';
    }

    if (valor === 'yape') {
      return 'Yape';
    }

    if (valor === 'plin') {
      return 'Plin';
    }

    if (valor === 'retiro') {
      return 'Retiro';
    }

    return '';
  }

  normalizarTipoPedido(
    pedido: any
  ): string {
    const tipo =
      pedido?.tipoPedido ??
      pedido?.tipo ??
      pedido?.modalidad ??
      pedido?.origen ??
      '';

    return String(tipo)
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '_')
      .replace(/-/g, '_');
  }

  // =====================================================
  // MENSAJES
  // =====================================================

  mostrarMensaje(
    mensaje: string,
    tipo: TipoMensaje
  ): void {
    this.mensaje = mensaje;
    this.tipoMensaje = tipo;

    if (this.mensajeTimeout) {
      clearTimeout(
        this.mensajeTimeout
      );
    }

    this.mensajeTimeout =
      setTimeout(() => {
        this.mensaje = '';
        this.tipoMensaje = '';
        this.mensajeTimeout = null;
      }, 5000);
  }
}