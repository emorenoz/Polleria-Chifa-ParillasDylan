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
  IonButton,
  IonSearchbar,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonIcon,
  IonLabel,
  IonBadge,
  IonButtons,
  IonBackButton
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { create, trash, cube, arrowBack } from 'ionicons/icons';

// 🔥 FIREBASE
import {
  Firestore,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from '@angular/fire/firestore';

@Component({
  selector: 'app-stock',
  templateUrl: './stock.page.html',
  styleUrls: ['./stock.page.scss'],
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
    IonButton,
    IonSearchbar,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonIcon,
    IonLabel,
    IonBadge,
    IonButtons,
    IonBackButton
  ]
})
export class StockPage implements OnInit {

  private firestore = inject(Firestore);

  nuevoInsumo = {
    nombre: '',
    cantidad: null as number | null,
    stockMinimo: null as number | null
  };

  editando = false;
  idInsumoEditando: string | null = null;
  textoBuscar = '';

  listaInsumos: any[] = [];
  insumosFiltrados: any[] = [];

  constructor() {
    addIcons({ create, trash, cube, arrowBack });
  }

  async ngOnInit() {
    await this.cargarInventarioFirebase();
  }

  // 🔥 CARGAR DESDE FIREBASE
  async cargarInventarioFirebase() {

    try {

      const snapshot = await getDocs(
        collection(this.firestore, 'inventario')
      );

      this.listaInsumos = [];

      snapshot.forEach(docSnap => {

        const data: any = docSnap.data();

        this.listaInsumos.push({
          id: docSnap.id,
          nombre: data.nombre || '',
          cantidad: data.cantidad || 0,
          stockMinimo: data.stockMinimo || 0
        });

      });

      this.buscar();

    } catch (error) {
      console.error('Error cargando inventario:', error);
    }

  }

  // 🔥 GUARDAR (INSERT / UPDATE)
  async guardarInsumo() {

    if (
      !this.nuevoInsumo.nombre.trim() ||
      this.nuevoInsumo.cantidad === null ||
      !this.nuevoInsumo.stockMinimo
    ) return;

    try {

      // UPDATE
      if (this.editando && this.idInsumoEditando) {

        const ref = doc(this.firestore, 'inventario', this.idInsumoEditando);

        await updateDoc(ref, {
          nombre: this.nuevoInsumo.nombre.trim(),
          cantidad: Number(this.nuevoInsumo.cantidad),
          stockMinimo: Number(this.nuevoInsumo.stockMinimo)
        });

        this.cancelarEdicion();

      } else {

        // INSERT
        await addDoc(collection(this.firestore, 'inventario'), {
          nombre: this.nuevoInsumo.nombre.trim(),
          cantidad: Number(this.nuevoInsumo.cantidad),
          stockMinimo: Number(this.nuevoInsumo.stockMinimo)
        });

      }

      await this.cargarInventarioFirebase();
      this.limpiarFormulario();

    } catch (error) {
      console.error('Error guardando insumo:', error);
    }

  }

  seleccionarInsumo(insumo: any) {
    this.editando = true;
    this.idInsumoEditando = insumo.id;

    this.nuevoInsumo = {
      nombre: insumo.nombre,
      cantidad: insumo.cantidad,
      stockMinimo: insumo.stockMinimo
    };
  }

  cancelarEdicion() {
    this.editando = false;
    this.idInsumoEditando = null;
    this.limpiarFormulario();
  }

  // 🔥 DELETE FIREBASE
  async eliminarInsumo(id: string) {

    try {

      await deleteDoc(
        doc(this.firestore, 'inventario', id)
      );

      await this.cargarInventarioFirebase();

    } catch (error) {
      console.error('Error eliminando insumo:', error);
    }

  }

  buscar() {
    const q = this.textoBuscar.toLowerCase().trim();

    if (!q) {
      this.insumosFiltrados = [...this.listaInsumos];
    } else {
      this.insumosFiltrados = this.listaInsumos.filter(i =>
        i.nombre.toLowerCase().includes(q)
      );
    }
  }

  limpiarFormulario() {
    this.nuevoInsumo = {
      nombre: '',
      cantidad: null,
      stockMinimo: null
    };
  }
}