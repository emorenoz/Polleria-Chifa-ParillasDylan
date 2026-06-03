import { Component, OnInit, inject } from '@angular/core';
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

import { Firestore, doc, docData } from '@angular/fire/firestore';

@Component({
  selector: 'app-pedido-detalle',
  templateUrl: './pedido-detalle.page.html',
  styleUrls: ['./pedido-detalle.page.scss'],
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
export class PedidoDetallePage implements OnInit {

  pedido: any = null;

  private firestore = inject(Firestore);

  ngOnInit() {
    this.cargarPedido();
  }

  cargarPedido() {
    const pedidoId = 'ID_PEDIDO_DEMO'; // luego lo conectas por router

    const ref = doc(this.firestore, 'pedidos', pedidoId);

    docData(ref, { idField: 'id' }).subscribe((data) => {
      this.pedido = data;
    });
  }
}