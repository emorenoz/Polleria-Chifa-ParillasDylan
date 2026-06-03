import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

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

  // ========================
  // FIREBASE
  // ========================
  private db = inject(Firestore);

  // ========================
  // ESTADO CAJA (UI)
  // ========================
  ventasHoy = 1850;
  pedidosPendientes = 8;
  pedidosCobrados = 35;
  cajaActual = 2340;

  // ========================
  // PEDIDOS
  // ========================
  pedidos: any[] = [];

  constructor(private router: Router) {}

  ngOnInit() {
    this.cargarPedidos();
  }

  // ========================
  // FIRESTORE - PEDIDOS
  // ========================
  cargarPedidos() {
    const ref = collection(this.db, 'pedidos');

    collectionData(ref, { idField: 'id' }).subscribe((data: any[]) => {
      this.pedidos = data;

      this.pedidosPendientes = data.filter(p => p.estado === 'pendiente').length;
      this.pedidosCobrados = data.filter(p => p.estado === 'cobrado').length;

      const total = data.reduce((sum, p) => sum + (p.total || 0), 0);
      this.ventasHoy = total;
      this.cajaActual = total;
    });
  }

  // ========================
  // SALIR (LOGIN / ROLE)
  // ========================
  cerrarSesion() {
    this.router.navigate(['/select-role']);
  }

  // ========================
  // FIX COMPATIBILIDAD HTML
  // ========================
  logout() {
    this.cerrarSesion();
  }
}