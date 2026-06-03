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
  IonBackButton
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { create, trash, arrowBack } from 'ionicons/icons';

import {
  Firestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc
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
    IonBackButton
  ]
})
export class MesasPage implements OnInit {

  private firestore = inject(Firestore);

  // Modelo del formulario conectado con el HTML
  nuevaMesa = {
    numero: '',
    capacidad: null as number | null,
    estado: 'disponible'
  };

  // Estados de control para la edición
  editando: boolean = false;
  idMesaEditando: string | null = null;

  // Lista obtenida desde Firebase
  listaMesas: any[] = [];

  constructor() {
    addIcons({
      create,
      trash,
      arrowBack
    });
  }

  async ngOnInit() {
    await this.cargarMesasFirebase();
  }

  // Cargar mesas desde Firestore
  async cargarMesasFirebase() {

    try {

      const querySnapshot = await getDocs(
        collection(this.firestore, 'mesas')
      );

      this.listaMesas = [];

      querySnapshot.forEach((documento) => {

        this.listaMesas.push({
          id: documento.id,
          ...documento.data()
        });

      });

      console.log('✅ Mesas cargadas:', this.listaMesas);

    } catch (error) {

      console.error('❌ Error cargando mesas:', error);

    }

  }

  // Agrega una mesa o actualiza una existente
  async guardarMesa() {

    if (
      !this.nuevaMesa.numero.trim() ||
      !this.nuevaMesa.capacidad
    ) {
      return;
    }

    try {

      if (
        this.editando &&
        this.idMesaEditando !== null
      ) {

        const mesaRef = doc(
          this.firestore,
          'mesas',
          this.idMesaEditando
        );

        await updateDoc(mesaRef, {
          numero: this.nuevaMesa.numero.trim(),
          capacidad: Number(this.nuevaMesa.capacidad),
          estado: this.nuevaMesa.estado
        });

        const index =
          this.listaMesas.findIndex(
            mesa => mesa.id === this.idMesaEditando
          );

        if (index !== -1) {

          this.listaMesas[index] = {
            id: this.idMesaEditando,
            numero: this.nuevaMesa.numero.trim(),
            capacidad: Number(this.nuevaMesa.capacidad),
            estado: this.nuevaMesa.estado
          };

        }

        console.log('✅ Mesa actualizada');

        this.cancelarEdicion();

      } else {

        const docRef = await addDoc(
          collection(this.firestore, 'mesas'),
          {
            numero: this.nuevaMesa.numero.trim(),
            capacidad: Number(this.nuevaMesa.capacidad),
            estado: this.nuevaMesa.estado
          }
        );

        this.listaMesas.push({
          id: docRef.id,
          numero: this.nuevaMesa.numero.trim(),
          capacidad: Number(this.nuevaMesa.capacidad),
          estado: this.nuevaMesa.estado
        });

        console.log(
          '✅ Mesa registrada. ID:',
          docRef.id
        );

      }

      this.limpiarFormulario();

    } catch (error) {

      console.error(
        '❌ Error guardando mesa:',
        error
      );

    }

  }

  // Pasa los datos de la mesa seleccionada al formulario
  seleccionarMesa(mesa: any) {

    this.editando = true;

    this.idMesaEditando = mesa.id;

    this.nuevaMesa = {
      numero: mesa.numero,
      capacidad: mesa.capacidad,
      estado: mesa.estado
    };

  }

  // Cancela la edición
  cancelarEdicion() {

    this.editando = false;

    this.idMesaEditando = null;

    this.limpiarFormulario();

  }

  // Eliminar mesa
  async eliminarMesa(id: string) {

    try {

      await deleteDoc(
        doc(this.firestore, 'mesas', id)
      );

      this.listaMesas =
        this.listaMesas.filter(
          mesa => mesa.id !== id
        );

      console.log('✅ Mesa eliminada');

    } catch (error) {

      console.error(
        '❌ Error eliminando mesa:',
        error
      );

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