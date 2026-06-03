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
  IonNote,
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
  selector: 'app-categorias',
  templateUrl: './categorias.page.html',
  styleUrls: ['./categorias.page.scss'],
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
    IonNote,
    IonButtons,
    IonBackButton
  ]
})
export class CategoriasPage implements OnInit {

  private firestore = inject(Firestore);

  nuevaCategoria = {
    nombre: '',
    emoji: ''
  };

  editando: boolean = false;
  idCategoriaEditando: string | null = null;
  textoBuscar: string = '';

  listaCategorias: any[] = [];

  categoriasFiltradas: any[] = [];

  constructor() {

    addIcons({
      create,
      trash,
      arrowBack
    });

  }

  async ngOnInit() {

    await this.cargarCategoriasFirebase();

  }

  async cargarCategoriasFirebase() {

    try {

      const querySnapshot = await getDocs(
        collection(this.firestore, 'categorias')
      );

      this.listaCategorias = [];

      querySnapshot.forEach((documento) => {

        this.listaCategorias.push({
          id: documento.id,
          ...documento.data()
        });

      });

      this.categoriasFiltradas = [
        ...this.listaCategorias
      ];

      console.log(
        '✅ Categorías cargadas:',
        this.listaCategorias.length
      );

    } catch (error) {

      console.error(
        '❌ Error cargando categorías:',
        error
      );

    }

  }

  async guardarCategoria() {

    if (
      !this.nuevaCategoria.nombre.trim() ||
      !this.nuevaCategoria.emoji.trim()
    ) return;

    try {

      if (
        this.editando &&
        this.idCategoriaEditando !== null
      ) {

        const categoriaRef = doc(
          this.firestore,
          'categorias',
          this.idCategoriaEditando
        );

        await updateDoc(categoriaRef, {
          nombre: this.nuevaCategoria.nombre.trim(),
          emoji: this.nuevaCategoria.emoji.trim()
        });

        const index =
          this.listaCategorias.findIndex(
            c => c.id === this.idCategoriaEditando
          );

        if (index !== -1) {

          this.listaCategorias[index].nombre =
            this.nuevaCategoria.nombre.trim();

          this.listaCategorias[index].emoji =
            this.nuevaCategoria.emoji.trim();

        }

        this.cancelarEdicion();

      } else {

        const docRef = await addDoc(
          collection(this.firestore, 'categorias'),
          {
            nombre: this.nuevaCategoria.nombre.trim(),
            emoji: this.nuevaCategoria.emoji.trim()
          }
        );

        this.listaCategorias.push({
          id: docRef.id,
          nombre: this.nuevaCategoria.nombre.trim(),
          emoji: this.nuevaCategoria.emoji.trim()
        });

      }

      this.buscar();

      this.limpiarFormulario();

    } catch (error) {

      console.error(
        '❌ Error guardando categoría:',
        error
      );

    }

  }

  seleccionarCategoria(categoria: any) {

    this.editando = true;

    this.idCategoriaEditando = categoria.id;

    this.nuevaCategoria = {
      nombre: categoria.nombre,
      emoji: categoria.emoji
    };

  }

  cancelarEdicion() {

    this.editando = false;

    this.idCategoriaEditando = null;

    this.limpiarFormulario();

  }

  async eliminarCategoria(id: string) {

    try {

      await deleteDoc(
        doc(this.firestore, 'categorias', id)
      );

      this.listaCategorias =
        this.listaCategorias.filter(
          categoria => categoria.id !== id
        );

      this.buscar();

    } catch (error) {

      console.error(
        '❌ Error eliminando categoría:',
        error
      );

    }

  }

  buscar() {

    const q =
      this.textoBuscar
        .toLowerCase()
        .trim();

    if (!q) {

      this.categoriasFiltradas = [
        ...this.listaCategorias
      ];

    } else {

      this.categoriasFiltradas =
        this.listaCategorias.filter(
          categoria =>
            categoria.nombre
              .toLowerCase()
              .includes(q)
        );

    }

  }

  limpiarFormulario() {

    this.nuevaCategoria = {
      nombre: '',
      emoji: ''
    };

  }

}