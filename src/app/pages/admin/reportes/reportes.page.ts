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

import {
  Firestore,
  collection,
  getDocs
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

  // --- VARIABLES DE INTERFAZ NUEVAS ---
  fechaActual: string = '';
  rangosTiempo = ['Esta semana', 'Este mes', 'Últimos 3 meses', 'Este año'];
  rangoSeleccionado: string = 'Este mes';
  coloresMetodo = ['green', 'blue', 'purple']; // Para el gráfico de donut

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
    { nombre: '#5 Papas Fritas', cantidad: 421, porcentaje: 85 }, // El valor es mayor, pero en el mock el pollo es #1
    { nombre: '#6 Gaseosa 1.5L', cantidad: 389, porcentaje: 78 }
  ];

  constructor() {
    addIcons({ analytics, documentTextOutline, arrowBack, downloadOutline });
  }

  ngOnInit() {
    this.configurarFecha();
    this.seleccionarRango('Este mes'); // Auto-carga al entrar
  }

  configurarFecha() {
    const opciones: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    this.fechaActual = new Date().toLocaleDateString('es-PE', opciones);
  }

  // --- CONTROL DE FILTROS ---
  seleccionarRango(rango: string) {
    this.rangoSeleccionado = rango;
    
    // Aquí podrías agregar lógica real de Date() para calcular fechaInicio y fechaFin
    // Por ahora, simulamos y cargamos la BD de Firebase general para ver los datos
    const hoy = new Date().toISOString().split('T')[0];
    this.filtros.fechaInicio = hoy; // En prod, restar días según el rango
    this.filtros.fechaFin = hoy;
    
    this.generarReporte();
  }

  exportarPDF() {
    console.log("Generando PDF del reporte actual...");
    // Lógica futura de exportación PDF
  }

  calcularPorcentajePago(monto: number): number {
    if (this.kpis.totalIngresos === 0) return 0;
    return Math.round((monto / this.kpis.totalIngresos) * 100);
  }


  // --- FIREBASE REAL SIN ROMPER TU LÓGICA ---
  async generarReporte() {
    this.cargando = true;
    this.reporteGenerado = false;

    try {
      const snapshot = await getDocs(collection(this.firestore, 'ventas'));

      let totalIngresos = 0;
      let totalPedidos = 0;
      const mapaPagos: any = {};

      snapshot.forEach(docSnap => {
        const data: any = docSnap.data();

        totalIngresos += Number(data.total || 0);
        totalPedidos++;

        const metodo = data.metodoPago || 'Efectivo'; // Fallback a Efectivo para que se vea en el gráfico

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

      this.kpis = {
        totalIngresos,
        totalPedidos,
        ticketPromedio: totalPedidos > 0 ? totalIngresos / totalPedidos : 0
      };

      // Transformar para la vista
      this.metodosPagoDisplay = Object.values(mapaPagos);

      console.log('✅ Reporte generado desde Firebase');

    } catch (error) {
      console.error('❌ Error generando reporte:', error);
    }

    this.cargando = false;
    this.reporteGenerado = true;
  }

}