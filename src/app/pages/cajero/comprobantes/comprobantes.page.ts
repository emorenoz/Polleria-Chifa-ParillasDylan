import {
  Component,
  OnDestroy,
  OnInit,
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
  chevronDownOutline,
  chevronUpOutline,
  documentTextOutline,
  eyeOutline,
  printOutline,
  receiptOutline,
  refreshOutline,
  searchOutline
} from 'ionicons/icons';

interface GrupoComprobantes {
  fecha: string;
  fechaOrden: number;
  comprobantes: any[];
  cantidad: number;
  totalDia: number;
  expandido: boolean;
}

type MetodoPago =
  | 'todos'
  | 'Efectivo'
  | 'Yape'
  | 'Plin'
  | 'Tarjeta';

@Component({
  selector: 'app-comprobantes',
  templateUrl: './comprobantes.page.html',
  styleUrls: ['./comprobantes.page.scss'],
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
export class ComprobantesPage implements OnInit, OnDestroy {

  private firestore = inject(Firestore);
  private router = inject(Router);

  private ventasSubscription?: Subscription;

  comprobantes: any[] = [];
  comprobantesFiltrados: any[] = [];
  comprobantesAgrupados: GrupoComprobantes[] = [];

  comprobanteSeleccionado: any | null = null;

  textoBusqueda: string = '';
  fechaSeleccionada: string = '';
  metodoSeleccionado: MetodoPago = 'todos';

  totalComprobantes: number = 0;
  totalImporte: number = 0;

  constructor() {
    addIcons({
      arrowBackOutline,
      calendarOutline,
      chevronDownOutline,
      chevronUpOutline,
      documentTextOutline,
      eyeOutline,
      printOutline,
      receiptOutline,
      refreshOutline,
      searchOutline
    });
  }

  ngOnInit(): void {
    this.cargarComprobantes();
  }

  ngOnDestroy(): void {
    if (this.ventasSubscription) {
      this.ventasSubscription.unsubscribe();
    }
  }

  // =====================================================
  // CARGAR TODOS LOS COMPROBANTES
  // =====================================================

  cargarComprobantes(): void {
    const ventasRef = collection(
      this.firestore,
      'ventas'
    );

    this.ventasSubscription = collectionData(
      ventasRef,
      { idField: 'id' }
    ).subscribe({
      next: (ventas: any[]) => {
        this.comprobantes = (ventas || [])
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
          'Error cargando comprobantes:',
          error
        );

        this.comprobantes = [];
        this.comprobantesFiltrados = [];
        this.comprobantesAgrupados = [];
        this.totalComprobantes = 0;
        this.totalImporte = 0;
      }
    });
  }

  // =====================================================
  // FILTRAR COMPROBANTES
  // =====================================================

  aplicarFiltros(): void {
    const busqueda =
      this.normalizarTexto(this.textoBusqueda);

    this.comprobantesFiltrados =
      this.comprobantes.filter(comprobante => {

        const fechaComprobante =
          comprobante.fechaCaja ||
          this.obtenerFechaCajaDesdeFecha(
            comprobante.fecha
          );

        const textoComprobante =
          this.normalizarTexto(
            [
              comprobante.id,
              comprobante.idVenta,
              comprobante.numeroPedido,
              comprobante.mesa,
              comprobante.clienteNombre,
              comprobante.nombreCliente,
              comprobante.clienteTelefono,
              comprobante.telefonoCliente,
              comprobante.metodoPago,
              comprobante.cajero,
              comprobante.mesero
            ].join(' ')
          );

        const coincideBusqueda =
          !busqueda ||
          textoComprobante.includes(busqueda);

        const coincideFecha =
          !this.fechaSeleccionada ||
          fechaComprobante ===
            this.fechaSeleccionada;

        const coincideMetodo =
          this.metodoSeleccionado === 'todos' ||
          String(
            comprobante.metodoPago || ''
          ).toLowerCase() ===
          this.metodoSeleccionado.toLowerCase();

        return (
          coincideBusqueda &&
          coincideFecha &&
          coincideMetodo
        );
      });

    this.totalComprobantes =
      this.comprobantesFiltrados.length;

    this.totalImporte =
      this.comprobantesFiltrados.reduce(
        (
          total: number,
          comprobante: any
        ) =>
          total +
          Number(comprobante.total || 0),
        0
      );

    this.agruparComprobantesPorDia();
  }

  limpiarFiltros(): void {
    this.textoBusqueda = '';
    this.fechaSeleccionada = '';
    this.metodoSeleccionado = 'todos';

    this.aplicarFiltros();
  }

  // =====================================================
  // AGRUPAR POR DÍA
  // =====================================================

  agruparComprobantesPorDia(): void {
    const mapa =
      new Map<string, any[]>();

    for (
      const comprobante of
      this.comprobantesFiltrados
    ) {
      const fechaGrupo =
        comprobante.fechaCaja ||
        this.obtenerFechaCajaDesdeFecha(
          comprobante.fecha
        );

      if (!mapa.has(fechaGrupo)) {
        mapa.set(fechaGrupo, []);
      }

      mapa.get(fechaGrupo)?.push(
        comprobante
      );
    }

    this.comprobantesAgrupados =
      Array.from(mapa.entries())
        .map(([fecha, comprobantes]) => {

          const fechaOrden =
            fecha === 'sin-fecha'
              ? 0
              : new Date(
                  `${fecha}T00:00:00`
                ).getTime();

          const comprobantesOrdenados =
            [...comprobantes].sort(
              (a, b) =>
                this.obtenerTime(b.fecha) -
                this.obtenerTime(a.fecha)
            );

          return {
            fecha,
            fechaOrden,
            comprobantes:
              comprobantesOrdenados,
            cantidad:
              comprobantesOrdenados.length,
            totalDia:
              comprobantesOrdenados.reduce(
                (
                  total: number,
                  item: any
                ) =>
                  total +
                  Number(item.total || 0),
                0
              ),
            expandido: true
          };
        })
        .sort(
          (a, b) =>
            b.fechaOrden - a.fechaOrden
        );
  }

  cambiarExpandido(
    grupo: GrupoComprobantes
  ): void {
    grupo.expandido =
      !grupo.expandido;
  }

  // =====================================================
  // DETALLE
  // =====================================================

  verDetalle(
    comprobante: any
  ): void {
    this.comprobanteSeleccionado =
      comprobante;
  }

  cerrarDetalle(): void {
    this.comprobanteSeleccionado = null;
  }

  obtenerItems(
    comprobante: any
  ): any[] {
    const items =
      comprobante?.items ??
      comprobante?.productos ??
      comprobante?.pedido ??
      [];

    return Array.isArray(items)
      ? items
      : [];
  }

  obtenerNombreProducto(
    item: any
  ): string {
    if (
      typeof item?.producto === 'string' &&
      item.producto.trim()
    ) {
      return item.producto.trim();
    }

    if (
      typeof item?.nombre === 'string' &&
      item.nombre.trim()
    ) {
      return item.nombre.trim();
    }

    if (
      typeof item?.producto?.nombre ===
        'string'
    ) {
      return item.producto.nombre;
    }

    return 'Producto';
  }

  obtenerCantidad(
    item: any
  ): number {
    const cantidad = Number(
      item?.cantidad ??
      item?.cant ??
      item?.unidades ??
      0
    );

    return Number.isNaN(cantidad)
      ? 0
      : cantidad;
  }

  obtenerPrecio(
    item: any
  ): number {
    const precio = Number(
      item?.precioUnitario ??
      item?.precio ??
      item?.precio_venta ??
      item?.precioVenta ??
      item?.producto?.precio ??
      0
    );

    return Number.isNaN(precio)
      ? 0
      : precio;
  }

  obtenerCodigo(
    comprobante: any
  ): string {
    const codigo =
      comprobante?.idVenta ??
      comprobante?.id ??
      comprobante?.numeroPedido ??
      'SIN-ID';

    return String(codigo)
      .slice(-6)
      .toUpperCase();
  }

  obtenerTituloComprobante(
    comprobante: any
  ): string {
    const tipo =
      this.normalizarTipoPedido(
        comprobante
      );

    if (tipo === 'para_llevar') {
      return 'Pedido para llevar';
    }

    return `Mesa ${
      comprobante?.mesa ||
      comprobante?.numeroMesa ||
      '-'
    }`;
  }

  normalizarTipoPedido(
    comprobante: any
  ): string {
    const tipo =
      comprobante?.tipoPedido ??
      comprobante?.tipo ??
      comprobante?.modalidad ??
      comprobante?.origen ??
      '';

    return this.normalizarTexto(tipo)
      .replace(/\s+/g, '_')
      .replace(/-/g, '_');
  }

  // =====================================================
  // IMPRIMIR COMPROBANTE
  // =====================================================

  imprimirComprobante(
    comprobante: any
  ): void {
    const items =
      this.obtenerItems(comprobante);

    const filas = items
      .map(item => {
        const nombre =
          this.escaparHtml(
            this.obtenerNombreProducto(item)
          );

        const cantidad =
          this.obtenerCantidad(item);

        const precio =
          this.obtenerPrecio(item);

        const subtotal =
          cantidad * precio;

        return `
          <tr>
            <td>${cantidad}</td>
            <td>${nombre}</td>
            <td class="derecha">
              S/ ${subtotal.toFixed(2)}
            </td>
          </tr>
        `;
      })
      .join('');

    const ventana = window.open(
      '',
      '_blank',
      'width=480,height=720'
    );

    if (!ventana) {
      console.error(
        'El navegador bloqueó la ventana de impresión.'
      );
      return;
    }

    ventana.document.write(`
      <!DOCTYPE html>
      <html lang="es">

        <head>
          <meta charset="UTF-8">

          <title>
            Comprobante ${this.obtenerCodigo(comprobante)}
          </title>

          <style>
            body {
              width: 340px;
              margin: 0 auto;
              padding: 20px;
              color: #111;
              font-family: "Courier New", monospace;
            }

            h1,
            p {
              margin: 4px 0;
              text-align: center;
            }

            .separador {
              margin: 12px 0;
              border-top: 1px dashed #111;
            }

            .informacion {
              font-size: 13px;
              line-height: 1.6;
            }

            table {
              width: 100%;
              border-collapse: collapse;
            }

            th,
            td {
              padding: 6px 0;
              text-align: left;
              font-size: 12px;
            }

            .derecha {
              text-align: right;
            }

            .total {
              display: flex;
              justify-content: space-between;
              margin-top: 10px;
              font-size: 18px;
              font-weight: bold;
            }
          </style>
        </head>

        <body>

          <h1>POLLERÍA DYLAN</h1>
          <p>COMPROBANTE DE PAGO</p>

          <div class="separador"></div>

          <div class="informacion">

            <b>Código:</b>
            #${this.obtenerCodigo(comprobante)}
            <br>

            <b>Fecha:</b>
            ${this.formatearFechaHora(
              comprobante.fecha
            )}
            <br>

            <b>Pedido:</b>
            ${this.escaparHtml(
              this.obtenerTituloComprobante(
                comprobante
              )
            )}
            <br>

            <b>Cliente:</b>
            ${this.escaparHtml(
              comprobante.clienteNombre ||
              'Cliente general'
            )}
            <br>

            <b>Teléfono:</b>
            ${this.escaparHtml(
              comprobante.clienteTelefono ||
              '-'
            )}
            <br>

            <b>Método:</b>
            ${this.escaparHtml(
              comprobante.metodoPago ||
              'Sin método'
            )}
            <br>

            <b>Cajero:</b>
            ${this.escaparHtml(
              comprobante.cajero ||
              'Cajero'
            )}

          </div>

          <div class="separador"></div>

          <table>

            <thead>
              <tr>
                <th>Cant.</th>
                <th>Producto</th>
                <th class="derecha">Total</th>
              </tr>
            </thead>

            <tbody>
              ${filas}
            </tbody>

          </table>

          <div class="separador"></div>

          <div class="informacion">

            Subtotal:
            S/ ${Number(
              comprobante.subtotal || 0
            ).toFixed(2)}
            <br>

            Descuento:
            S/ ${Number(
              comprobante.descuento || 0
            ).toFixed(2)}

          </div>

          <div class="total">

            <span>TOTAL</span>

            <span>
              S/ ${Number(
                comprobante.total || 0
              ).toFixed(2)}
            </span>

          </div>

          <div class="separador"></div>

          <p>
            ¡Gracias por su preferencia!
          </p>

          <script>
            window.onload = function () {
              window.print();
            };
          </script>

        </body>

      </html>
    `);

    ventana.document.close();
  }

  // =====================================================
  // FECHAS
  // =====================================================

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

    const resultado =
      new Date(fecha);

    return Number.isNaN(
      resultado.getTime()
    )
      ? new Date(0)
      : resultado;
  }

  obtenerTime(
    fecha: any
  ): number {
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

  formatearFechaHora(
    fecha: any
  ): string {
    const fechaConvertida =
      this.convertirFecha(fecha);

    if (
      fechaConvertida.getTime() === 0
    ) {
      return '-';
    }

    return fechaConvertida
      .toLocaleString(
        'es-PE',
        {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }
      );
  }

  // =====================================================
  // UTILIDADES
  // =====================================================

  escaparHtml(
    valor: any
  ): string {
    return String(valor ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  normalizarTexto(
    valor: any
  ): string {
    return String(valor || '')
      .trim()
      .toLowerCase();
  }

  trackByGrupo(
    index: number,
    grupo: GrupoComprobantes
  ): string | number {
    return grupo.fecha || index;
  }

  trackByComprobante(
    index: number,
    comprobante: any
  ): string | number {
    return (
      comprobante?.id ||
      comprobante?.idVenta ||
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