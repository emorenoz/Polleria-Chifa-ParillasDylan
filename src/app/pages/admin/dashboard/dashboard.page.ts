import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router'; // Añadido: RouterModule para el funcionamiento de routerLink
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
  IonCardContent,
  IonSplitPane,     // Añadido: Necesario para el menú lateral responsivo
  IonIcon,          // Añadido: Necesario para renderizar iconos
  IonListHeader     // Añadido: Para los títulos divisores dentro de la lista del menú
} from '@ionic/angular/standalone';

// Añadido: Importación y registro de los iconos que usamos en el menú lateral
import { addIcons } from 'ionicons';
import {
  appsOutline,
  clipboardOutline,
  cashOutline,
  archiveOutline,
  restaurantOutline,
  fastFoodOutline,
  gridOutline,
  cubeOutline,
  peopleOutline,
  personCircleOutline,
  barChartOutline,
  settingsOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule, // Añadido: Para habilitar la directiva [routerLink] en los ítems del menú
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
    IonCardContent,
    IonSplitPane,     // Añadido al array de imports
    IonIcon,          // Añadido al array de imports
    IonListHeader     // Añadido al array de imports
  ]
})
export class DashboardPage implements OnInit {

  // Variables reactivas de la app
  ventasDia: number = 0;
  pedidosActivos: number = 0;
  ventasHoy: number = 0;
  mesasDisponibles: number = 0;
  mesasOcupadas: number = 0;
  transacciones: number = 0;

  ultimasVentas: any[] = [];

  constructor(private router: Router) {
    // Añadido: Registro explícito de iconos para arquitectura Standalone de Ionic
    addIcons({
      appsOutline,
      clipboardOutline,
      cashOutline,
      archiveOutline,
      restaurantOutline,
      fastFoodOutline,
      gridOutline,
      cubeOutline,
      peopleOutline,
      personCircleOutline,
      barChartOutline,
      settingsOutline
    });
  }

  async ngOnInit() {
    await this.cargarDashboardFirebase();
  }

  /**
   * Simulación asíncrona de la consulta a Firebase.
   */
  async cargarDashboardFirebase() {
    await new Promise(resolve => setTimeout(resolve, 600));

    this.ventasDia = 1250;
    this.pedidosActivos = 15;
    this.ventasHoy = 1850;
    this.mesasDisponibles = 8;
    this.mesasOcupadas = 12;
    this.transacciones = 47;

    this.ultimasVentas = [
      { cliente: 'Mesa 01', descripcion: '1 Pollo a la Brasa', total: 58 },
      { cliente: 'Mesa 05', descripcion: 'Chaufa Especial', total: 42 },
      { cliente: 'Para Llevar', descripcion: 'Parrilla Familiar', total: 95 },
      { cliente: 'Mesa 12', descripcion: '1/4 Pollo + Gaseosa', total: 29 }
    ];
  }

  // Método auxiliar opcional por si prefieres navegar mediante funciones (click) en lugar de routerLink
  navegarA(ruta: string) {
    this.router.navigate([ruta]);
  }

  cerrarSesion() {
    this.router.navigate(['/select-role']);
  }
}