import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonList, IonItem, IonInput, IonButton,
  IonSearchbar, IonItemSliding, IonItemOptions, IonItemOption, IonIcon,
  IonLabel, IonNote
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { create, trash } from 'ionicons/icons';

@Component({
  selector: 'app-categorias',
  templateUrl: './categorias.page.html',
  styleUrls: ['./categorias.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonHeader, IonTitle, IonToolbar,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonList, IonItem,
    IonInput, IonButton, IonSearchbar, IonItemSliding, IonItemOptions,
    IonItemOption, IonIcon, IonLabel, IonNote
  ]
})
export class CategoriasPage implements OnInit {

  nuevaCategoria = {
    nombre: '',
    descripcion: ''
  };

  editando: boolean = false;
  idCategoriaEditando: string | null = null; // Cambiado a string para Firebase UID
  textoBuscar: string = '';

  listaCategorias: any[] = [
    { id: 'cat_1', nombre: 'Cuadernos', descripcion: 'Cuadernos cuadriculados y rayados' },
    { id: 'cat_2', nombre: 'Archivadores', descripcion: 'Archivadores lomo ancho y mediano' }
  ];
  categoriasFiltradas: any[] = [];

  constructor() {
    addIcons({ create, trash });
  }

  async ngOnInit() {
    await this.cargarCategoriasFirebase();
  }

  async cargarCategoriasFirebase() {
    this.categoriasFiltradas = [...this.listaCategorias];
  }

  // Preparado para: db.collection('categorias').add() o .doc(id).update()
  async guardarCategoria() {
    if (!this.nuevaCategoria.nombre.trim()) return;

    if (this.editando && this.idCategoriaEditando !== null) {
      // ACTUALIZAR EN FIRESTORE
      const index = this.listaCategorias.findIndex(c => c.id === this.idCategoriaEditando);
      if (index !== -1) {
        this.listaCategorias[index].nombre = this.nuevaCategoria.nombre.trim();
        this.listaCategorias[index].descripcion = this.nuevaCategoria.descripcion.trim();
      }
      this.cancelarEdicion();
    } else {
      // CREAR EN FIRESTORE (Firebase autogenera el ID, aquí lo simulamos con un random)
      const mockFirebaseId = 'fs_' + Math.random().toString(36).substr(2, 9);
      this.listaCategorias.push({
        id: mockFirebaseId,
        nombre: this.nuevaCategoria.nombre.trim(),
        descripcion: this.nuevaCategoria.descripcion.trim()
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
      descripcion: categoria.descripcion
    };
  }

  cancelarEdicion() {
    this.editando = false;
    this.idCategoriaEditando = null;
    this.limpiarFormulario();
  }

  // Preparado para: db.collection('categorias').doc(id).delete()
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
        c.nombre.toLowerCase().includes(q) || c.descripcion.toLowerCase().includes(q)
      );
    }
  }

  limpiarFormulario() {
    this.nuevaCategoria = { nombre: '', descripcion: '' };
  }
}
