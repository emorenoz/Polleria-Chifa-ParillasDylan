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
  IonBackButton
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { analytics, documentTextOutline, arrowBack } from 'ionicons/icons';

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
    IonBackButton
  ]
})
export class ReportesPage implements OnInit {

  private firestore = inject(Firestore);

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

  metodosPago: any[] = [];

  constructor() {
    addIcons({ analytics, documentTextOutline, arrowBack });
  }

  ngOnInit() {
    const hoy = new Date().toISOString().split('T')[0];
    this.filtros.fechaInicio = hoy;
    this.filtros.fechaFin = hoy;
  }

  // 🔥 FIREBASE REAL SIN ROMPER TU LÓGICA
  async generarReporte() {

    if (!this.filtros.fechaInicio || !this.filtros.fechaFin) return;

    this.cargando = true;
    this.reporteGenerado = false;

    try {

      const snapshot = await getDocs(
        collection(this.firestore, 'ventas')
      );

      let totalIngresos = 0;
      let totalPedidos = 0;

      const mapaPagos: any = {};

      snapshot.forEach(docSnap => {

        const data: any = docSnap.data();

        totalIngresos += Number(data.total || 0);
        totalPedidos++;

        const metodo = data.metodoPago || 'No definido';

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

      // KPI exactos (MISMA ESTRUCTURA QUE TU LOGICA)
      this.kpis = {
        totalIngresos,
        totalPedidos,
        ticketPromedio:
          totalPedidos > 0
            ? totalIngresos / totalPedidos
            : 0
      };

      this.metodosPago = Object.values(mapaPagos);

      console.log('✅ Reporte generado desde Firebase');

    } catch (error) {

      console.error('❌ Error generando reporte:', error);

    }

    this.cargando = false;
    this.reporteGenerado = true;

  }

}