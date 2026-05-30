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
  IonLabel,
  IonBadge,

  IonButton

} from '@ionic/angular/standalone';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
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
    IonLabel,
    IonBadge,

    IonButton

  ]

})
export class DashboardPage implements OnInit {

  ventasHoy = 1850;

  pedidosPendientes = 8;

  pedidosCobrados = 35;

  cajaActual = 2340;

  pedidos = [
    {
      mesa: 'Mesa 01',
      detalle: 'Pollo a la Brasa Familiar',
      estado: 'Pendiente'
    },
    {
      mesa: 'Mesa 05',
      detalle: 'Chaufa Especial',
      estado: 'Cobrado'
    },
    {
      mesa: 'Mesa 12',
      detalle: 'Parrilla Familiar',
      estado: 'Pendiente'
    },
    {
      mesa: 'Pedido #003',
      detalle: 'Para Llevar',
      estado: 'Cobrado'
    }
  ];

  constructor() {}

  ngOnInit() {}

}