import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
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
  getDocs,
  query,
  where,
  orderBy
} from '@angular/fire/firestore';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

  private firestore = inject(Firestore);

  fechaActual = '';
  rangosTiempo = ['Esta semana', 'Este mes', 'Últimos 3 meses', 'Este año'];
  rangoSeleccionado = 'Este mes';
  coloresMetodo = ['green', 'blue', 'purple', 'amber'];

  filtros = {
    fechaInicio: '',
    fechaFin: ''
  };

  cargando = false;
  reporteGenerado = false;

  kpis = {
    totalIngresos: 0,
    totalPedidos: 0,
    ticketPromedio: 0
  };

  metodosPagoDisplay: any[] = [];
  topProductos: any[] = [];

  ventasMensuales: any[] = [];
  ventasAmPm: any[] = [];

  constructor() {
    addIcons({
      analytics,
      documentTextOutline,
      arrowBack,
      downloadOutline
    });
  }

  ngOnInit() {
    this.configurarFecha();
    this.seleccionarRango('Este mes');
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

  seleccionarRango(rango: string) {
    this.rangoSeleccionado = rango;

    const hoy = new Date();
    const fechaInicioDate = new Date();

    hoy.setHours(23, 59, 59, 999);
    fechaInicioDate.setHours(0, 0, 0, 0);

    switch (rango) {
      case 'Esta semana': {
        const diaSemana = fechaInicioDate.getDay();
        const distanciaALunes = diaSemana === 0 ? 6 : diaSemana - 1;
        fechaInicioDate.setDate(fechaInicioDate.getDate() - distanciaALunes);
        break;
      }

      case 'Este mes':
        fechaInicioDate.setDate(1);
        break;

      case 'Últimos 3 meses':
        fechaInicioDate.setMonth(fechaInicioDate.getMonth() - 3);
        fechaInicioDate.setDate(1);
        break;

      case 'Este año':
        fechaInicioDate.setMonth(0);
        fechaInicioDate.setDate(1);
        break;
    }

    this.filtros.fechaInicio = fechaInicioDate.toISOString().split('T')[0];
    this.filtros.fechaFin = hoy.toISOString().split('T')[0];

    this.generarReporte();
  }

  calcularPorcentajePago(monto: number): number {
    if (this.kpis.totalIngresos === 0) return 0;
    return Math.round((monto / this.kpis.totalIngresos) * 100);
  }

  convertirFecha(fecha: any): Date {
    if (!fecha) return new Date();

    if (fecha.seconds) {
      return new Date(fecha.seconds * 1000);
    }

    return new Date(fecha);
  }

  obtenerEtiquetaMes(fecha: Date): string {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return meses[fecha.getMonth()];
  }

  obtenerDiaSemana(fecha: Date): string {
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    return dias[fecha.getDay()];
  }

  exportarPDF() {
    if (!this.reporteGenerado) {
      alert('Primero genera un reporte.');
      return;
    }

    const docPdf = new jsPDF('portrait', 'mm', 'a4');

    docPdf.setFontSize(16);
    docPdf.text('Reporte de Ventas - Pollería Dylan', 14, 15);

    docPdf.setFontSize(10);
    docPdf.text(`Fecha de exportación: ${this.fechaActual}`, 14, 24);
    docPdf.text(`Rango: ${this.rangoSeleccionado}`, 14, 31);
    docPdf.text(`Desde: ${this.filtros.fechaInicio}`, 14, 38);
    docPdf.text(`Hasta: ${this.filtros.fechaFin}`, 14, 45);

    docPdf.setFontSize(12);
    docPdf.text(`Total ingresos: S/ ${this.kpis.totalIngresos.toFixed(2)}`, 14, 58);
    docPdf.text(`Total pedidos: ${this.kpis.totalPedidos}`, 14, 66);
    docPdf.text(`Ticket promedio: S/ ${this.kpis.ticketPromedio.toFixed(2)}`, 14, 74);

    const filasPago = this.metodosPagoDisplay.map(m => [
      m.nombre,
      String(m.transacciones),
      `S/ ${Number(m.monto || 0).toFixed(2)}`,
      `${this.calcularPorcentajePago(Number(m.monto || 0))}%`
    ]);

    autoTable(docPdf, {
      startY: 86,
      head: [['Método de pago', 'Transacciones', 'Monto', 'Porcentaje']],
      body: filasPago.length > 0
        ? filasPago
        : [['Sin datos', '0', 'S/ 0.00', '0%']],
      styles: { fontSize: 9 },
      headStyles: {
        fillColor: [126, 58, 242],
        textColor: [255, 255, 255]
      }
    });

    const finalY = (docPdf as any).lastAutoTable?.finalY || 110;

    const filasProductos = this.topProductos.map(p => [
      p.nombre,
      String(p.cantidad),
      `${p.porcentaje}%`
    ]);

    autoTable(docPdf, {
      startY: finalY + 10,
      head: [['Producto', 'Cantidad vendida', 'Porcentaje']],
      body: filasProductos.length > 0
        ? filasProductos
        : [['Sin datos', '0', '0%']],
      styles: { fontSize: 9 },
      headStyles: {
        fillColor: [126, 58, 242],
        textColor: [255, 255, 255]
      }
    });

    const fechaArchivo = new Date().toISOString().slice(0, 10);
    docPdf.save(`reporte_ventas_${fechaArchivo}.pdf`);
  }

  async generarReporte() {
    if (!this.filtros.fechaInicio || !this.filtros.fechaFin) return;

    this.cargando = true;
    this.reporteGenerado = false;

    try {
      const inicioDate = new Date(this.filtros.fechaInicio + 'T00:00:00');
      const finDate = new Date(this.filtros.fechaFin + 'T23:59:59.999');

      const isoInicio = inicioDate.toISOString();
      const isoFin = finDate.toISOString();

      const ventasRef = collection(this.firestore, 'ventas');

      const q = query(
        ventasRef,
        where('fecha', '>=', isoInicio),
        where('fecha', '<=', isoFin),
        orderBy('fecha', 'desc')
      );

      const snapshot = await getDocs(q);

      let totalIngresos = 0;
      let totalPedidos = 0;

      const mapaPagos: any = {};
      const mapaProductos: any = {};
      const mapaMeses: any = {};
      const mapaDiasAmPm: any = {};

      snapshot.forEach(docSnap => {
        const data: any = docSnap.data();

        const total = Number(data.total || data.montoTotal || 0);
        const fechaVenta = this.convertirFecha(data.fecha);

        totalIngresos += total;
        totalPedidos++;

        const metodo = data.metodoPago || data.metodo || 'Efectivo';

        if (!mapaPagos[metodo]) {
          mapaPagos[metodo] = {
            nombre: metodo,
            transacciones: 0,
            monto: 0
          };
        }

        mapaPagos[metodo].transacciones++;
        mapaPagos[metodo].monto += total;

        const mes = this.obtenerEtiquetaMes(fechaVenta);

        if (!mapaMeses[mes]) {
          mapaMeses[mes] = {
            mes,
            total: 0,
            pedidos: 0
          };
        }

        mapaMeses[mes].total += total;
        mapaMeses[mes].pedidos++;

        const dia = this.obtenerDiaSemana(fechaVenta);

        if (!mapaDiasAmPm[dia]) {
          mapaDiasAmPm[dia] = {
            dia,
            am: 0,
            pm: 0
          };
        }

        const hora = fechaVenta.getHours();

        if (hora < 12) {
          mapaDiasAmPm[dia].am += total;
        } else {
          mapaDiasAmPm[dia].pm += total;
        }

        const productos = data.productos || data.items || data.detalle || [];

        productos.forEach((p: any) => {
          const nombre = p.nombre || p.producto || p.descripcion || 'Producto';
          const cantidad = Number(p.cantidad || 1);

          if (!mapaProductos[nombre]) {
            mapaProductos[nombre] = {
              nombre,
              cantidad: 0
            };
          }

          mapaProductos[nombre].cantidad += cantidad;
        });
      });

      this.kpis = {
        totalIngresos,
        totalPedidos,
        ticketPromedio: totalPedidos > 0 ? totalIngresos / totalPedidos : 0
      };

      this.metodosPagoDisplay = Object.values(mapaPagos);

      const productosOrdenados: any[] = Object.values(mapaProductos)
        .sort((a: any, b: any) => b.cantidad - a.cantidad)
        .slice(0, 6);

      const maxCantidad = productosOrdenados.length > 0
        ? productosOrdenados[0].cantidad
        : 0;

      this.topProductos = productosOrdenados.map((p: any, index: number) => ({
        nombre: `#${index + 1} ${p.nombre}`,
        cantidad: p.cantidad,
        porcentaje: maxCantidad > 0
          ? Math.round((p.cantidad / maxCantidad) * 100)
          : 0
      }));

      const ordenMeses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

      this.ventasMensuales = ordenMeses
        .filter(m => mapaMeses[m])
        .map(m => mapaMeses[m]);

      const ordenDias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

      this.ventasAmPm = ordenDias
        .filter(d => mapaDiasAmPm[d])
        .map(d => mapaDiasAmPm[d]);

    } catch (error) {
      console.error('❌ Error generando reporte estructurado:', error);
      alert('Error generando reporte.');
    } finally {
      this.cargando = false;
      this.reporteGenerado = true;
    }
  }
}