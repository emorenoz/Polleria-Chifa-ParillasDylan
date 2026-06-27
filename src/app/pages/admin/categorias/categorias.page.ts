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
  IonBackButton,
  IonMenuButton
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  create, trash, arrowBack,
  addOutline, closeOutline, pencilOutline, trashOutline, ellipsisVertical, folderOpenOutline
} from 'ionicons/icons';

import {
  Firestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  setDoc
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
    IonBackButton,
    IonMenuButton
  ]
})
export class CategoriasPage implements OnInit {

  private firestore = inject(Firestore);

  fechaActual: string = '';
  mostrarFormulario: boolean = false;

  nuevaCategoria = {
    nombre: '',
    emoji: ''
  };

  editando: boolean = false;
  idCategoriaEditando: string | null = null;
  textoBuscar: string = '';

  listaCategorias: any[] = [];
  categoriasFiltradas: any[] = [];

  categoriasCarta: any[] = [
    { id: 'sopas-chifa', nombre: 'Sopas Chifa', emoji: '🍜', cantidadProductos: 3, activo: true },
    { id: 'chifa-a-la-carta', nombre: 'Chifa a la Carta', emoji: '🥡', cantidadProductos: 33, activo: true },
    { id: 'pollo-a-la-brasa', nombre: 'Pollo a la Brasa', emoji: '🍗', cantidadProductos: 10, activo: true },
    { id: 'ofertas-familiares', nombre: 'Ofertas Familiares', emoji: '🎉', cantidadProductos: 7, activo: true },
    { id: 'mostros-brasa', nombre: 'Mostros Brasa', emoji: '🍛', cantidadProductos: 9, activo: true },
    { id: 'mas-ofertas', nombre: 'Más Ofertas', emoji: '🔥', cantidadProductos: 6, activo: true },
    { id: 'brasa-a-lo-pobre', nombre: 'Brasa a lo Pobre', emoji: '🍳', cantidadProductos: 7, activo: true },
    { id: 'parrillas', nombre: 'Parrillas', emoji: '🥩', cantidadProductos: 12, activo: true },
    { id: 'ofertas-parrilleras', nombre: 'Ofertas Parrilleras', emoji: '🍖', cantidadProductos: 7, activo: true },
    { id: 'platos-criollos', nombre: 'Platos Criollos', emoji: '🍽️', cantidadProductos: 13, activo: true },
    { id: 'guarniciones', nombre: 'Guarniciones', emoji: '🍟', cantidadProductos: 11, activo: true },
    { id: 'bebidas-frias', nombre: 'Bebidas Frías', emoji: '🥤', cantidadProductos: 17, activo: true },
    { id: 'bebidas-calientes', nombre: 'Bebidas Calientes', emoji: '☕', cantidadProductos: 4, activo: true },
    { id: 'vinos', nombre: 'Vinos', emoji: '🍷', cantidadProductos: 2, activo: true }
  ];

  constructor() {
    addIcons({
      create, trash, arrowBack,
      addOutline, closeOutline, pencilOutline, trashOutline, ellipsisVertical, folderOpenOutline
    });
  }

  async ngOnInit() {
    this.configurarFecha();
    await this.cargarCategoriasFirebase();
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

  abrirFormulario() {
    this.limpiarFormulario();
    this.editando = false;
    this.mostrarFormulario = true;
  }

  cerrarFormulario() {
    this.mostrarFormulario = false;
    this.limpiarFormulario();
    this.editando = false;
    this.idCategoriaEditando = null;
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

      if (this.listaCategorias.length === 0) {
        await this.crearCategoriasAutomaticas();
        return;
      }

      this.categoriasFiltradas = [...this.listaCategorias];

      console.log('✅ Categorías cargadas:', this.listaCategorias.length);

    } catch (error) {
      console.error('❌ Error cargando categorías:', error);
    }
  }

  async crearCategoriasAutomaticas() {
    try {
      for (const categoria of this.categoriasCarta) {
        const categoriaRef = doc(this.firestore, 'categorias', categoria.id);

        await setDoc(categoriaRef, {
          nombre: categoria.nombre,
          emoji: categoria.emoji,
          cantidadProductos: categoria.cantidadProductos,
          activo: categoria.activo
        });
      }

      this.listaCategorias = [...this.categoriasCarta];
      this.categoriasFiltradas = [...this.listaCategorias];

      console.log('✅ Categorías automáticas creadas:', this.listaCategorias.length);

    } catch (error) {
      console.error('❌ Error creando categorías automáticas:', error);
    }
  }

  async guardarCategoria() {
    if (!this.nuevaCategoria.nombre.trim() || !this.nuevaCategoria.emoji.trim()) return;

    try {
      if (this.editando && this.idCategoriaEditando !== null) {
        const categoriaRef = doc(this.firestore, 'categorias', this.idCategoriaEditando);

        await updateDoc(categoriaRef, {
          nombre: this.nuevaCategoria.nombre.trim(),
          emoji: this.nuevaCategoria.emoji.trim()
        });

        const index = this.listaCategorias.findIndex(c => c.id === this.idCategoriaEditando);

        if (index !== -1) {
          this.listaCategorias[index].nombre = this.nuevaCategoria.nombre.trim();
          this.listaCategorias[index].emoji = this.nuevaCategoria.emoji.trim();
        }

      } else {
        const docRef = await addDoc(collection(this.firestore, 'categorias'), {
          nombre: this.nuevaCategoria.nombre.trim(),
          emoji: this.nuevaCategoria.emoji.trim(),
          cantidadProductos: 0,
          activo: true
        });

        this.listaCategorias.push({
          id: docRef.id,
          nombre: this.nuevaCategoria.nombre.trim(),
          emoji: this.nuevaCategoria.emoji.trim(),
          cantidadProductos: 0,
          activo: true
        });
      }

      this.buscar();
      this.cerrarFormulario();

    } catch (error) {
      console.error('❌ Error guardando categoría:', error);
    }
  }

  seleccionarCategoria(categoria: any) {
    this.editando = true;
    this.idCategoriaEditando = categoria.id;

    this.nuevaCategoria = {
      nombre: categoria.nombre,
      emoji: categoria.emoji
    };

    this.mostrarFormulario = true;
  }

  cancelarEdicion() {
    this.editando = false;
    this.idCategoriaEditando = null;
    this.limpiarFormulario();
  }

  async eliminarCategoria(id: string) {
    try {
      await deleteDoc(doc(this.firestore, 'categorias', id));

      this.listaCategorias = this.listaCategorias.filter(categoria => categoria.id !== id);

      this.buscar();

    } catch (error) {
      console.error('❌ Error eliminando categoría:', error);
    }
  }

  buscar() {
    const q = this.textoBuscar.toLowerCase().trim();

    if (!q) {
      this.categoriasFiltradas = [...this.listaCategorias];
    } else {
      this.categoriasFiltradas = this.listaCategorias.filter(
        categoria => categoria.nombre.toLowerCase().includes(q)
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