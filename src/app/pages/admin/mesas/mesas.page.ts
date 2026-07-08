import { Component, OnInit, OnDestroy, inject } from '@angular/core';
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
  collectionData,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where
} from '@angular/fire/firestore';

import { Subscription } from 'rxjs';

type EstadoMesa =
  | 'libre'
  | 'activa'
  | 'preparando'
  | 'listo'
  | 'entregado_mesa'
  | 'cuenta'
  | 'pagado'
  | 'reservada';

type EstadoPedido =
  | 'pendiente_cocina'
  | 'preparando'
  | 'listo'
  | 'entregado_mesa'
  | 'cuenta'
  | 'pagado'
  | 'anulado';

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
export class MesasPage implements OnInit, OnDestroy {

  private firestore = inject(Firestore);
  private mesasSub?: Subscription;

  fechaActual = '';
  mesaSeleccionada: any = null;
  mostrarFormulario = false;

  totalLibres = 0;
  totalActivas = 0;
  totalReservadas = 0;
  totalListas = 0;
  totalEnCuenta = 0;

  nuevaMesa = {
    numero: '',
    capacidad: null as number | null,
    estado: 'libre' as EstadoMesa
  };

  editando = false;
  idMesaEditando: string | null = null;

  listaMesas: any[] = [];

  mostrarPedidoMesa = false;
  pedidoMesaActual: any[] = [];
  totalPedidoMesa = 0;
  horaInicioMesa = '';
  estadoPedidoMesa = '';
  meseroPedidoMesa = '';
  clientePedidoMesa = '';

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

  ngOnInit() {
    this.configurarFecha();
    this.cargarMesasFirebase();
  }

  ngOnDestroy() {
    this.mesasSub?.unsubscribe();
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

  cargarMesasFirebase() {
    const mesasRef = collection(this.firestore, 'mesas');

    this.mesasSub = collectionData(mesasRef, { idField: 'id' }).subscribe({
      next: (mesas: any[]) => {
        this.listaMesas = mesas
          .map(mesa => ({
            ...mesa,
            estado: this.normalizarEstadoMesa(mesa.estado),
            pedido: mesa.pedido ?? [],
            capacidad: Number(mesa.capacidad || 0),
            numero: String(mesa.numero || '')
          }))
          .sort((a, b) => Number(a.numero) - Number(b.numero));

        if (this.mesaSeleccionada?.id) {
          const actualizada = this.listaMesas.find(m => m.id === this.mesaSeleccionada.id);

          if (actualizada) {
            this.mesaSeleccionada = actualizada;
          }
        }

        this.calcularMetricas();
      },
      error: (error) => {
        console.error('❌ Error cargando mesas en tiempo real:', error);
      }
    });
  }

  seleccionarMesaVisual(mesa: any) {
    this.mesaSeleccionada = {
      ...mesa,
      estado: this.normalizarEstadoMesa(mesa.estado),
      pedido: mesa.pedido ?? []
    };

    this.mostrarFormulario = false;
    this.editando = false;
    this.mostrarPedidoMesa = false;
    this.limpiarPedidoMesa();
  }

  abrirFormularioNuevaMesa() {
    this.limpiarFormulario();
    this.editando = false;
    this.mostrarFormulario = true;
    this.mesaSeleccionada = null;
    this.mostrarPedidoMesa = false;
    this.limpiarPedidoMesa();
  }

  iniciarEdicion() {
    if (!this.mesaSeleccionada) return;

    this.editando = true;
    this.mostrarFormulario = true;
    this.idMesaEditando = this.mesaSeleccionada.id;

    this.nuevaMesa = {
      numero: String(this.mesaSeleccionada.numero || ''),
      capacidad: Number(this.mesaSeleccionada.capacidad || 0),
      estado: this.normalizarEstadoMesa(this.mesaSeleccionada.estado)
    };
  }

  cerrarPanel() {
    this.mostrarFormulario = false;
    this.limpiarFormulario();
    this.editando = false;
    this.idMesaEditando = null;
  }

  calcularMetricas() {
    this.totalLibres = this.listaMesas.filter(m => m.estado === 'libre').length;

    this.totalActivas = this.listaMesas.filter(m =>
      ['activa', 'preparando', 'entregado_mesa'].includes(m.estado)
    ).length;

    this.totalReservadas = this.listaMesas.filter(m => m.estado === 'reservada').length;
    this.totalListas = this.listaMesas.filter(m => m.estado === 'listo').length;
    this.totalEnCuenta = this.listaMesas.filter(m => m.estado === 'cuenta').length;
  }

  async verPedidoCompleto(mesa: any) {
    if (!mesa || !mesa.id) return;

    this.mostrarPedidoMesa = !this.mostrarPedidoMesa;

    if (!this.mostrarPedidoMesa) return;

    this.limpiarPedidoMesa();

    try {
      const pedidosRef = query(
        collection(this.firestore, 'pedidos'),
        where('idMesa', '==', mesa.id),
        where('estado', 'in', [
          'pendiente_cocina',
          'preparando',
          'listo',
          'entregado_mesa',
          'cuenta'
        ])
      );

      const querySnapshot = await getDocs(pedidosRef);

      let pedidoEncontrado: any = null;

      querySnapshot.forEach((documento) => {
        const data = documento.data();

        const candidato: any = {
          id: documento.id,
          ...data
        };

        if (!pedidoEncontrado) {
          pedidoEncontrado = candidato;
        } else {
          const fechaActual = this.convertirFecha(candidato.fecha || candidato.fechaPedido).getTime();
          const fechaAnterior = this.convertirFecha(pedidoEncontrado.fecha || pedidoEncontrado.fechaPedido).getTime();

          if (fechaActual > fechaAnterior) {
            pedidoEncontrado = candidato;
          }
        }
      });

      if (!pedidoEncontrado) {
        this.horaInicioMesa = 'Sin pedido activo';
        return;
      }

      this.horaInicioMesa = this.convertirHora(pedidoEncontrado.fecha || pedidoEncontrado.fechaPedido);
      this.estadoPedidoMesa = this.obtenerEstadoTextoPedido(pedidoEncontrado.estado);
      this.meseroPedidoMesa = pedidoEncontrado.mesero || 'No asignado';
      this.clientePedidoMesa = pedidoEncontrado.clienteNombre || 'Cliente general';

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

  async liberarMesaRapida(mesa: any) {
    if (!mesa || !mesa.id) return;

    const confirmar = confirm(
      '¿Deseas liberar esta mesa desde administración? Si tiene pedido activo, será marcado como anulado.'
    );

    if (!confirmar) return;

    try {
      const q = query(
        collection(this.firestore, 'pedidos'),
        where('idMesa', '==', mesa.id),
        where('estado', 'in', [
          'pendiente_cocina',
          'preparando',
          'listo',
          'entregado_mesa',
          'cuenta'
        ])
      );

      const querySnapshot = await getDocs(q);

      for (const documento of querySnapshot.docs) {
        const pedidoRef = doc(this.firestore, 'pedidos', documento.id);

        await updateDoc(pedidoRef, {
          estado: 'anulado',
          motivoAnulacion: 'Mesa liberada desde administración',
          fechaActualizacion: new Date()
        });
      }

      const mesaRef = doc(this.firestore, 'mesas', mesa.id);

      await updateDoc(mesaRef, {
        estado: 'libre',
        pedido: [],
        mesero: '',
        pedidoEnCocina: false,
        pedidoListo: false,
        pedidoEntregadoMesa: false,
        notificacionMesero: false,
        fechaPedido: null,
        fechaPedidoCocina: null,
        fechaEntregadoMesa: null,
        fechaCuenta: null
      });

      this.mesaSeleccionada = {
        ...mesa,
        estado: 'libre',
        pedido: []
      };

      this.mostrarPedidoMesa = false;
      this.limpiarPedidoMesa();
      this.calcularMetricas();

      console.log(`✅ Mesa ${mesa.numero} liberada desde administración.`);

    } catch (error) {
      console.error('❌ Error en flujo de liberación rápida:', error);
    }
  }

  async guardarMesa() {
    if (!this.nuevaMesa.numero.trim() || !this.nuevaMesa.capacidad) return;

    const mesaData = {
      numero: this.nuevaMesa.numero.trim(),
      capacidad: Number(this.nuevaMesa.capacidad),
      estado: this.normalizarEstadoMesa(this.nuevaMesa.estado),
      pedido: []
    };

    try {
      if (this.editando && this.idMesaEditando !== null) {
        const mesaRef = doc(this.firestore, 'mesas', this.idMesaEditando);

        await updateDoc(mesaRef, {
          numero: mesaData.numero,
          capacidad: mesaData.capacidad,
          estado: mesaData.estado
        });

      } else {
        await addDoc(collection(this.firestore, 'mesas'), mesaData);
      }

      this.mostrarFormulario = false;
      this.editando = false;
      this.idMesaEditando = null;
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

    const mesa = this.listaMesas.find(m => m.id === idFinal);

    if (mesa && mesa.estado !== 'libre') {
      alert('No puedes eliminar una mesa ocupada, activa, lista o en cuenta. Primero libérala.');
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

      if (this.mesaSeleccionada?.id === id) {
        this.mesaSeleccionada = null;
      }

      this.cerrarPanel();

    } catch (error) {
      console.error('❌ Error eliminando mesa desde Firestore:', error);
    }
  }

  normalizarEstadoMesa(estado: any): EstadoMesa {
    const e = String(estado || 'libre').toLowerCase().trim();

    if (e === 'disponible') return 'libre';
    if (e === 'ocupada') return 'activa';
    if (e === 'pendiente_cocina') return 'activa';
    if (e === 'recogido') return 'entregado_mesa';
    if (e === 'entregado') return 'entregado_mesa';

    if (
      e === 'libre' ||
      e === 'activa' ||
      e === 'preparando' ||
      e === 'listo' ||
      e === 'entregado_mesa' ||
      e === 'cuenta' ||
      e === 'pagado' ||
      e === 'reservada'
    ) {
      return e;
    }

    return 'libre';
  }

  obtenerEstadoTextoMesa(estado: any): string {
    const e = this.normalizarEstadoMesa(estado);

    switch (e) {
      case 'libre': return 'Libre';
      case 'activa': return 'Activa';
      case 'preparando': return 'Preparando';
      case 'listo': return 'Listo';
      case 'entregado_mesa': return 'Entregado';
      case 'cuenta': return 'En cuenta';
      case 'pagado': return 'Pagado';
      case 'reservada': return 'Reservada';
      default: return e;
    }
  }

  obtenerEstadoTextoPedido(estado: any): string {
    const e = this.normalizarEstadoPedido(estado);

    switch (e) {
      case 'pendiente_cocina': return 'Pendiente cocina';
      case 'preparando': return 'Preparando';
      case 'listo': return 'Listo';
      case 'entregado_mesa': return 'Entregado mesa';
      case 'cuenta': return 'En cuenta';
      case 'pagado': return 'Pagado';
      case 'anulado': return 'Anulado';
      default: return e;
    }
  }

  normalizarEstadoPedido(estado: any): EstadoPedido {
    const e = String(estado || 'pendiente_cocina').toLowerCase().trim();

    if (e === 'cocina') return 'preparando';
    if (e === 'entregado' || e === 'recogido') return 'entregado_mesa';
    if (e === 'cancelado' || e === 'liberado sin pagar') return 'anulado';

    if (
      e === 'pendiente_cocina' ||
      e === 'preparando' ||
      e === 'listo' ||
      e === 'entregado_mesa' ||
      e === 'cuenta' ||
      e === 'pagado' ||
      e === 'anulado'
    ) {
      return e;
    }

    return 'pendiente_cocina';
  }

  convertirFecha(fecha: any): Date {
    if (!fecha) return new Date(0);

    if (fecha?.toDate) return fecha.toDate();
    if (fecha?.seconds) return new Date(fecha.seconds * 1000);

    const fechaConvertida = new Date(fecha);

    return isNaN(fechaConvertida.getTime())
      ? new Date(0)
      : fechaConvertida;
  }

  convertirHora(fecha: any): string {
    const date = this.convertirFecha(fecha);

    if (isNaN(date.getTime())) return '--:--';

    return date.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  limpiarFormulario() {
    this.nuevaMesa = {
      numero: '',
      capacidad: null,
      estado: 'libre'
    };
  }

  limpiarPedidoMesa() {
    this.pedidoMesaActual = [];
    this.totalPedidoMesa = 0;
    this.horaInicioMesa = '';
    this.estadoPedidoMesa = '';
    this.meseroPedidoMesa = '';
    this.clientePedidoMesa = '';
  }
}