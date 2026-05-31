import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonList, IonItem, IonInput, IonButton,
  IonSearchbar, IonItemSliding, IonItemOptions, IonItemOption, IonIcon,
  IonLabel, IonNote,
  IonButtons, IonBackButton // 👈 AGREGADOS AQUÍ PARA EL BOTÓN DE RETROCESO
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { create, trash, arrowBack } from 'ionicons/icons'; // 👈 Se agregó arrowBack por si el sistema operativo lo requiere

@Component({
  selector: 'app-categorias',
  templateUrl: './categorias.page.html',
  styleUrls: ['./categorias.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonHeader, IonTitle, IonToolbar,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonList, IonItem,
    IonInput, IonButton, IonSearchbar, IonItemSliding, IonItemOptions,
    IonItemOption, IonIcon, IonLabel, IonNote,
    IonButtons, IonBackButton // 👈 AGREGADOS AQUÍ EN LOS IMPORTS
  ]
})
export class CategoriasPage implements OnInit {

  // Sincronizado con tu HTML que usa 'nombre' y 'emoji'
  nuevaCategoria = {
    nombre: '',
    emoji: ''
  };

  editando: boolean = false;
  idCategoriaEditando: string | null = null;
  textoBuscar: string = '';

  // Datos iniciales adaptados a tu ejemplo de comida del HTML
  listaCategorias: any[] = [
    { id: 'cat_1', nombre: 'Pollos a la Brasa', emoji: '🍗' },
    { id: 'cat_2', nombre: 'Bebidas', emoji: '🥤' }
  ];
  categoriasFiltradas: any[] = [];

  constructor() {
    // Registramos los íconos (incluyendo el de retroceso por si acaso)
    addIcons({ create, trash, arrowBack });
  }

  async ngOnInit() {
    await this.cargarCategoriasFirebase();
  }

  async cargarCategoriasFirebase() {
    this.categoriasFiltradas = [...this.listaCategorias];
  }

  async guardarCategoria() {
    if (!this.nuevaCategoria.nombre.trim() || !this.nuevaCategoria.emoji.trim()) return;

    if (this.editando && this.idCategoriaEditando !== null) {
      const index = this.listaCategorias.findIndex(c => c.id === this.idCategoriaEditando);
      if (index !== -1) {
        this.listaCategorias[index].nombre = this.nuevaCategoria.nombre.trim();
        this.listaCategorias[index].emoji = this.nuevaCategoria.emoji.trim();
      }
      this.cancelarEdicion();
    } else {
      const mockFirebaseId = 'fs_' + Math.random().toString(36).substring(2, 11);
      this.listaCategorias.push({
        id: mockFirebaseId,
        nombre: this.nuevaCategoria.nombre.trim(),
        emoji: this.nuevaCategoria.emoji.trim()
      });
    }

    this.buscar();
    this.limpiarFormulario();
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
    this.listaCategorias = this.listaCategorias.filter(c => c.id !== id);
    this.buscar();
  }

  buscar() {
    const q = this.textoBuscar.toLowerCase().trim();
    if (!q) {
      this.categoriasFiltradas = [...this.listaCategorias];
    } else {
      this.categoriasFiltradas = this.listaCategorias.filter(c =>
        c.nombre.toLowerCase().includes(q)
      );
    }
  }

  limpiarFormulario() {
    this.nuevaCategoria = { nombre: '', emoji: '' };
  }
}