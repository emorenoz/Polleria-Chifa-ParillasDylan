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

// 🔥 Cambiamos la procedencia a '@angular/fire/firestore' para conectarlo nativamente con Angular 17
import { Firestore, collection, addDoc } from '@angular/fire/firestore';

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

  // 🔥 Conectamos Firebase de forma segura con inject() sin alterar tus variables
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

  ngOnInit() {
    // Ya no necesitas inicializar getFirestore() aquí dentro, el inject() de arriba se encarga de todo de forma automática.
  }

  // 100% Tu lógica intacta
  agregar(producto: any) {
    const item = this.carrito.find(p => p.nombre === producto.nombre);

    if (item) {
      item.cantidad++;
    } else {
      this.carrito.push({ ...producto, cantidad: 1 });
    }

    this.calcularTotal();
  }

  // 100% Tu lógica intacta
  eliminar(index: number) {
    this.carrito.splice(index, 1);
    this.calcularTotal();
  }

  // 100% Tu lógica intacta
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
        estado: 'pendiente',
        fecha: new Date()
      };

      // Guardamos en tu Firebase usando la conexión inyectada de arriba
      await addDoc(collection(this.db, 'pedidos'), pedido);

      alert('¡Pedido enviado con éxito a la cocina!');

      // Limpieza corregida respetando tus tipos de datos originales
      this.carrito = [];
      this.total = 0;
      this.mesa = '';
      this.comentario = ''; // Corregido: Comentario vuelve a ser un texto vacío
      this.cliente = { nombre: '', apellido: '' }; // Corregido: Cliente vuelve a su estado original

      // Redirección de regreso al panel
      this.router.navigate(['/mesero-dashboard']);

    } catch (error) {
      console.error("Error guardando el pedido:", error);
      alert('Hubo un error al procesar el pedido en Firebase.');
    }
  }
}