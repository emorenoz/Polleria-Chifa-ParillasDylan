import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonButton,
  IonInput,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent
} from '@ionic/angular/standalone';

import {
  Firestore,
  collection,
  addDoc,
  serverTimestamp
} from '@angular/fire/firestore';

@Component({
  selector: 'app-nuevo-pedido',
  templateUrl: './nuevo-pedido.page.html',
  styleUrls: ['./nuevo-pedido.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonButton,
    IonInput,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent
  ]
})
export class NuevoPedidoPage implements OnInit {

  private db: Firestore = inject(Firestore);

  cliente = { nombre: '', apellido: '' };
  mesa: string = '';
  comentario: string = '';

  productos = [
    { nombre: 'Pollo a la Brasa', precio: 45 },
    { nombre: 'Chaufa Especial', precio: 25 },
    { nombre: 'Parrilla Mixta', precio: 60 },
    { nombre: 'Inka Cola', precio: 8 }
  ];

  carrito: any[] = [];
  total: number = 0;

  constructor(private router: Router) {}

  ngOnInit() {}

  agregar(producto: any) {
    const item = this.carrito.find(p => p.nombre === producto.nombre);

    if (item) {
      item.cantidad++;
    } else {
      this.carrito.push({ ...producto, cantidad: 1 });
    }

    this.calcularTotal();
  }

  eliminar(index: number) {
    this.carrito.splice(index, 1);
    this.calcularTotal();
  }

  calcularTotal() {
    this.total = this.carrito.reduce(
      (sum, item) => sum + item.precio * item.cantidad,
      0
    );
  }

  async enviarPedido() {
    if (!this.mesa) {
      alert('Por favor, selecciona una mesa antes de enviar.');
      return;
    }

    if (this.carrito.length === 0) {
      alert('El carrito está vacío. Agrega productos al pedido.');
      return;
    }

    try {
      const pedido = {
        cliente: this.cliente,
        mesa: this.mesa,
        productos: this.carrito,
        total: this.total,
        comentario: this.comentario,
        estado: 'pendiente_cocina',
        fecha: serverTimestamp()
      };

      await addDoc(collection(this.db, 'pedidos'), pedido);

      alert('¡Pedido enviado con éxito a la cocina!');

      this.carrito = [];
      this.total = 0;
      this.mesa = '';
      this.comentario = '';
      this.cliente = { nombre: '', apellido: '' };

      this.router.navigate(['/mesero-dashboard']);

    } catch (error) {
      console.error('Error guardando el pedido:', error);
      alert('Hubo un error al procesar el pedido en Firebase.');
    }
  }
}