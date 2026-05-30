import { Component } from '@angular/core';
import { NavController } from '@ionic/angular/standalone'; // 👈 Cambiamos Router por NavController

import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent
} from '@ionic/angular/standalone';

import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-mesero',
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
    IonCardContent
  ]
})
export class DashboardPage {

  mesasDisponibles = 6;
  mesasOcupadas = 4;
  pedidosActivos = 8;
  pedidosListos = 3;

  // 👈 Inyectamos NavController en lugar de Router
  constructor(private navCtrl: NavController) {}

  irDetallePedido() {
    this.navCtrl.navigateForward('/detalle-pedido');
  }

  irMesas() {
    this.navCtrl.navigateForward('/mesas');
  }

  irNuevoPedido() {
    console.log('Click detectado en Nuevo Pedido'); // Para que verifiques en consola
    this.navCtrl.navigateForward('/nuevo-pedido');
  }

  irPedidosActivos() {
    this.navCtrl.navigateForward('/pedidos-activos');
  }

}