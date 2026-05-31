import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonMenu,
  IonMenuButton,
  IonButtons,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonMenu,
    IonMenuButton,
    IonButtons,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent
  ]
})
export class DashboardPage implements OnInit {

  // Inicializamos las variables en 0 o vacías para esperar la carga asíncrona
  ventasDia: number = 0;
  pedidosActivos: number = 0;
  ventasHoy: number = 0;
  mesasDisponibles: number = 0;
  mesasOcupadas: number = 0;
  transacciones: number = 0;
  
  ultimasVentas: any[] = [];

  constructor(private router: Router) {}

  async ngOnInit() {
    // Se ejecuta al cargar la página para traer la info de Firebase
    await this.cargarDashboardFirebase();
  }

  /**
   * Simulación asíncrona de la consulta a Firebase.
   * Al usar async/await, preparamos la app para manejar el retardo de red
   * nativo de Cloud Firestore.
   */
  async cargarDashboardFirebase() {
    // Simulamos los milisegundos que tarda Firebase en responder desde la nube
    await new Promise(resolve => setTimeout(resolve, 600));

    // Datos recuperados que se inyectan reactivamente en el HTML
    this.ventasDia = 1250;
    this.pedidosActivos = 15;
    this.ventasHoy = 1850;
    this.mesasDisponibles = 8;
    this.mesasOcupadas = 12;
    this.transacciones = 47;

    this.ultimasVentas = [
      {
        cliente: 'Mesa 01',
        descripcion: '1 Pollo a la Brasa',
        total: 58
      },
      {
        cliente: 'Mesa 05',
        descripcion: 'Chaufa Especial',
        total: 42
      },
      {
        cliente: 'Para Llevar',
        descripcion: 'Parrilla Familiar',
        total: 95
      },
      {
        cliente: 'Mesa 12',
        descripcion: '1/4 Pollo + Gaseosa',
        total: 29
      }
    ];
  }

  cerrarSesion() {
    this.router.navigate(['/select-role']);
  }
}