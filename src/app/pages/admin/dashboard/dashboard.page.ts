import { Component, OnInit, LOCALE_ID, inject } from '@angular/core';
import { CommonModule, DatePipe, registerLocaleData } from '@angular/common';
import localeEsPe from '@angular/common/locales/es-PE';

import {
  IonContent, IonHeader, IonToolbar, IonButtons, IonMenuButton, IonIcon,
  IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardSubtitle,
  IonCardTitle, IonCardContent, IonBadge, IonList, IonItem, IonLabel
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { trendingUpOutline, cartOutline, gridOutline, peopleOutline, timeOutline } from 'ionicons/icons';

// 🔥 FIREBASE
import {
  Firestore,
  collection,
  collectionData
} from '@angular/fire/firestore';
import { Subscription } from 'rxjs';

registerLocaleData(localeEsPe);

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonToolbar, IonButtons, IonMenuButton, IonIcon,
    IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardSubtitle,
    IonCardTitle, IonCardContent, IonBadge, IonList, IonItem, IonLabel
  ],
  providers: [
    DatePipe,
    { provide: LOCALE_ID, useValue: 'es-PE' }
  ]
})
export class DashboardPage implements OnInit {

  fechaActual: string = '';

  ventasDia: number = 0;
  pedidosHoy: number = 0;
  ventasCrecimiento: number = 0;

  pedidosActivos: number = 0;
  pedidosCocina: number = 0;
  pedidosPendientes: number = 0;
  pedidosCrecimiento: number = 0;

  mesasOcupadas: number = 0;
  mesasTotales: number = 0;
  mesasEsperandoCuenta: number = 0;
  mesasCrecimiento: number = 0;

  clientesHoy: number = 0;
  clientesNuevos: number = 0;
  clientesCrecimiento: number = 0;

  ultimosPedidos: any[] = [];

  private firestore = inject(Firestore);
  private subPedidos!: Subscription;
  private subVentas!: Subscription;
  private subClientes!: Subscription;
  private subMesas!: Subscription;

  constructor(private datePipe: DatePipe) {
    addIcons({ trendingUpOutline, cartOutline, gridOutline, peopleOutline, timeOutline });
  }

  ngOnInit() {
    this.configurarFecha();
    this.cargarDashboardFirebase();
  }

  configurarFecha() {
    const hoy = new Date();
    this.fechaActual =
      this.datePipe.transform(hoy, "EEEE, d 'de' MMMM 'de' yyyy", '', 'es-PE') || 'Hoy';
  }

  async cargarDashboardFirebase() {

    // =========================
    // 🔥 PEDIDOS (colección: pedidos)
    // =========================
    const pedidosRef = collection(this.firestore, 'pedidos');

    this.subPedidos = collectionData(pedidosRef, { idField: 'id' }).subscribe((pedidos: any[]) => {

      this.pedidosHoy = pedidos.length;

      this.pedidosPendientes = pedidos.filter(p => p.estado === 'pendiente').length;
      this.pedidosCocina = pedidos.filter(p => p.estado === 'cocina').length;
      this.pedidosActivos = this.pedidosPendientes + this.pedidosCocina;

      this.ultimosPedidos = pedidos
        .slice(-5)
        .reverse()
        .map(p => ({
          id: p.id || '---',
          mesa: p.mesa,
          descripcion: (p.productos || []).map((x: any) => x.nombre).join(' + '),
          total: p.total,
          estado: p.estado,
          hora: new Date(p.fecha?.seconds ? p.fecha.seconds * 1000 : p.fecha).toLocaleTimeString()
        }));
    });

    // =========================
    // 🔥 VENTAS (colección: ventas)
    // =========================
    const ventasRef = collection(this.firestore, 'ventas');

    this.subVentas = collectionData(ventasRef, { idField: 'id' }).subscribe((ventas: any[]) => {
      this.ventasDia = ventas.reduce((acc, v) => acc + (v.total || 0), 0);
    });

    // =========================
    // 🔥 CLIENTES (colección: clientes)
    // =========================
    const clientesRef = collection(this.firestore, 'clientes');

    this.subClientes = collectionData(clientesRef, { idField: 'id' }).subscribe((clientes: any[]) => {
      this.clientesHoy = clientes.length;
      this.clientesNuevos = clientes.slice(-5).length;
    });

    // =========================
    // 🔥 MESAS (colección: mesas)
    // =========================
    const mesasRef = collection(this.firestore, 'mesas');

    this.subMesas = collectionData(mesasRef, { idField: 'id' }).subscribe((mesas: any[]) => {
      this.mesasTotales = mesas.length;
      this.mesasOcupadas = mesas.filter(m => m.estado === 'ocupada').length;
      this.mesasEsperandoCuenta = mesas.filter(m => m.estado === 'esperando').length;
    });

    // métricas simuladas (puedes luego calcularlas real)
    this.ventasCrecimiento = 12;
    this.pedidosCrecimiento = 3;
    this.mesasCrecimiento = 2;
    this.clientesCrecimiento = 8;
  }
}