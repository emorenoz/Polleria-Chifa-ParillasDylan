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

  // =========================
  // 🔥 FIREBASE (TU LÓGICA)
  // =========================
  private firestore = inject(Firestore);

  pedidos: any[] = [];

  pedidosNuevos = 0;
  pedidosPreparando = 0;
  pedidosListos = 0;

  // =========================
  // 👨‍🍳 UI MESERO / POS
  // =========================
  nombreMesero = 'Mesero';

  horaActual: string = '';

  mesas: any[] = [];
  mesaSeleccionada: any = null;

  productosFiltrados: any[] = [];

  categorias: string[] = ['Todos', 'Bebidas', 'Comidas'];
  categoriaSeleccionada: string = 'Todos';

  ngOnInit() {
    this.inicializarMesas();
    this.actualizarHora();
    this.cargarPedidosFirebase();
  }

  // =========================
  // 🕒 HORA EN VIVO
  // =========================
  actualizarHora() {
    setInterval(() => {
      this.horaActual = new Date().toLocaleTimeString();
    }, 1000);
  }

  // =========================
  // 🪑 MESAS (SIMULADAS O FUTURO FIREBASE)
  // =========================
  inicializarMesas() {
    this.mesas = Array.from({ length: 12 }, (_, i) => ({
      id: i + 1,
      numero: i + 1,
      estado: 'libre',
      pedido: []
    }));
  }

  seleccionarMesa(mesa: any) {
    this.mesaSeleccionada = mesa;
  }

  // =========================
  // 🍔 PRODUCTOS (EJEMPLO BASE)
  // =========================
  seleccionarCategoria(cat: string) {
    this.categoriaSeleccionada = cat;
  }

  agregarProducto(prod: any) {
    if (!this.mesaSeleccionada) return;

    if (!this.mesaSeleccionada.pedido) {
      this.mesaSeleccionada.pedido = [];
    }

    const existente = this.mesaSeleccionada.pedido.find(
      (p: any) => p.producto.id === prod.id
    );

    if (existente) {
      existente.cantidad++;
    } else {
      this.mesaSeleccionada.pedido.push({
        producto: prod,
        cantidad: 1
      });
    }

    this.mesaSeleccionada.estado = 'activa';
  }

  modificarCantidad(item: any, valor: number) {
    item.cantidad += valor;

    if (item.cantidad <= 0) {
      const index = this.mesaSeleccionada.pedido.indexOf(item);
      this.mesaSeleccionada.pedido.splice(index, 1);
    }
  }

  calcularTotal(): number {
    if (!this.mesaSeleccionada?.pedido) return 0;

    return this.mesaSeleccionada.pedido.reduce(
      (total: number, item: any) =>
        total + item.producto.precio * item.cantidad,
      0
    );
  }

  // =========================
  // 💰 FLUJO DE MESA
  // =========================
  pedirCuenta() {
    if (this.mesaSeleccionada) {
      this.mesaSeleccionada.estado = 'cuenta';
    }
  }

  liberarMesa() {
    if (this.mesaSeleccionada) {
      this.mesaSeleccionada.estado = 'libre';
      this.mesaSeleccionada.pedido = [];
      this.mesaSeleccionada = null;
    }
  }

  // =========================
  // 🔥 FIREBASE (TU LÓGICA ORIGINAL)
  // =========================
  cargarPedidosFirebase() {
    const pedidosRef = collection(this.firestore, 'pedidos');

    collectionData(pedidosRef, { idField: 'id' }).subscribe((data: any[]) => {

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

      this.pedidosNuevos = data.filter(p => p.estado === 'pendiente').length;
      this.pedidosPreparando = data.filter(p => p.estado === 'cocina').length;
      this.pedidosListos = data.filter(p => p.estado === 'entregado').length;
    });
  }
}