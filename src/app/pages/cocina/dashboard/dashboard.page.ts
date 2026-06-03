import { Component, OnInit, inject } from '@angular/core';

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

import {
  Firestore,
  collection,
  collectionData
} from '@angular/fire/firestore';

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
export class DashboardPage implements OnInit {

  pedidosNuevos = 0;
  pedidosPreparando = 0;
  pedidosListos = 0;

  pedidos: any[] = [];

  private firestore = inject(Firestore);

  ngOnInit() {
    this.cargarPedidosFirebase();
  }

  cargarPedidosFirebase() {
    const pedidosRef = collection(this.firestore, 'pedidos');

    collectionData(pedidosRef, { idField: 'id' }).subscribe((data: any[]) => {

      // 👉 mantenemos tu lógica de variables intacta
      this.pedidos = data.map(p => ({
        mesa: p.mesa,
        detalle: (p.productos || []).map((x: any) => x.nombre).join(' + '),
        estado:
          p.estado === 'pendiente'
            ? 'Nuevo'
            : p.estado === 'cocina'
            ? 'Preparando'
            : 'Listo'
      }));

      // 👉 métricas sin cambiar tus nombres
      this.pedidosNuevos = data.filter(p => p.estado === 'pendiente').length;
      this.pedidosPreparando = data.filter(p => p.estado === 'cocina').length;
      this.pedidosListos = data.filter(p => p.estado === 'entregado').length;
    });
  }
}