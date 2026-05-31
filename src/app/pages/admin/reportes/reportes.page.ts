import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  IonNote
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { analytics, documentTextOutline } from 'ionicons/icons';

@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.page.html',
  styleUrls: ['./reportes.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
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
    IonNote
  ]
})
export class ReportesPage implements OnInit {

  // Modelo de rango de fechas para la consulta en la nube
  filtros = {
    fechaInicio: '',
    fechaFin: ''
  };

  // Estados de control de flujo
  cargando: boolean = false;
  reporteGenerado: boolean = false;

  // KPIs Financieros acumulados
  kpis = {
    totalIngresos: 0,
    totalPedidos: 0,
    ticketPromedio: 0
  };

  // Desglose por métodos de pago mapeados desde Caja/Ventas
  metodosPago: any[] = [];

  constructor() {
    // Inyección de íconos analíticos en modo Standalone
    addIcons({ analytics, documentTextOutline });
  }

  ngOnInit() {
    // Inicializar con la fecha de hoy por defecto para agilizar la usabilidad
    const hoy = new Date().toISOString().split('T')[0];
    this.filtros.fechaInicio = hoy;
    this.filtros.fechaFin = hoy;
  }

  /**
   * Simulación asíncrona de agregación en Cloud Firestore.
   * Ejecuta un conteo y suma de la colección 'ventas' filtrando por los timestamps de las fechas.
   */
  async generarReporte() {
    if (!this.filtros.fechaInicio || !this.filtros.fechaFin) return;

    this.cargando = true;
    this.reporteGenerado = false;

    // Simulamos el retraso que toma Firestore en recorrer y agrupar los documentos
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Datos procesados resultantes de la consulta asíncrona
    this.kpis = {
      totalIngresos: 2480.90,
      totalPedidos: 52,
      ticketPromedio: 47.71
    };

    this.metodosPago = [
      { nombre: 'Efectivo 💵', transacciones: 28, monto: 1240.00 },
      { nombre: 'Yape / Plin 📱', transacciones: 18, monto: 850.90 },
      { nombre: 'Tarjeta de Crédito/Débito 💳', transacciones: 6, monto: 390.00 }
    ];

    this.cargando = false;
    this.reporteGenerado = true;
  }
}
