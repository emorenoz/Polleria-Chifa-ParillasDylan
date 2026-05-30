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

    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent

  ]

})

export class DashboardPage {

  ventasDia = 1250;

  pedidosActivos = 15;

  constructor(private router: Router) {}

  cerrarSesion() {

    this.router.navigate(['/select-role']);

  }

}