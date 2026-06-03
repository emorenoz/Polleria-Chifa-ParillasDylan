import { Component, OnInit, inject, OnDestroy } from '@angular/core';
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
  IonButtons,
  IonBackButton
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { cash, create, trash, arrowBack } from 'ionicons/icons';

import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  doc,
  updateDoc,
  deleteDoc
} from '@angular/fire/firestore';

import { Subscription } from 'rxjs';

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
    IonButtons,
    IonBackButton
  ]
})
export class VentasPage implements OnInit, OnDestroy {

  private firestore = inject(Firestore);
  private ventasSubscription?: Subscription;

  nuevaVenta = {
    cliente: '',
    total: null as number | null,
    metodoPago: ''
  };

  editando = false;
  idVentaEditando: string | null = null;

  listaVentas: any[] = [];

  constructor() {
    addIcons({ cash, create, trash, arrowBack });
  }

  ngOnInit() {
    this.cargarVentasFirebase();
  }

  // 🔥 FIREBASE REAL EN TIEMPO REAL
  cargarVentasFirebase() {

    const ventasCollection = collection(this.firestore, 'ventas');

    this.ventasSubscription = collectionData(
      ventasCollection,
      { idField: 'id' }
    ).subscribe({
      next: (ventas) => {
        this.listaVentas = ventas || [];
        console.log('📦 Ventas cargadas:', ventas);
      },
      error: (error) => {
        console.error('❌ Error Firebase ventas:', error);
      }
    });

  }

  async guardarVenta() {

    if (!this.nuevaVenta.cliente || !this.nuevaVenta.total || !this.nuevaVenta.metodoPago) {
      alert('Por favor rellena todos los campos.');
      return;
    }

    const ahora = new Date();
    const hora = ahora.getHours().toString().padStart(2, '0') + ':' +
                 ahora.getMinutes().toString().padStart(2, '0');

    try {

      if (this.editando && this.idVentaEditando) {

        const ref = doc(this.firestore, 'ventas', this.idVentaEditando);

        await updateDoc(ref, {
          cliente: this.nuevaVenta.cliente,
          total: this.nuevaVenta.total,
          metodoPago: this.nuevaVenta.metodoPago
        });

        this.cancelarEdicion();

      } else {

        await addDoc(collection(this.firestore, 'ventas'), {
          cliente: this.nuevaVenta.cliente,
          total: this.nuevaVenta.total,
          metodoPago: this.nuevaVenta.metodoPago,
          hora,
          fecha: ahora
        });

      }

      this.limpiarFormulario();

    } catch (error) {
      console.error('❌ Error Firebase ventas:', error);
    }

  }

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

  async eliminarVenta(id: string) {
    try {
      await deleteDoc(doc(this.firestore, 'ventas', id));
    } catch (error) {
      console.error('❌ Error eliminando venta:', error);
    }
  }

  limpiarFormulario() {
    this.nuevaVenta = {
      cliente: '',
      total: null,
      metodoPago: ''
    };
  }

  ngOnDestroy() {
    this.ventasSubscription?.unsubscribe();
  }
}