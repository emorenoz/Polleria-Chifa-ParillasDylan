import {
  Component,
  OnInit,
  inject
} from '@angular/core';

import {
  CommonModule,
  DecimalPipe
} from '@angular/common';

import { FormsModule } from '@angular/forms';

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
  IonInput,
  IonButton,
  IonIcon,
  IonLabel,
  IonNote,
  IonButtons,
  IonBackButton,
  IonMenuButton
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';

import {
  analytics,
  documentTextOutline,
  arrowBack,
  downloadOutline
} from 'ionicons/icons';

import {
  Firestore,
  collection,
  getDocs
} from '@angular/fire/firestore';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { Capacitor } from '@capacitor/core';

import {
  Filesystem,
  Directory
} from '@capacitor/filesystem';

import { Share } from '@capacitor/share';

/* =========================================================
   TIPOS
========================================================= */

type RangoTiempo =
  | 'Esta semana'
  | 'Este mes'
  | 'Últimos 3 meses'
  | 'Este año';

interface FiltrosReporte {
  fechaInicio: string;
  fechaFin: string;
}

interface KpisReporte {
  totalIngresos: number;
  totalPedidos: number;
  ticketPromedio: number;
}

interface MetodoPagoReporte {
  nombre: string;
  transacciones: number;
  monto: number;
  porcentaje: number;
  color: string;
}

interface ProductoReporte {
  nombre: string;
  nombreOriginal: string;
  cantidad: number;
  porcentaje: number;
}

interface VentaMensual {
  clave: string;
  mes: string;
  total: number;
  pedidos: number;
  porcentajeTotal: number;
  porcentajePedidos: number;
}

interface VentaAmPm {
  dia: string;

  /*
   * am y pm contienen porcentajes entre 0 y 100.
   * Esto mantiene compatibilidad con gráficos que usan:
   *
   * [style.height.%]="item.am"
   * [style.height.%]="item.pm"
   */
  am: number;
  pm: number;

  montoAm: number;
  montoPm: number;
}

interface AcumuladoMetodo {
  nombre: string;
  transacciones: number;
  monto: number;
}

interface AcumuladoProducto {
  nombre: string;
  cantidad: number;
}

interface AcumuladoMes {
  clave: string;
  mes: string;
  total: number;
  pedidos: number;
}

interface AcumuladoDia {
  dia: string;
  am: number;
  pm: number;
}

interface DocumentoVenta {
  fecha?: unknown;
  fechaVenta?: unknown;
  fechaPedido?: unknown;
  creadoEn?: unknown;

  total?: unknown;
  montoTotal?: unknown;
  totalVenta?: unknown;

  metodoPago?: unknown;
  metodo?: unknown;
  formaPago?: unknown;

  estado?: unknown;
  estadoVenta?: unknown;

  productos?: unknown;
  items?: unknown;
  detalle?: unknown;
}

@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.page.html',
  styleUrls: ['./reportes.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DecimalPipe,

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
    IonInput,
    IonButton,
    IonIcon,
    IonLabel,
    IonNote,
    IonButtons,
    IonBackButton,
    IonMenuButton
  ]
})
export class ReportesPage implements OnInit {

  /* =========================================================
     SERVICIOS
  ========================================================= */

  private readonly firestore = inject(Firestore);

  /* =========================================================
     INTERFAZ
  ========================================================= */

  fechaActual = '';

  readonly rangosTiempo: RangoTiempo[] = [
    'Esta semana',
    'Este mes',
    'Últimos 3 meses',
    'Este año'
  ];

  rangoSeleccionado: RangoTiempo = 'Este mes';

  readonly coloresMetodo = [
    'green',
    'blue',
    'purple',
    'amber'
  ];

  filtros: FiltrosReporte = {
    fechaInicio: '',
    fechaFin: ''
  };

  cargando = false;
  reporteGenerado = false;

  kpis: KpisReporte = {
    totalIngresos: 0,
    totalPedidos: 0,
    ticketPromedio: 0
  };

  metodosPagoDisplay: MetodoPagoReporte[] = [];
  topProductos: ProductoReporte[] = [];
  ventasMensuales: VentaMensual[] = [];
  ventasAmPm: VentaAmPm[] = [];

  totalVentasAm = 0;
  totalVentasPm = 0;

  /* =========================================================
     CONSTRUCTOR
  ========================================================= */

  constructor() {
    addIcons({
      analytics,
      documentTextOutline,
      arrowBack,
      downloadOutline
    });
  }

  /* =========================================================
     CICLO DE VIDA
  ========================================================= */

  ngOnInit(): void {
    this.configurarFecha();
    this.seleccionarRango('Este mes');
  }

  /* =========================================================
     FECHA DEL ENCABEZADO
  ========================================================= */

  private configurarFecha(): void {
    const opciones: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };

    const fecha = new Date().toLocaleDateString(
      'es-PE',
      opciones
    );

    this.fechaActual =
      fecha.charAt(0).toUpperCase() +
      fecha.slice(1);
  }

  /* =========================================================
     RANGOS
  ========================================================= */

  seleccionarRango(rango: string): void {
    if (!this.esRangoValido(rango)) {
      return;
    }

    this.rangoSeleccionado = rango;

    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999);

    const fechaInicio = new Date();
    fechaInicio.setHours(0, 0, 0, 0);

    switch (rango) {
      case 'Esta semana': {
        const diaSemana = fechaInicio.getDay();

        const distanciaALunes =
          diaSemana === 0
            ? 6
            : diaSemana - 1;

        fechaInicio.setDate(
          fechaInicio.getDate() -
          distanciaALunes
        );

        break;
      }

      case 'Este mes':
        fechaInicio.setDate(1);
        break;

      case 'Últimos 3 meses':
        /*
         * Incluye el mes actual y los dos anteriores.
         * Ejemplo: julio, junio y mayo.
         */
        fechaInicio.setDate(1);
        fechaInicio.setMonth(
          fechaInicio.getMonth() - 2
        );
        break;

      case 'Este año':
        fechaInicio.setMonth(0, 1);
        break;
    }

    this.filtros.fechaInicio =
      this.formatearFechaInput(fechaInicio);

    this.filtros.fechaFin =
      this.formatearFechaInput(hoy);

    void this.generarReporte();
  }

  private esRangoValido(
    rango: string
  ): rango is RangoTiempo {
    return this.rangosTiempo.includes(
      rango as RangoTiempo
    );
  }

  private formatearFechaInput(
    fecha: Date
  ): string {
    const anio = fecha.getFullYear();

    const mes = String(
      fecha.getMonth() + 1
    ).padStart(2, '0');

    const dia = String(
      fecha.getDate()
    ).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  }

  /* =========================================================
     GENERAR REPORTE
  ========================================================= */

  async generarReporte(): Promise<void> {
    if (this.cargando) {
      return;
    }

    if (
      !this.filtros.fechaInicio ||
      !this.filtros.fechaFin
    ) {
      alert('Selecciona una fecha de inicio y una fecha final.');
      return;
    }

    const inicioDate = new Date(
      `${this.filtros.fechaInicio}T00:00:00`
    );

    const finDate = new Date(
      `${this.filtros.fechaFin}T23:59:59.999`
    );

    if (
      Number.isNaN(inicioDate.getTime()) ||
      Number.isNaN(finDate.getTime())
    ) {
      alert('El rango de fechas no es válido.');
      return;
    }

    if (inicioDate > finDate) {
      alert('La fecha de inicio no puede ser mayor que la fecha final.');
      return;
    }

    this.cargando = true;
    this.reporteGenerado = false;

    this.limpiarResultados();

    try {
      /*
       * Se descargan las ventas y se filtran localmente.
       *
       * Esto evita que el reporte falle cuando algunos documentos
       * guardan "fecha" como Timestamp y otros como texto ISO.
       *
       * Para una pollería con una cantidad moderada de ventas,
       * esta opción es más segura y funcional.
       */
      const ventasRef = collection(
        this.firestore,
        'ventas'
      );

      const snapshot = await getDocs(ventasRef);

      let totalIngresos = 0;
      let totalPedidos = 0;

      const mapaPagos:
        Record<string, AcumuladoMetodo> = {};

      const mapaProductos:
        Record<string, AcumuladoProducto> = {};

      const mapaMeses:
        Record<string, AcumuladoMes> = {};

      const mapaDiasAmPm:
        Record<string, AcumuladoDia> = {};

      snapshot.forEach(documento => {
        const data =
          documento.data() as DocumentoVenta;

        if (this.ventaEstaAnulada(data)) {
          return;
        }

        const fechaVenta =
          this.obtenerFechaVenta(data);

        if (!fechaVenta) {
          console.warn(
            'Venta sin fecha válida:',
            documento.id
          );

          return;
        }

        if (
          fechaVenta < inicioDate ||
          fechaVenta > finDate
        ) {
          return;
        }

        const total =
          this.obtenerTotalVenta(data);

        if (total < 0) {
          return;
        }

        totalIngresos += total;
        totalPedidos++;

        /* -------------------------
           MÉTODO DE PAGO
        ------------------------- */

        const metodo =
          this.normalizarMetodoPago(
            data.metodoPago ??
            data.metodo ??
            data.formaPago
          );

        if (!mapaPagos[metodo]) {
          mapaPagos[metodo] = {
            nombre: metodo,
            transacciones: 0,
            monto: 0
          };
        }

        mapaPagos[metodo].transacciones++;
        mapaPagos[metodo].monto += total;

        /* -------------------------
           VENTAS MENSUALES
        ------------------------- */

        const claveMes =
          this.obtenerClaveMes(fechaVenta);

        const etiquetaMes =
          this.obtenerEtiquetaMes(fechaVenta);

        if (!mapaMeses[claveMes]) {
          mapaMeses[claveMes] = {
            clave: claveMes,
            mes: etiquetaMes,
            total: 0,
            pedidos: 0
          };
        }

        mapaMeses[claveMes].total += total;
        mapaMeses[claveMes].pedidos++;

        /* -------------------------
           VENTAS AM / PM
        ------------------------- */

        const dia =
          this.obtenerDiaSemana(fechaVenta);

        if (!mapaDiasAmPm[dia]) {
          mapaDiasAmPm[dia] = {
            dia,
            am: 0,
            pm: 0
          };
        }

        const hora =
          fechaVenta.getHours();

        if (hora < 12) {
          mapaDiasAmPm[dia].am += total;
        } else {
          mapaDiasAmPm[dia].pm += total;
        }

        /* -------------------------
           PRODUCTOS
        ------------------------- */

        const productos =
          this.obtenerProductos(data);

        productos.forEach(producto => {
          const nombre =
            this.obtenerNombreProducto(producto);

          const cantidad =
            this.obtenerCantidadProducto(producto);

          const claveProducto =
            nombre.trim().toLowerCase();

          if (!mapaProductos[claveProducto]) {
            mapaProductos[claveProducto] = {
              nombre,
              cantidad: 0
            };
          }

          mapaProductos[claveProducto].cantidad +=
            cantidad;
        });
      });

      this.kpis = {
        totalIngresos:
          this.redondearDinero(totalIngresos),

        totalPedidos,

        ticketPromedio:
          totalPedidos > 0
            ? this.redondearDinero(
                totalIngresos / totalPedidos
              )
            : 0
      };

      this.construirMetodosPago(mapaPagos);
      this.construirTopProductos(mapaProductos);
      this.construirVentasMensuales(mapaMeses);
      this.construirVentasAmPm(mapaDiasAmPm);

      this.reporteGenerado = true;

    } catch (error) {
      console.error(
        'Error generando reporte:',
        error
      );

      this.reporteGenerado = false;

      alert(
        'No se pudo generar el reporte. Verifica tu conexión con Firebase.'
      );

    } finally {
      this.cargando = false;
    }
  }

  /* =========================================================
     CONSTRUIR RESULTADOS
  ========================================================= */

  private construirMetodosPago(
    mapaPagos: Record<string, AcumuladoMetodo>
  ): void {
    const ordenMetodos = [
      'Efectivo',
      'Tarjeta',
      'Yape',
      'Plin',
      'Otro'
    ];

    const metodos =
      Object.values(mapaPagos)
        .sort((a, b) => {
          const indiceA =
            ordenMetodos.indexOf(a.nombre);

          const indiceB =
            ordenMetodos.indexOf(b.nombre);

          const ordenA =
            indiceA === -1 ? 99 : indiceA;

          const ordenB =
            indiceB === -1 ? 99 : indiceB;

          if (ordenA !== ordenB) {
            return ordenA - ordenB;
          }

          return b.monto - a.monto;
        });

    this.metodosPagoDisplay =
      metodos.map((metodo, index) => ({
        nombre: metodo.nombre,

        transacciones:
          metodo.transacciones,

        monto:
          this.redondearDinero(metodo.monto),

        porcentaje:
          this.calcularPorcentajePago(
            metodo.monto
          ),

        color:
          this.coloresMetodo[
            index % this.coloresMetodo.length
          ]
      }));
  }

  private construirTopProductos(
    mapaProductos:
      Record<string, AcumuladoProducto>
  ): void {
    const productosOrdenados =
      Object.values(mapaProductos)
        .sort(
          (a, b) =>
            b.cantidad - a.cantidad
        )
        .slice(0, 6);

    const maxCantidad =
      productosOrdenados.length > 0
        ? productosOrdenados[0].cantidad
        : 0;

    this.topProductos =
      productosOrdenados.map(
        (producto, index) => ({
          nombre:
            `#${index + 1} ${producto.nombre}`,

          nombreOriginal:
            producto.nombre,

          cantidad:
            producto.cantidad,

          porcentaje:
            maxCantidad > 0
              ? Math.round(
                  (
                    producto.cantidad /
                    maxCantidad
                  ) * 100
                )
              : 0
        })
      );
  }

  private construirVentasMensuales(
    mapaMeses: Record<string, AcumuladoMes>
  ): void {
    const mesesOrdenados =
      Object.values(mapaMeses)
        .sort(
          (a, b) =>
            a.clave.localeCompare(b.clave)
        );

    const maxTotal =
      mesesOrdenados.reduce(
        (maximo, mes) =>
          Math.max(maximo, mes.total),
        0
      );

    const maxPedidos =
      mesesOrdenados.reduce(
        (maximo, mes) =>
          Math.max(maximo, mes.pedidos),
        0
      );

    this.ventasMensuales =
      mesesOrdenados.map(mes => ({
        clave: mes.clave,
        mes: mes.mes,

        total:
          this.redondearDinero(mes.total),

        pedidos:
          mes.pedidos,

        porcentajeTotal:
          maxTotal > 0
            ? Math.round(
                (mes.total / maxTotal) * 100
              )
            : 0,

        porcentajePedidos:
          maxPedidos > 0
            ? Math.round(
                (mes.pedidos / maxPedidos) * 100
              )
            : 0
      }));
  }

  private construirVentasAmPm(
    mapaDias:
      Record<string, AcumuladoDia>
  ): void {
    const ordenDias = [
      'Lun',
      'Mar',
      'Mié',
      'Jue',
      'Vie',
      'Sáb',
      'Dom'
    ];

    const diasCompletos =
      ordenDias.map(dia => ({
        dia,

        am:
          Number(
            mapaDias[dia]?.am ?? 0
          ),

        pm:
          Number(
            mapaDias[dia]?.pm ?? 0
          )
      }));

    const valorMaximo =
      diasCompletos.reduce(
        (maximo, registro) =>
          Math.max(
            maximo,
            registro.am,
            registro.pm
          ),
        0
      );

    this.totalVentasAm =
      this.redondearDinero(
        diasCompletos.reduce(
          (total, registro) =>
            total + registro.am,
          0
        )
      );

    this.totalVentasPm =
      this.redondearDinero(
        diasCompletos.reduce(
          (total, registro) =>
            total + registro.pm,
          0
        )
      );

    this.ventasAmPm =
      diasCompletos.map(registro => ({
        dia: registro.dia,

        /*
         * Estos porcentajes pueden usarse directamente
         * como altura o ancho de una barra.
         */
        am:
          valorMaximo > 0
            ? Math.round(
                (
                  registro.am /
                  valorMaximo
                ) * 100
              )
            : 0,

        pm:
          valorMaximo > 0
            ? Math.round(
                (
                  registro.pm /
                  valorMaximo
                ) * 100
              )
            : 0,

        montoAm:
          this.redondearDinero(
            registro.am
          ),

        montoPm:
          this.redondearDinero(
            registro.pm
          )
      }));
  }

  /* =========================================================
     UTILIDADES DE VENTAS
  ========================================================= */

  private ventaEstaAnulada(
    data: DocumentoVenta
  ): boolean {
    const estado = String(
      data.estado ??
      data.estadoVenta ??
      ''
    )
      .trim()
      .toLowerCase();

    return [
      'anulado',
      'anulada',
      'cancelado',
      'cancelada'
    ].includes(estado);
  }

  private obtenerTotalVenta(
    data: DocumentoVenta
  ): number {
    const valor =
      data.total ??
      data.montoTotal ??
      data.totalVenta ??
      0;

    const total = Number(valor);

    return Number.isFinite(total)
      ? total
      : 0;
  }

  private obtenerFechaVenta(
    data: DocumentoVenta
  ): Date | null {
    return this.convertirFecha(
      data.fecha ??
      data.fechaVenta ??
      data.fechaPedido ??
      data.creadoEn
    );
  }

  convertirFecha(
    fecha: unknown
  ): Date | null {
    if (!fecha) {
      return null;
    }

    if (fecha instanceof Date) {
      return Number.isNaN(fecha.getTime())
        ? null
        : fecha;
    }

    if (
      typeof fecha === 'object' &&
      fecha !== null
    ) {
      const valor =
        fecha as {
          toDate?: () => Date;
          seconds?: number;
          nanoseconds?: number;
        };

      if (
        typeof valor.toDate === 'function'
      ) {
        const resultado = valor.toDate();

        return Number.isNaN(
          resultado.getTime()
        )
          ? null
          : resultado;
      }

      if (
        typeof valor.seconds === 'number'
      ) {
        const resultado = new Date(
          valor.seconds * 1000
        );

        return Number.isNaN(
          resultado.getTime()
        )
          ? null
          : resultado;
      }
    }

    if (
      typeof fecha === 'number' ||
      typeof fecha === 'string'
    ) {
      const resultado = new Date(fecha);

      return Number.isNaN(
        resultado.getTime()
      )
        ? null
        : resultado;
    }

    return null;
  }

  private normalizarMetodoPago(
    valor: unknown
  ): string {
    const metodo = String(
      valor ?? 'Efectivo'
    )
      .trim()
      .toLowerCase();

    if (metodo.includes('efectivo')) {
      return 'Efectivo';
    }

    if (
      metodo.includes('tarjeta') ||
      metodo.includes('visa') ||
      metodo.includes('mastercard') ||
      metodo.includes('pos')
    ) {
      return 'Tarjeta';
    }

    if (metodo.includes('yape')) {
      return 'Yape';
    }

    if (metodo.includes('plin')) {
      return 'Plin';
    }

    if (!metodo) {
      return 'Efectivo';
    }

    return this.capitalizarTexto(metodo);
  }

  private obtenerProductos(
    data: DocumentoVenta
  ): Record<string, unknown>[] {
    const productos =
      data.productos ??
      data.items ??
      data.detalle ??
      [];

    return Array.isArray(productos)
      ? productos.filter(
          producto =>
            typeof producto === 'object' &&
            producto !== null
        ) as Record<string, unknown>[]
      : [];
  }

  private obtenerNombreProducto(
    producto: Record<string, unknown>
  ): string {
    const nombre = String(
      producto['nombre'] ??
      producto['producto'] ??
      producto['descripcion'] ??
      'Producto sin nombre'
    ).trim();

    return nombre ||
      'Producto sin nombre';
  }

  private obtenerCantidadProducto(
    producto: Record<string, unknown>
  ): number {
    const cantidad = Number(
      producto['cantidad'] ??
      producto['qty'] ??
      producto['unidades'] ??
      1
    );

    if (
      !Number.isFinite(cantidad) ||
      cantidad <= 0
    ) {
      return 1;
    }

    return cantidad;
  }

  obtenerEtiquetaMes(
    fecha: Date
  ): string {
    const meses = [
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic'
    ];

    const incluirAnio =
      this.rangoSeleccionado ===
      'Este año' ||
      this.rangoSeleccionado ===
      'Últimos 3 meses';

    const mes =
      meses[fecha.getMonth()];

    return incluirAnio
      ? `${mes} ${fecha.getFullYear()}`
      : mes;
  }

  private obtenerClaveMes(
    fecha: Date
  ): string {
    const mes = String(
      fecha.getMonth() + 1
    ).padStart(2, '0');

    return `${fecha.getFullYear()}-${mes}`;
  }

  obtenerDiaSemana(
    fecha: Date
  ): string {
    const dias = [
      'Dom',
      'Lun',
      'Mar',
      'Mié',
      'Jue',
      'Vie',
      'Sáb'
    ];

    return dias[fecha.getDay()];
  }

  calcularPorcentajePago(
    monto: number
  ): number {
    if (
      this.kpis.totalIngresos <= 0 ||
      monto <= 0
    ) {
      return 0;
    }

    return Math.round(
      (
        monto /
        this.kpis.totalIngresos
      ) * 100
    );
  }

  private redondearDinero(
    valor: number
  ): number {
    return Math.round(
      (valor + Number.EPSILON) * 100
    ) / 100;
  }

  private capitalizarTexto(
    texto: string
  ): string {
    return texto
      .split(' ')
      .filter(Boolean)
      .map(
        palabra =>
          palabra.charAt(0).toUpperCase() +
          palabra.slice(1)
      )
      .join(' ');
  }

  private limpiarResultados(): void {
    this.kpis = {
      totalIngresos: 0,
      totalPedidos: 0,
      ticketPromedio: 0
    };

    this.metodosPagoDisplay = [];
    this.topProductos = [];
    this.ventasMensuales = [];
    this.ventasAmPm = [];

    this.totalVentasAm = 0;
    this.totalVentasPm = 0;
  }

  /* =========================================================
     EXPORTACIÓN PDF
  ========================================================= */

  async exportarPDF(): Promise<void> {
    if (
      !this.reporteGenerado ||
      this.cargando
    ) {
      alert('Primero genera un reporte.');
      return;
    }

    try {
      const docPdf =
        new jsPDF(
          'portrait',
          'mm',
          'a4'
        );

      docPdf.setProperties({
        title:
          'Reporte de Ventas - Pollería Dylan',

        subject:
          'Reporte de ventas',

        author:
          'Pollería Dylan',

        creator:
          'Sistema Pollería Dylan'
      });

      docPdf.setFontSize(17);
      docPdf.text(
        'Reporte de Ventas - Pollería Dylan',
        14,
        16
      );

      docPdf.setFontSize(9);
      docPdf.setTextColor(80);

      docPdf.text(
        `Fecha de exportación: ${this.fechaActual}`,
        14,
        25
      );

      docPdf.text(
        `Rango: ${this.rangoSeleccionado}`,
        14,
        31
      );

      docPdf.text(
        `Desde: ${this.filtros.fechaInicio}`,
        14,
        37
      );

      docPdf.text(
        `Hasta: ${this.filtros.fechaFin}`,
        14,
        43
      );

      docPdf.setTextColor(0);
      docPdf.setFontSize(12);

      docPdf.text(
        `Total ingresos: S/ ${this.kpis.totalIngresos.toFixed(2)}`,
        14,
        56
      );

      docPdf.text(
        `Total pedidos: ${this.kpis.totalPedidos}`,
        14,
        64
      );

      docPdf.text(
        `Ticket promedio: S/ ${this.kpis.ticketPromedio.toFixed(2)}`,
        14,
        72
      );

      const filasPago =
        this.metodosPagoDisplay.map(
          metodo => [
            metodo.nombre,
            String(metodo.transacciones),
            `S/ ${metodo.monto.toFixed(2)}`,
            `${metodo.porcentaje}%`
          ]
        );

      autoTable(docPdf, {
        startY: 83,

        head: [[
          'Método de pago',
          'Transacciones',
          'Monto',
          'Porcentaje'
        ]],

        body:
          filasPago.length > 0
            ? filasPago
            : [[
                'Sin datos',
                '0',
                'S/ 0.00',
                '0%'
              ]],

        styles: {
          fontSize: 8.5,
          halign: 'center',
          valign: 'middle'
        },

        headStyles: {
          fillColor: [126, 58, 242],
          textColor: [255, 255, 255],
          halign: 'center'
        }
      });

      const finalY =
        (
          docPdf as jsPDF & {
            lastAutoTable?: {
              finalY: number;
            };
          }
        ).lastAutoTable?.finalY ?? 110;

      const filasProductos =
        this.topProductos.map(
          producto => [
            producto.nombreOriginal,
            String(producto.cantidad),
            `${producto.porcentaje}%`
          ]
        );

      autoTable(docPdf, {
        startY: finalY + 10,

        head: [[
          'Producto',
          'Cantidad vendida',
          'Porcentaje relativo'
        ]],

        body:
          filasProductos.length > 0
            ? filasProductos
            : [[
                'Sin datos',
                '0',
                '0%'
              ]],

        styles: {
          fontSize: 8.5,
          halign: 'center',
          valign: 'middle'
        },

        headStyles: {
          fillColor: [126, 58, 242],
          textColor: [255, 255, 255],
          halign: 'center'
        },

        columnStyles: {
          0: {
            halign: 'left',
            cellWidth: 105
          },

          1: {
            cellWidth: 35
          },

          2: {
            cellWidth: 40
          }
        }
      });

      this.agregarPieDePagina(docPdf);

      const fechaArchivo =
        this.formatearFechaInput(
          new Date()
        );

      const nombreArchivo =
        `reporte_ventas_${fechaArchivo}.pdf`;

      if (
        Capacitor.isNativePlatform()
      ) {
        await this.descargarPDFAndroid(
          docPdf,
          nombreArchivo
        );
      } else {
        docPdf.save(nombreArchivo);
      }

    } catch (error) {
      console.error(
        'Error exportando PDF:',
        error
      );

      alert(
        'No se pudo generar el archivo PDF.'
      );
    }
  }

  private agregarPieDePagina(
    docPdf: jsPDF
  ): void {
    const totalPaginas =
      docPdf.getNumberOfPages();

    for (
      let pagina = 1;
      pagina <= totalPaginas;
      pagina++
    ) {
      docPdf.setPage(pagina);

      docPdf.setFontSize(8);
      docPdf.setTextColor(120);

      docPdf.text(
        `Pollería Dylan · Página ${pagina} de ${totalPaginas}`,
        105,
        290,
        {
          align: 'center'
        }
      );
    }

    docPdf.setTextColor(0);
  }

  private async descargarPDFAndroid(
    docPdf: jsPDF,
    nombreArchivo: string
  ): Promise<void> {
    try {
      const dataUri =
        docPdf.output('datauristring');

      const pdfBase64 =
        dataUri.includes(',')
          ? dataUri.split(',')[1]
          : dataUri;

      const resultado =
        await Filesystem.writeFile({
          path: nombreArchivo,
          data: pdfBase64,
          directory: Directory.Documents,
          recursive: true
        });

      await Share.share({
        title: 'Reporte de ventas',
        text:
          'Reporte PDF generado desde Pollería Dylan.',
        url: resultado.uri,
        dialogTitle:
          'Guardar o compartir PDF'
      });

      console.log(
        'PDF exportado:',
        resultado.uri
      );

    } catch (error) {
      console.error(
        'Error exportando PDF en Android:',
        error
      );

      alert(
        'No se pudo exportar el PDF en Android.'
      );
    }
  }
}