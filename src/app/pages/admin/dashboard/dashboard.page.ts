import { Component } from '@angular/core';
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
export class DashboardPage {

  ventasDia = 1250;

  pedidosActivos = 15;

  ventasHoy = 1850;

  mesasDisponibles = 8;

  mesasOcupadas = 12;

  transacciones = 47;

  ultimasVentas = [
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

  constructor(private router: Router) {}

  cerrarSesion() {
    this.router.navigate(['/select-role']);
  }

}