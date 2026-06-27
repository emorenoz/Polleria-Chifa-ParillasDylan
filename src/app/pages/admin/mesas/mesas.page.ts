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
  create, trash, arrowBack,
  addOutline, closeOutline, peopleOutline, timeOutline,
  personOutline, documentTextOutline, restaurantOutline
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

  // --- VARIABLES DE INTERFAZ ---
  fechaActual: string = '';
  mesaSeleccionada: any = null;
  mostrarFormulario: boolean = false;

  // Métricas para las tarjetas
  totalLibres: number = 0;
  totalActivas: number = 0;
  totalReservadas: number = 0;

  // Modelo del formulario conectado con el HTML
  nuevaMesa = {
    numero: '',
    capacidad: null as number | null,
    estado: 'disponible' // 'disponible', 'ocupada', 'reservada'
  };

  // Estados de control para la edición
  editando: boolean = false;
  idMesaEditando: string | null = null;

  // Lista obtenida desde Firebase
  listaMesas: any[] = [];

  constructor() {
    addIcons({
      create, trash, arrowBack,
      addOutline, closeOutline, peopleOutline, timeOutline,
      personOutline, documentTextOutline, restaurantOutline
    });
  }

  async ngOnInit() {
    this.configurarFecha();
    await this.cargarMesasFirebase();
  }

  configurarFecha() {
    const opciones: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    this.fechaActual = new Date().toLocaleDateString('es-PE', opciones);
  }

  // --- LÓGICA VISUAL ---

  seleccionarMesaVisual(mesa: any) {
    this.mesaSeleccionada = mesa;
    this.mostrarFormulario = false;
    this.editando = false;
  }

  abrirFormularioNuevaMesa() {
    this.limpiarFormulario();
    this.editando = false;
    this.mostrarFormulario = true;
    this.mesaSeleccionada = null;
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

  // ¡FLUJO CORREGIDO!: Al liberar una mesa manualmente, desactiva sus pedidos activos para que no confundan a la caja
  async liberarMesaRapida(mesa: any) {
    if (!mesa || !mesa.id) return;
    try {
      // 1. Cambiar estado de la mesa a disponible
      const mesaRef = doc(this.firestore, 'mesas', mesa.id);
      await updateDoc(mesaRef, { estado: 'disponible' });

      // 2. Buscar si hay pedidos pendientes de esta mesa y cancelarlos/archivarlos para no alterar la caja
      const q = query(
        collection(this.firestore, 'pedidos'),
        where('idMesa', '==', mesa.id),
        where('estado', 'in', ['Cocina', 'Entregado'])
      );
      const querySnapshot = await getDocs(q);

      for (const documento of querySnapshot.docs) {
        const pedidoRef = doc(this.firestore, 'pedidos', documento.id);
        await updateDoc(pedidoRef, { estado: 'Liberado Sin Pagar' });
      }

      // Actualizamos la interfaz reactivamente
      mesa.estado = 'disponible';
      if (this.mesaSeleccionada && this.mesaSeleccionada.id === mesa.id) {
        this.mesaSeleccionada.estado = 'disponible';
      }

      this.calcularMetricas();
      console.log('✅ Mesa liberada y pedidos limpiados para la caja.');
    } catch (error) {
      console.error('Error en flujo de liberación rápida:', error);
    }
  }

  // --- LÓGICA DE FIREBASE ---

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
      console.log('✅ Mesas cargadas:', this.listaMesas);
    } catch (error) {
      console.error('❌ Error cargando mesas:', error);
    }
  }

  async guardarMesa() {
    if (!this.nuevaMesa.numero.trim() || !this.nuevaMesa.capacidad) { return; }

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
        console.log('✅ Mesa actualizada');
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
        console.log('✅ Mesa registrada. ID:', docRef.id);
      }

      this.calcularMetricas();
      this.mostrarFormulario = false;
      this.editando = false;
      this.limpiarFormulario();

    } catch (error) {
      console.error('❌ Error guardando mesa:', error);
    }
  }

  // --- SECCIÓN DE ELIMINACIÓN SEGURA ---
  confirmarEliminacion(id: string) {
    const idFinal = id || this.mesaSeleccionada?.id;

    if (!idFinal) {
      alert('Error: No se pudo capturar el identificador único de esta mesa.');
      return;
    }

    const confirmar = confirm('¿Estás seguro de que deseas eliminar esta mesa permanentemente? Esta acción quitará la mesa del plano del salón.');
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
      console.log('✅ Mesa eliminada con éxito de Firebase');
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