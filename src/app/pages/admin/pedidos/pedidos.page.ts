import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonMenuButton,
  IonIcon
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  searchOutline,
  funnelOutline,
  syncOutline,
  printOutline,
  eyeOutline
} from 'ionicons/icons';

import {
  Firestore,
  collection,
  getDocs
} from '@angular/fire/firestore';

@Component({
  selector: 'app-pedidos',
  templateUrl: './pedidos.page.html',
  styleUrls: ['./pedidos.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonMenuButton,
    IonIcon
  ],
  providers: [DatePipe]
})
export class PedidosPage implements OnInit {

  private firestore = inject(Firestore);

  fechaActual: string = '';

  totalPendientes = 0;
  totalCocina = 0;
  totalEntregados = 0;
  totalAnulados = 0;
  montoTotalGlobal = 0;

  listaPedidos: any[] = [];

  constructor(private datePipe: DatePipe) {
    addIcons({
      searchOutline,
      funnelOutline,
      syncOutline,
      printOutline,
      eyeOutline
    });
  }

  ngOnInit() {
    this.configurarFecha();
    this.cargarPedidosFirebase();
  }

  configurarFecha() {
    const hoy = new Date();
    this.fechaActual =
      this.datePipe.transform(
        hoy,
        "EEEE, d 'de' MMMM 'de' yyyy",
        '',
        'es-PE'
      ) || '';
  }

  // 🔥 CARGAR PEDIDOS DESDE FIREBASE
  async cargarPedidosFirebase() {

    try {

      const snapshot = await getDocs(
        collection(this.firestore, 'pedidos')
      );

      this.listaPedidos = [];

      snapshot.forEach(docSnap => {

        const data: any = docSnap.data();

        // 🔥 Convertimos a tu estructura sin romper UI
        this.listaPedidos.push({
          id: docSnap.id,
          mesa: data.mesa || '',
          mesero: data.mesero || 'No asignado',
          items: data.productos?.length || 0,
          total: data.total || 0,
          estado: data.estado || 'pendiente',
          hora: this.extraerHora(data.fecha)
        });

      });

      this.calcularMetricas();

      console.log(
        '✅ Pedidos cargados:',
        this.listaPedidos.length
      );

    } catch (error) {

      console.error('❌ Error cargando pedidos:', error);

    }

  }

  // 🔥 EXTRAER HORA DESDE FIREBASE TIMESTAMP
  extraerHora(fecha: any): string {

    if (!fecha) return '--:--';

    try {

      const date = fecha.toDate
        ? fecha.toDate()
        : new Date(fecha);

      return date
        .toTimeString()
        .slice(0, 5);

    } catch {
      return '--:--';
    }

  }

  calcularMetricas() {

    this.totalPendientes =
      this.listaPedidos.filter(p => p.estado === 'pendiente').length;

    this.totalCocina =
      this.listaPedidos.filter(p => p.estado === 'cocina').length;

    this.totalEntregados =
      this.listaPedidos.filter(p => p.estado === 'entregado').length;

    this.totalAnulados =
      this.listaPedidos.filter(p => p.estado === 'anulado').length;

    this.montoTotalGlobal =
      this.listaPedidos.reduce(
        (acc, pedido) => acc + pedido.total,
        0
      );

  }

  filtrarPedidos() {}

  actualizarDatos() {}

  verDetallePedido(id: string) {
    console.log('Detalle:', id);
  }

}