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
import { analytics, documentTextOutline, arrowBack, downloadOutline } from 'ionicons/icons';

// Módulos funcionales de Firebase optimizados para consultas (Queries)
import {
  Firestore,
  collection,
  getDocs,
  query,
  where,
  orderBy
} from '@angular/fire/firestore';

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

  // --- VARIABLES DE INTERFAZ ---
  fechaActual: string = '';
  rangosTiempo = ['Esta semana', 'Este mes', 'Últimos 3 meses', 'Este año'];
  rangoSeleccionado: string = 'Este mes';
  coloresMetodo = ['green', 'blue', 'purple', 'amber']; // Expandido para soportar más métodos

  filtros = {
    fechaInicio: '',
    fechaFin: ''
  };

  cargando: boolean = false;
  reporteGenerado: boolean = false;

  kpis = {
    totalIngresos: 0,
    totalPedidos: 0,
    ticketPromedio: 0
  };

  metodosPagoDisplay: any[] = [];

  // --- DATOS MOCK PARA GRÁFICOS VISUALES ---
  topProductosMock = [
    { nombre: '#1 1/2 Pollo', cantidad: 312, porcentaje: 100 },
    { nombre: '#2 1/4 Pollo', cantidad: 287, porcentaje: 92 },
    { nombre: '#3 Pollo Entero', cantidad: 198, porcentaje: 63 },
    { nombre: '#4 Alitas x6', cantidad: 174, porcentaje: 55 },
    { nombre: '#5 Papas Fritas', cantidad: 421, porcentaje: 85 },
    { nombre: '#6 Gaseosa 1.5L', cantidad: 389, porcentaje: 78 }
  ];

  constructor() {
    addIcons({ analytics, documentTextOutline, arrowBack, downloadOutline });
  }

  ngOnInit() {
    this.configurarFecha();
    this.seleccionarRango('Este mes'); // Auto-carga controlada al iniciar
  }

  configurarFecha() {
    const opciones: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    this.fechaActual = new Date().toLocaleDateString('es-PE', opciones);
  }

  // ==========================================================================
  // LÓGICA DE CONTROL DE RANGOS CRÍTICA PARA FILTRADO REAL
  // ==========================================================================
  seleccionarRango(rango: string) {
    this.rangoSeleccionado = rango;

    const hoy = new Date();
    let fechaInicioDate = new Date();

    // Resetear horas para abarcar los días completos de forma exacta
    hoy.setHours(23, 59, 59, 999);
    fechaInicioDate.setHours(0, 0, 0, 0);

    switch (rango) {
      case 'Esta semana':
        // Calcular el inicio de la semana (Lunes)
        const diaSemana = fechaInicioDate.getDay();
        const distanciaALunes = diaSemana === 0 ? 6 : diaSemana - 1;
        fechaInicioDate.setDate(fechaInicioDate.getDate() - distanciaALunes);
        break;

      case 'Este mes':
        // Primer día del mes actual
        fechaInicioDate.setDate(1);
        break;

      case 'Últimos 3 meses':
        // Restar 3 meses atrás desde el día 1
        fechaInicioDate.setMonth(fechaInicioDate.getMonth() - 3);
        fechaInicioDate.setDate(1);
        break;

      case 'Este año':
        // Primero de Enero del año en curso
        fechaInicioDate.setMonth(0);
        fechaInicioDate.setDate(1);
        break;
    }

    // Guardar en formato string YYYY-MM-DD para controles <ion-input type="date"> en tu HTML
    this.filtros.fechaInicio = fechaInicioDate.toISOString().split('T')[0];
    this.filtros.fechaFin = hoy.toISOString().split('T')[0];

    this.generarReporte();
  }

  calcularPorcentajePago(monto: number): number {
    if (this.kpis.totalIngresos === 0) return 0;
    return Math.round((monto / this.kpis.totalIngresos) * 100);
  }

  exportarPDF() {
    console.log("Generando PDF del reporte actual...", this.filtros);
  }

  // ==========================================================================
  // PROCESAMIENTO Y QUERY FILTRADA A TU BASE DE DATOS FIRESTORE
  // ==========================================================================
  async generarReporte() {
    // Evitar llamadas duplicadas o inputs vacíos
    if (!this.filtros.fechaInicio || !this.filtros.fechaFin) return;

    this.cargando = true;
    this.reporteGenerado = false;

    try {
      // Ajustamos los strings de los inputs para cubrir todo el espectro de tiempo ISO de Firestore
      const isoInicio = new Date(this.filtros.fechaInicio + 'T00:00:00').toISOString();
      const isoFin = new Date(this.filtros.fechaFin + 'T23:59:59.999').toISOString();

      const ventasRef = collection(this.firestore, 'ventas');

      // Creamos una consulta compuesta estructurada (Query) para optimizar el consumo de Firebase
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

      snapshot.forEach(docSnap => {
        const data: any = docSnap.data();

        // Procesamiento financiero del registro
        totalIngresos += Number(data.total || 0);
        totalPedidos++;

        const metodo = data.metodoPago || 'Efectivo';

        if (!mapaPagos[metodo]) {
          mapaPagos[metodo] = {
            nombre: metodo,
            transacciones: 0,
            monto: 0
          };
        }

        mapaPagos[metodo].transacciones++;
        mapaPagos[metodo].monto += Number(data.total || 0);
      });

      // Actualizamos los KPIs en base a los datos estrictamente filtrados
      this.kpis = {
        totalIngresos,
        totalPedidos,
        ticketPromedio: totalPedidos > 0 ? totalIngresos / totalPedidos : 0
      };

      // Transformar el mapa estructurado en un array procesable para el bucle *ngFor de tu vista
      this.metodosPagoDisplay = Object.values(mapaPagos);

      console.log(`✅ Reporte procesado con éxito. Ventas encontradas: ${totalPedidos}`);

    } catch (error) {
      console.error('❌ Error generando reporte estructurado:', error);
    } finally {
      this.cargando = false;
      this.reporteGenerado = true;
    }
  }
}