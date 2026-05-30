import { Component } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';

import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonList,
  IonItem,
  IonLabel
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-productos',
  templateUrl: './productos.page.html',
  styleUrls: ['./productos.page.scss'],
  standalone: true,

  imports: [
    CommonModule,
    NgFor,

    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,

    IonButtons,
    IonButton,

    IonList,
    IonItem,
    IonLabel
  ]
})
export class ProductosPage {

  productos = [
    {
      nombre: '1/4 Pollo',
      precio: 22.90
    },
    {
      nombre: '1/2 Pollo',
      precio: 39.90
    },
    {
      nombre: 'Pollo Entero',
      precio: 69.90
    },
    {
      nombre: 'Chaufa Especial',
      precio: 18.90
    }
  ];

}