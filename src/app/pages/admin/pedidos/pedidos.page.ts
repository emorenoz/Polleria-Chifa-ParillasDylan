import { Component, OnInit } from '@angular/core';
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
  IonInput,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonIcon,
  IonLabel,
  IonBadge,
  IonNote,
  IonItemSliding,
  IonItemOptions,
  IonItemOption
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { restaurant, flame, checkmarkDone, create, trash } from 'ionicons/icons';

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
    IonTitle, 
    IonToolbar,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonIcon,
    IonLabel,
    IonBadge,
    IonNote,
    IonItemSliding,
    IonItemOptions,
    IonItemOption
  ]
})
export class PedidosPage implements OnInit {

  // Modelo reactivo del formulario de comandas
  nuevoPedido = {
    mesa: '',
    detalle: '',
    total: null as number | null
  };

  // Estados para control de edición
  editando: boolean = false;
  idPedidoEditando: string | null = null; // String para emparejar con los strings aleatorios de Firebase UIDs

  // Datos semilla locales (Simulación de colecciones en tiempo real)
  listaPedidos: any[] = [
    { id: 'ped_1', mesa: 'Mesa 01', detalle: '1 Pollo a la Brasa + Papas + Gaseosa Litro', total: 65.00, estado: 'pendiente', hora: '19:30' },
    { id: 'ped_2', mesa: 'Mesa 03', detalle: '1 Chaufa de Pollo + 1 Porción de Wantán', total: 38.50, estado: 'en cocina', hora: '19:42' }
  ];

  constructor() {
    // Registro de iconos para la arquitectura Standalone
    addIcons({ restaurant, flame, checkmarkDone, create, trash });
  }

  async ngOnInit() {
    await this.cargarPedidosFirebase();
  }

  // Simulación de escucha asíncrona de Firestore
  async cargarPedidosFirebase() {
    // Listo para: this.firestore.collection('pedidos').snapshotChanges()...
  }

  // Agrega una comanda o actualiza la información modificada
  async guardarPedido() {
    if (!this.nuevoPedido.mesa || !this.nuevoPedido.detalle.trim() || !this.nuevoPedido.total) return;

    const ahora = new Date();
    const horaFormateada = `${ahora.getHours().toString().padStart(2, '0')}:${ahora.getMinutes().toString().padStart(2, '0')}`;

    if (this.editando && this.idPedidoEditando !== null) {
      // Simulación de actualización: db.collection('pedidos').doc(id).update(...)
      const index = this.listaPedidos.findIndex(p => p.id === this.idPedidoEditando);
      if (index !== -1) {
        this.listaPedidos[index].mesa = this.nuevoPedido.mesa;
        this.listaPedidos[index].detalle = this.nuevoPedido.detalle.trim();
        this.listaPedidos[index].total = Number(this.nuevoPedido.total);
      }
      this.cancelarEdicion();
    } else {
      // Simulación de inserción: db.collection('pedidos').add(...)
      const mockFirebaseId = 'fs_p_' + Math.random().toString(36).substr(2, 9);
      this.listaPedidos.push({
        id: mockFirebaseId,
        mesa: this.nuevoPedido.mesa,
        detalle: this.nuevoPedido.detalle.trim(),
        total: Number(this.nuevoPedido.total),
        estado: 'pendiente',
        hora: horaFormateada
      });
    }

    this.limpiarFormulario();
  }

  // Cambia el estado de la comanda de forma asíncrona al deslizar el elemento
  async cambiarEstado(id: string, nuevoEstado: string) {
    // Simula: db.collection('pedidos').doc(id).update({ estado: nuevoEstado })
    const index = this.listaPedidos.findIndex(p => p.id === id);
    if (index !== -1) {
      this.listaPedidos[index].estado = nuevoEstado;
    }
  }

  // Carga los datos de la comanda en los inputs para su edición
  seleccionarPedido(pedido: any) {
    this.editando = true;
    this.idPedidoEditando = pedido.id;
    this.nuevoPedido = {
      mesa: pedido.mesa,
      detalle: pedido.detalle,
      total: pedido.total
    };
  }

  cancelarEdicion() {
    this.editando = false;
    this.idPedidoEditando = null;
    this.limpiarFormulario();
  }

  // Simula: db.collection('pedidos').doc(id).delete()
  async eliminarPedido(id: string) {
    this.listaPedidos = this.listaPedidos.filter(p => p.id !== id);
  }

  limpiarFormulario() {
    this.nuevoPedido = {
      mesa: '',
      detalle: '',
      total: null
    };
  }
}