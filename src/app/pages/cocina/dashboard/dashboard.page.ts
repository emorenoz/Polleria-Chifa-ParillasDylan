import { Component } from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,

  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,

  IonButton

} from '@ionic/angular/standalone';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,

  imports: [

    CommonModule,

    IonHeader,
    IonToolbar,
    IonTitle,

    IonContent,

    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,

    IonButton

  ]

})
export class DashboardPage {

  pedidosNuevos = 6;

  pedidosPreparando = 4;

  pedidosListos = 3;

  pedidos = [

    {
      mesa: 'Mesa 01',
      detalle: '1 Pollo a la Brasa + Papas',
      estado: 'Nuevo'
    },

    {
      mesa: 'Mesa 04',
      detalle: '1 Chaufa Especial + Inka Cola',
      estado: 'Preparando'
    },

    {
      mesa: 'Mesa 08',
      detalle: '1 Parrilla Familiar',
      estado: 'Listo'
    }

  ];

}