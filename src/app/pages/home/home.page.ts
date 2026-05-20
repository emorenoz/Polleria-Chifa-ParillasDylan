import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader,
  IonCardTitle, IonCardSubtitle, IonGrid, IonRow, IonCol, IonIcon,
  IonButton, IonBadge
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  cashOutline, cubeOutline, trendingUpOutline,
  alertCircleOutline, restaurantOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonCard,
    IonCardHeader, IonCardTitle, IonCardSubtitle, IonGrid, IonRow,
    IonCol, IonIcon, IonButton, IonBadge
  ]
})
export class HomePage implements OnInit {

  constructor(private router: Router) {

    addIcons({
      cashOutline,
      cubeOutline,
      trendingUpOutline,
      alertCircleOutline,
      restaurantOutline
    });
  }

  ngOnInit() {}

  irANuevoPedido() {
    this.router.navigateByUrl('/pedido');
  }

  verPedidosActivos() {
    console.log('Ver pedidos activos pulsado');
  }
}