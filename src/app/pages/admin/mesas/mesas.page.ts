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
  IonInput,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonIcon,
  IonLabel,
  IonBadge,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonButtons,
  IonBackButton,
  IonMenuButton
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  create,
  trash,
  arrowBack,
  addOutline,
  closeOutline,
  peopleOutline,
  timeOutline,
  personOutline,
  documentTextOutline,
  restaurantOutline
} from 'ionicons/icons';

import {
  Firestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where
} from '@angular/fire/firestore';

@Component({
  selector: 'app-mesas',
  templateUrl: './mesas.page.html',
  styleUrls: ['./mesas.page.scss'],
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
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonButtons,
    IonBackButton,
    IonMenuButton
  ]
})
export class MesasPage implements OnInit {

  private firestore = inject(Firestore);

  fechaActual = '';
  mesaSeleccionada: any = null;
  mostrarFormulario = false;

  totalLibres = 0;
  totalActivas = 0;
  totalReservadas = 0;

  nuevaMesa = {
    numero: '',
    capacidad: null as number | null,
    estado: 'disponible'
  };

  editando = false;
  idMesaEditando: string | null = null;

  listaMesas: any[] = [];

  // Pedido completo de la mesa
  mostrarPedidoMesa = false;
  pedidoMesaActual: any[] = [];
  totalPedidoMesa = 0;
  horaInicioMesa = '';

  constructor() {
    addIcons({
      create,
      trash,
      arrowBack,
      addOutline,
      closeOutline,
      peopleOutline,
      timeOutline,
      personOutline,
      documentTextOutline,
      restaurantOutline
    });
  }

  async ngOnInit() {
    this.configurarFecha();
    await this.cargarMesasFirebase();
  }

  configurarFecha() {
    const opciones: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };

    this.fechaActual = new Date().toLocaleDateString('es-PE', opciones);
  }

  seleccionarMesaVisual(mesa: any) {
    this.mesaSeleccionada = mesa;
    this.mostrarFormulario = false;
    this.editando = false;

    this.mostrarPedidoMesa = false;
    this.pedidoMesaActual = [];
    this.totalPedidoMesa = 0;
    this.horaInicioMesa = '';
  }

  abrirFormularioNuevaMesa() {
    this.limpiarFormulario();
    this.editando = false;
    this.mostrarFormulario = true;
    this.mesaSeleccionada = null;

    this.mostrarPedidoMesa = false;
    this.pedidoMesaActual = [];
    this.totalPedidoMesa = 0;
  }

  iniciarEdicion() {
    if (!this.mesaSeleccionada) return;

    this.editando = true;
    this.mostrarFormulario = true;
    this.idMesaEditando = this.mesaSeleccionada.id;

    this.nuevaMesa = {
      numero: this.mesaSeleccionada.numero,
      capacidad: this.mesaSeleccionada.capacidad,
      estado: this.mesaSeleccionada.estado
    };
  }

  cerrarPanel() {
    this.mostrarFormulario = false;
    this.limpiarFormulario();
    this.editando = false;
    this.idMesaEditando = null;
  }

  calcularMetricas() {
    this.totalLibres = this.listaMesas.filter(m => m.estado === 'disponible').length;
    this.totalActivas = this.listaMesas.filter(m => m.estado === 'ocupada').length;
    this.totalReservadas = this.listaMesas.filter(m => m.estado === 'reservada').length;
  }

  async verPedidoCompleto(mesa: any) {
    if (!mesa || !mesa.id) return;

    this.mostrarPedidoMesa = !this.mostrarPedidoMesa;

    if (!this.mostrarPedidoMesa) {
      return;
    }

    this.pedidoMesaActual = [];
    this.totalPedidoMesa = 0;
    this.horaInicioMesa = '';

    try {
      const pedidosRef = query(
        collection(this.firestore, 'pedidos'),
        where('idMesa', '==', mesa.id),
        where('estado', 'in', ['Cocina', 'Preparando', 'Listo', 'Entregado'])
      );

      const querySnapshot = await getDocs(pedidosRef);

      let pedidoEncontrado: any = null;

      querySnapshot.forEach((documento) => {
        pedidoEncontrado = {
          id: documento.id,
          ...documento.data()
        };
      });

      if (!pedidoEncontrado) {
        return;
      }

      this.horaInicioMesa = this.convertirHora(pedidoEncontrado.fecha);

      const productos = pedidoEncontrado.productos || pedidoEncontrado.items || [];

      this.pedidoMesaActual = productos.map((item: any) => {
        const cantidad = Number(item.cantidad || 1);
        const precio = Number(item.precio || item.precioUnitario || 0);
        const subtotal = Number(item.subtotal || cantidad * precio);

        return {
          nombre: item.nombre || item.producto || 'Producto',
          cantidad,
          precio,
          subtotal
        };
      });

      this.totalPedidoMesa = this.pedidoMesaActual.reduce(
        (total, item) => total + Number(item.subtotal || 0),
        0
      );

    } catch (error) {
      console.error('❌ Error cargando pedido de la mesa:', error);
    }
  }

  convertirHora(fecha: any): string {
    if (!fecha) return '11:30';

    if (fecha.seconds) {
      return new Date(fecha.seconds * 1000).toLocaleTimeString('es-PE', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    return new Date(fecha).toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  async liberarMesaRapida(mesa: any) {
    if (!mesa || !mesa.id) return;

    try {
      const mesaRef = doc(this.firestore, 'mesas', mesa.id);
      await updateDoc(mesaRef, { estado: 'disponible' });

      const q = query(
        collection(this.firestore, 'pedidos'),
        where('idMesa', '==', mesa.id),
        where('estado', 'in', ['Cocina', 'Preparando', 'Listo', 'Entregado'])
      );

      const querySnapshot = await getDocs(q);

      for (const documento of querySnapshot.docs) {
        const pedidoRef = doc(this.firestore, 'pedidos', documento.id);
        await updateDoc(pedidoRef, { estado: 'Liberado Sin Pagar' });
      }

      mesa.estado = 'disponible';

      if (this.mesaSeleccionada && this.mesaSeleccionada.id === mesa.id) {
        this.mesaSeleccionada.estado = 'disponible';
      }

      this.mostrarPedidoMesa = false;
      this.pedidoMesaActual = [];
      this.totalPedidoMesa = 0;

      this.calcularMetricas();

    } catch (error) {
      console.error('Error en flujo de liberación rápida:', error);
    }
  }

  async cargarMesasFirebase() {
    try {
      const querySnapshot = await getDocs(collection(this.firestore, 'mesas'));

      this.listaMesas = [];

      querySnapshot.forEach((documento) => {
        this.listaMesas.push({
          id: documento.id,
          ...documento.data()
        });
      });

      this.calcularMetricas();

    } catch (error) {
      console.error('❌ Error cargando mesas:', error);
    }
  }

  async guardarMesa() {
    if (!this.nuevaMesa.numero.trim() || !this.nuevaMesa.capacidad) return;

    try {
      if (this.editando && this.idMesaEditando !== null) {
        const mesaRef = doc(this.firestore, 'mesas', this.idMesaEditando);

        await updateDoc(mesaRef, {
          numero: this.nuevaMesa.numero.trim(),
          capacidad: Number(this.nuevaMesa.capacidad),
          estado: this.nuevaMesa.estado
        });

        const index = this.listaMesas.findIndex(mesa => mesa.id === this.idMesaEditando);

        if (index !== -1) {
          this.listaMesas[index] = {
            id: this.idMesaEditando,
            numero: this.nuevaMesa.numero.trim(),
            capacidad: Number(this.nuevaMesa.capacidad),
            estado: this.nuevaMesa.estado
          };

          this.mesaSeleccionada = this.listaMesas[index];
        }

      } else {
        const docRef = await addDoc(collection(this.firestore, 'mesas'), {
          numero: this.nuevaMesa.numero.trim(),
          capacidad: Number(this.nuevaMesa.capacidad),
          estado: this.nuevaMesa.estado
        });

        const nuevaMesaGuardada = {
          id: docRef.id,
          numero: this.nuevaMesa.numero.trim(),
          capacidad: Number(this.nuevaMesa.capacidad),
          estado: this.nuevaMesa.estado
        };

        this.listaMesas.push(nuevaMesaGuardada);
        this.mesaSeleccionada = nuevaMesaGuardada;
      }

      this.calcularMetricas();
      this.mostrarFormulario = false;
      this.editando = false;
      this.limpiarFormulario();

    } catch (error) {
      console.error('❌ Error guardando mesa:', error);
    }
  }

  confirmarEliminacion(id: string) {
    const idFinal = id || this.mesaSeleccionada?.id;

    if (!idFinal) {
      alert('Error: No se pudo capturar el identificador único de esta mesa.');
      return;
    }

    const confirmar = confirm('¿Estás seguro de que deseas eliminar esta mesa permanentemente?');

    if (confirmar) {
      this.eliminarMesa(idFinal);
    }
  }

  async eliminarMesa(id: string) {
    try {
      await deleteDoc(doc(this.firestore, 'mesas', id));

      this.listaMesas = this.listaMesas.filter(mesa => mesa.id !== id);

      this.calcularMetricas();
      this.cerrarPanel();
      this.mesaSeleccionada = null;

    } catch (error) {
      console.error('❌ Error eliminando mesa desde Firestore:', error);
    }
  }

  limpiarFormulario() {
    this.nuevaMesa = {
      numero: '',
      capacidad: null,
      estado: 'disponible'
    };
  }
}