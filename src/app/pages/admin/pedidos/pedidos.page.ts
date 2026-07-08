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
import * as XLSX from 'xlsx-js-style';

import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

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
  totalEntregados = 0;
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
          if (!p.fecha && !p.fechaPedido && !p.fechaCaja) return false;

          const fechaObj = this.convertirFecha(p.fecha || p.fechaPedido || p.fechaCaja);
          return fechaObj.toDateString() === hoyString;
        });

        this.listaPedidos = pedidosHoy.map((p, index) => {
          const productos = p.productos || p.items || [];
          const fechaPedido = p.fecha || p.fechaPedido || p.fechaCaja;

          return {
            id: p.id,
            numeroPedido: index + 1,
            mesa: p.tipoPedido === 'para_llevar'
              ? 'Para llevar'
              : (p.mesa ? `Mesa ${p.mesa}` : 'Llevar / Delivery'),
            numMesaRaw: p.mesa || '',
            tipoPedido: p.tipoPedido || 'mesa',
            clienteNombre: p.clienteNombre || '',
            clienteTelefono: p.clienteTelefono || '',
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
            estado: this.normalizarEstadoPedido(p.estado),
            hora: this.extraerHora(fechaPedido),
            fechaOrden: this.convertirFecha(fechaPedido).getTime()
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

  normalizarEstadoPedido(estado: any): string {
    const e = String(estado || 'pendiente_cocina').toLowerCase().trim();

    if (e === 'pendiente' || e === 'pendientes') return 'pendiente_cocina';
    if (e === 'cocina') return 'preparando';
    if (e === 'entregado' || e === 'entregados') return 'entregado_mesa';
    if (e === 'recogido') return 'entregado_mesa';
    if (e === 'cancelado' || e === 'cancelada') return 'anulado';
    if (e === 'anulada') return 'anulado';

    return e;
  }

  calcularMetricas() {
    this.totalPendientes = this.listaPedidos.filter(p => p.estado === 'pendiente_cocina').length;
    this.totalCocina = this.listaPedidos.filter(p => p.estado === 'preparando').length;
    this.totalListos = this.listaPedidos.filter(p => p.estado === 'listo').length;
    this.totalEntregados = this.listaPedidos.filter(p => p.estado === 'entregado_mesa').length;
    this.totalCuenta = this.listaPedidos.filter(p => p.estado === 'cuenta').length;
    this.totalPagados = this.listaPedidos.filter(p => p.estado === 'pagado').length;
    this.totalAnulados = this.listaPedidos.filter(p => p.estado === 'anulado').length;

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
        String(p.tipoPedido).toLowerCase().includes(busqueda) ||
        String(p.clienteNombre).toLowerCase().includes(busqueda) ||
        String(p.clienteTelefono).toLowerCase().includes(busqueda) ||
        String(p.mesero).toLowerCase().includes(busqueda) ||
        String(p.descripcion).toLowerCase().includes(busqueda) ||
        String(this.obtenerEstadoTexto(p.estado)).toLowerCase().includes(busqueda);

      return cumpleEstado && cumpleBusqueda;
    });
  }

  normalizarFiltroEstado(estado: string): string {
    const e = String(estado || '').toLowerCase().trim();

    if (e === 'todos') return 'todos';
    if (e === 'pendiente' || e === 'pendientes') return 'pendiente_cocina';
    if (e === 'cocina' || e === 'preparando') return 'preparando';
    if (e === 'listo' || e === 'listos') return 'listo';
    if (e === 'entregado' || e === 'entregados' || e === 'entregado_mesa') return 'entregado_mesa';
    if (e === 'recogido') return 'entregado_mesa';
    if (e === 'cuenta' || e === 'en cuenta') return 'cuenta';
    if (e === 'pagado' || e === 'pagados') return 'pagado';
    if (e === 'anulado' || e === 'anulados' || e === 'cancelado' || e === 'cancelados') return 'anulado';

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
        estado: nuevoEstado,
        fechaActualizacion: new Date()
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

  async exportarReporte() {
    if (!this.pedidosFiltrados || this.pedidosFiltrados.length === 0) {
      alert('No hay pedidos para exportar.');
      return;
    }

    const datos = this.pedidosFiltrados.map((p, index) => ({
      Pedido: `#${index + 1}`,
      Tipo: p.tipoPedido === 'para_llevar' ? 'Para llevar' : 'Mesa',
      Mesa: p.mesa || '-',
      Cliente: p.clienteNombre || '-',
      Teléfono: p.clienteTelefono || '-',
      Mesero: p.mesero || '-',
      Items: Number(p.items) || 0,
      Descripción: p.descripcion || '-',
      Total: Number(p.total || 0),
      Estado: this.obtenerEstadoTexto(p.estado),
      Hora: p.hora || '--:--'
    }));

    const worksheet: any = XLSX.utils.json_to_sheet(datos);

    worksheet['!cols'] = [
      { wch: 10 },
      { wch: 14 },
      { wch: 16 },
      { wch: 24 },
      { wch: 16 },
      { wch: 22 },
      { wch: 10 },
      { wch: 50 },
      { wch: 12 },
      { wch: 18 },
      { wch: 10 }
    ];

    this.aplicarEstilosExcel(worksheet);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pedidos');

    const fecha = new Date().toISOString().slice(0, 10);
    const nombreArchivo = `pedidos_${fecha}.xlsx`;

    if (Capacitor.isNativePlatform()) {
      await this.descargarExcelAndroid(workbook, nombreArchivo);
    } else {
      this.descargarExcelWeb(workbook, nombreArchivo);
    }
  }

  aplicarEstilosExcel(worksheet: any) {
    const rango = XLSX.utils.decode_range(worksheet['!ref']);

    for (let row = rango.s.r; row <= rango.e.r; row++) {
      for (let col = rango.s.c; col <= rango.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });

        if (!worksheet[cellAddress]) continue;

        worksheet[cellAddress].s = {
          alignment: {
            horizontal: 'center',
            vertical: 'center',
            wrapText: true
          },
          font: {
            name: 'Calibri',
            sz: 11,
            color: { rgb: '111827' }
          },
          border: {
            top: { style: 'thin', color: { rgb: 'D1D5DB' } },
            bottom: { style: 'thin', color: { rgb: 'D1D5DB' } },
            left: { style: 'thin', color: { rgb: 'D1D5DB' } },
            right: { style: 'thin', color: { rgb: 'D1D5DB' } }
          }
        };

        if (row === 0) {
          worksheet[cellAddress].s = {
            alignment: {
              horizontal: 'center',
              vertical: 'center',
              wrapText: true
            },
            font: {
              name: 'Calibri',
              sz: 12,
              bold: true,
              color: { rgb: 'FFFFFF' }
            },
            fill: {
              fgColor: { rgb: '7C3AED' }
            },
            border: {
              top: { style: 'thin', color: { rgb: '6D28D9' } },
              bottom: { style: 'thin', color: { rgb: '6D28D9' } },
              left: { style: 'thin', color: { rgb: '6D28D9' } },
              right: { style: 'thin', color: { rgb: '6D28D9' } }
            }
          };
        }
      }
    }

    worksheet['!rows'] = [
      { hpt: 24 },
      ...Array(Math.max(0, rango.e.r)).fill({ hpt: 24 })
    ];

    const totalCol = 8;

    for (let row = 1; row <= rango.e.r; row++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: totalCol });

      if (worksheet[cellAddress]) {
        worksheet[cellAddress].z = '"S/ "#,##0.00';
        worksheet[cellAddress].s = {
          ...worksheet[cellAddress].s,
          font: {
            name: 'Calibri',
            sz: 11,
            bold: true,
            color: { rgb: '111827' }
          }
        };
      }
    }
  }

  async descargarExcelAndroid(workbook: XLSX.WorkBook, nombreArchivo: string) {
    try {
      const excelBase64 = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'base64'
      });

      const resultado = await Filesystem.writeFile({
        path: nombreArchivo,
        data: excelBase64,
        directory: Directory.Documents,
        recursive: true
      });

      await Share.share({
        title: 'Reporte de pedidos',
        text: 'Reporte Excel generado desde Pollería Dylan.',
        url: resultado.uri,
        dialogTitle: 'Guardar o compartir Excel'
      });

      console.log('✅ Excel exportado en Android:', resultado.uri);

    } catch (error) {
      console.error('❌ Error exportando en Android:', error);
      this.descargarExcelWeb(workbook, nombreArchivo);
    }
  }

  descargarExcelWeb(workbook: XLSX.WorkBook, nombreArchivo: string) {
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    });

    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(blob);
    enlace.download = nombreArchivo;
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);

    console.log('✅ Excel descargado en PC/navegador:', nombreArchivo);
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