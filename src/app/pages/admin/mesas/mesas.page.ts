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
  IonItemSliding,
  IonItemOptions,
  IonItemOption
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { create, trash } from 'ionicons/icons';

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
    IonItemOption
  ]
})
export class MesasPage implements OnInit {

  // Modelo del formulario conectado con el HTML
  nuevaMesa = {
    numero: '',
    capacidad: null as number | null,
    estado: 'disponible'
  };

  // Estados de control para la edición
  editando: boolean = false;
  idMesaEditando: string | null = null; // String para soportar los UIDs alfanuméricos de Firebase

  // Datos semilla locales listos para persistir en la nube
  listaMesas: any[] = [
    { id: 'm_1', numero: 'Mesa 01', capacidad: 4, estado: 'disponible' },
    { id: 'm_2', numero: 'Mesa 02', capacidad: 6, estado: 'ocupada' },
    { id: 'm_3', numero: 'Mesa 03', capacidad: 2, estado: 'reservada' }
  ];

  constructor() {
    // Registro obligatorio de los iconos para componentes Standalone
    addIcons({ create, trash });
  }

  async ngOnInit() {
    await this.cargarMesasFirebase();
  }

  // Simulación de lectura de la colección 'mesas' en Firebase Firestore
  async cargarMesasFirebase() {
    // Cuando conectes Firebase: this.firestore.collection('mesas').valueChanges()...
    // Por ahora mantiene los datos semilla en memoria
  }

  // Agrega una mesa o actualiza una existente en la base de datos
  async guardarMesa() {
    if (!this.nuevaMesa.numero.trim() || !this.nuevaMesa.capacidad) return;

    if (this.editando && this.idMesaEditando !== null) {
      // Simula: db.collection('mesas').doc(id).update(...)
      const index = this.listaMesas.findIndex(m => m.id === this.idMesaEditando);
      if (index !== -1) {
        this.listaMesas[index] = {
          id: this.idMesaEditando,
          numero: this.nuevaMesa.numero.trim(),
          capacidad: Number(this.nuevaMesa.capacidad),
          estado: this.nuevaMesa.estado
        };
      }
      this.cancelarEdicion();
    } else {
      // Simula: db.collection('mesas').add(...) generando un UID aleatorio tipo Firebase
      const mockFirebaseId = 'fs_m_' + Math.random().toString(36).substr(2, 9);
      this.listaMesas.push({
        id: mockFirebaseId,
        numero: this.nuevaMesa.numero.trim(),
        capacidad: Number(this.nuevaMesa.capacidad),
        estado: this.nuevaMesa.estado
      });
    }

    this.limpiarFormulario();
  }

  // Pasa los datos de la mesa seleccionada al formulario de edición superior
  seleccionarMesa(mesa: any) {
    this.editando = true;
    this.idMesaEditando = mesa.id;
    this.nuevaMesa = {
      numero: mesa.numero,
      capacidad: mesa.capacidad,
      estado: mesa.estado
    };
  }

  // Resetea el flujo de edición
  cancelarEdicion() {
    this.editando = false;
    this.idMesaEditando = null;
    this.limpiarFormulario();
  }

  // Simula: db.collection('mesas').doc(id).delete()
  async eliminarMesa(id: string) {
    this.listaMesas = this.listaMesas.filter(m => m.id !== id);
  }

  limpiarFormulario() {
    this.nuevaMesa = {
      numero: '',
      capacidad: null,
      estado: 'disponible'
    };
  }
}