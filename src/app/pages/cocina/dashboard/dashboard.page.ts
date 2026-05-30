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

    // HEADER
    IonHeader,
    IonToolbar,
    IonTitle,

    // CONTENT
    IonContent,

    // CARDS
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,

    // BUTTONS
    IonButton

  ]

})

export class DashboardPage {

  pedidos = [

    {
      mesa: 1,
      detalle: '1 Pollo a la Brasa + Papas'
    },

    {
      mesa: 4,
      detalle: '1 Chaufa Especial + Inka Cola'
    }

  ];

}