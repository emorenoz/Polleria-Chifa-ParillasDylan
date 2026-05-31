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
  IonNote,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonButtons,    // Añadido: Contenedor para la barra de botones superior
  IonBackButton  // Añadido: Componente nativo de la flecha de retroceso
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cash, create, trash, arrowBack } from 'ionicons/icons'; // Añadido: Icono arrowBack requerido para el botón de retroceso

@Component({
  selector: 'app-ventas',
  templateUrl: './ventas.page.html',
  styleUrls: ['./ventas.page.scss'],
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
    IonNote,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonButtons,    // Añadido al arreglo de imports
    IonBackButton  // Añadido al arreglo de imports
  ]
})
export class VentasPage implements OnInit {

  // Modelo reactivo para capturar las entradas del flujo de caja
  nuevaVenta = {
    cliente: '',
    total: null as number | null,
    metodoPago: ''
  };

  editando: boolean = false;
  idVentaEditando: string | null = null; // String acoplado para soportar los hashes de Firebase

  // Datos semilla para emular los cierres de caja en Firestore
  listaVentas: any[] = [
    { id: 'vnt_1', cliente: 'Mesa 04', total: 72.50, metodoPago: 'Yape / Plin 📱', hora: '13:15' },
    { id: 'vnt_2', cliente: 'Mesa 02', total: 118.00, metodoPago: 'Efectivo 💵', hora: '13:42' },
    { id: 'vnt_3', cliente: 'Pedido Delivery', total: 45.00, metodoPago: 'Tarjeta 💳', hora: '14:05' }
  ];

  constructor() {
    // Registro obligatorio de recursos gráficos incluyendo 'arrowBack' para el retroceso
    addIcons({ cash, create, trash, arrowBack });
  }

  async ngOnInit() {
    await this.cargarVentasFirebase();
  }

  // Simulación de escucha asíncrona para sincronizar transacciones
  async cargarVentasFirebase() {
    // Listo para: this.firestore.collection('ventas').orderBy('hora').valueChanges()...
  }

  // Registra una nueva transacción monetaria o actualiza un comprobante auditado
  async guardarVenta() {
    if (!this.nuevaVenta.cliente.trim() || !this.nuevaVenta.total || !this.nuevaVenta.metodoPago) return;

    const ahora = new Date();
    const horaFormateada = `${ahora.getHours().toString().padStart(2, '0')}:${ahora.getMinutes().toString().padStart(2, '0')}`;

    if (this.editando && this.idVentaEditando !== null) {
      // Simula: db.collection('ventas').doc(id).update(...)
      const index = this.listaVentas.findIndex(v => v.id === this.idVentaEditando);
      if (index !== -1) {
        this.listaVentas[index].cliente = this.nuevaVenta.cliente.trim();
        this.listaVentas[index].total = Number(this.nuevaVenta.total);
        this.listaVentas[index].metodoPago = this.nuevaVenta.metodoPago;
      }
      this.cancelarEdicion();
    } else {
      // Simula: db.collection('ventas').add(...) con UID automático en la nube
      const mockFirebaseId = 'fs_vnt_' + Math.random().toString(36).substr(2, 9);
      this.listaVentas.push({
        id: mockFirebaseId,
        cliente: this.nuevaVenta.cliente.trim(),
        total: Number(this.nuevaVenta.total),
        metodoPago: this.nuevaVenta.metodoPago,
        hora: horaFormateada
      });
    }

    this.limpiarFormulario();
  }

  // Pasa los datos de la boleta seleccionada al formulario para re-auditar el cobro
  seleccionarVenta(venta: any) {
    this.editando = true;
    this.idVentaEditando = venta.id;
    this.nuevaVenta = {
      cliente: venta.cliente,
      total: venta.total,
      metodoPago: venta.metodoPago
    };
  }

  cancelarEdicion() {
    this.editando = false;
    this.idVentaEditando = null;
    this.limpiarFormulario();
  }

  // Simula la anulación física de un documento: db.collection('ventas').doc(id).delete()
  async eliminarVenta(id: string) {
    this.listaVentas = this.listaVentas.filter(v => v.id !== id);
  }

  limpiarFormulario() {
    this.nuevaVenta = {
      cliente: '',
      total: null,
      metodoPago: ''
    };
  }
}