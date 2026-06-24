import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
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
  IonSearchbar,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonButtons,
  IonBackButton,
  IonMenuButton
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { 
  fastFood, create, trash, arrowBack,
  searchOutline, addOutline, closeOutline, pencilOutline, trashOutline
} from 'ionicons/icons';

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
  selector: 'app-productos',
  templateUrl: './productos.page.html',
  styleUrls: ['./productos.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
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
    IonSearchbar,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonButtons,
    IonBackButton,
    IonMenuButton
  ]
})
export class ProductosPage implements OnInit {

  private firestore = inject(Firestore);

  // --- VARIABLES DE INTERFAZ NUEVAS ---
  fechaActual: string = '';
  mostrarFormulario: boolean = false;
  
  // Variables de Filtrado superior
  filtroCategoria: string = 'Todos';
  categoriasFiltro = ['Todos', 'Pollos', 'Acompañamientos', 'Bebidas', 'Extras', 'Postres'];

  // Variables de Métricas KPI
  totalProductos: number = 0;
  totalDisponibles: number = 0;
  totalNoDisponibles: number = 0;
  totalStockBajo: number = 0;

  nuevoProducto = {
    nombre: '',
    precio: null as number | null,
    stock: null as number | null,
    categoriaId: ''
  };

  editando: boolean = false;
  idProductoEditando: string | null = null;
  textoBuscar: string = '';

  listaProductos: any[] = [];
  productosFiltrados: any[] = [];

  constructor() {
    addIcons({ 
      fastFood, create, trash, arrowBack,
      searchOutline, addOutline, closeOutline, pencilOutline, trashOutline 
    });
  }

  async ngOnInit() {
    this.configurarFecha();
    await this.cargarProductosFirebase();
  }

  configurarFecha() {
    const opciones: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    this.fechaActual = new Date().toLocaleDateString('es-PE', opciones);
  }

  // --- CONTROL DE UI Y FORMULARIO ---

  abrirFormulario() {
    this.limpiarFormulario();
    this.editando = false;
    this.mostrarFormulario = true;
  }

  cerrarFormulario() {
    this.mostrarFormulario = false;
    this.limpiarFormulario();
    this.editando = false;
    this.idProductoEditando = null;
  }

  seleccionarFiltro(cat: string) {
    this.filtroCategoria = cat;
    this.buscar();
  }

  // Mapear el ID de tu base de datos al nombre visual del prototipo
  obtenerNombreCategoria(id: string): string {
    switch(id) {
      case 'cat_pollos': return 'Pollos';
      case 'cat_chifa': return 'Acompañamientos'; 
      case 'cat_bebidas': return 'Bebidas';
      case 'cat_postres': return 'Postres';
      default: return 'Extras';
    }
  }

  // Mapear color de badge según categoría
  obtenerClaseCategoria(id: string): string {
    switch(id) {
      case 'cat_pollos': return 'cat-pollos';
      case 'cat_chifa': return 'cat-acomp';
      case 'cat_bebidas': return 'cat-bebidas';
      default: return 'cat-default';
    }
  }

  // Mapear Icono/Emoji
  obtenerIcono(id: string): string {
    switch(id) {
      case 'cat_pollos': return '🍗';
      case 'cat_chifa': return '🍟';
      case 'cat_bebidas': return '🥤';
      case 'cat_postres': return '🍰';
      default: return '📦';
    }
  }

  // Calcular las métricas superiores basándose en TODA la lista (no solo en lo filtrado)
  calcularKPIs() {
    this.totalProductos = this.listaProductos.length;
    this.totalDisponibles = this.listaProductos.filter(p => p.stock === null || p.stock > 0).length;
    this.totalNoDisponibles = this.listaProductos.filter(p => p.stock === 0).length;
    // Se considera stock bajo si es <= 10 y no es infinito
    this.totalStockBajo = this.listaProductos.filter(p => p.stock !== null && p.stock > 0 && p.stock <= 10).length;
  }


  // --- LÓGICA DE FIREBASE INTACTA ---

  async cargarProductosFirebase() {
    try {
      const snapshot = await getDocs(collection(this.firestore, 'productos'));
      this.listaProductos = [];
      snapshot.forEach(docSnap => {
        this.listaProductos.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });
      this.buscar();
    } catch (error) {
      console.error('❌ Error cargando productos:', error);
    }
  }

  async guardarProducto() {
    if (!this.nuevoProducto.nombre.trim() || !this.nuevoProducto.precio || !this.nuevoProducto.categoriaId) return;

    try {
      if (this.editando && this.idProductoEditando) {
        const ref = doc(this.firestore, 'productos', this.idProductoEditando);
        await updateDoc(ref, {
          nombre: this.nuevoProducto.nombre.trim(),
          precio: Number(this.nuevoProducto.precio),
          stock: this.nuevoProducto.stock !== null ? Number(this.nuevoProducto.stock) : null,
          categoriaId: this.nuevoProducto.categoriaId
        });

        const index = this.listaProductos.findIndex(p => p.id === this.idProductoEditando);
        if (index !== -1) {
          this.listaProductos[index] = {
            id: this.idProductoEditando,
            nombre: this.nuevoProducto.nombre.trim(),
            precio: Number(this.nuevoProducto.precio),
            stock: this.nuevoProducto.stock,
            categoriaId: this.nuevoProducto.categoriaId
          };
        }
      } else {
        const docRef = await addDoc(collection(this.firestore, 'productos'), {
          nombre: this.nuevoProducto.nombre.trim(),
          precio: Number(this.nuevoProducto.precio),
          stock: this.nuevoProducto.stock !== null ? Number(this.nuevoProducto.stock) : null,
          categoriaId: this.nuevoProducto.categoriaId
        });

        this.listaProductos.push({
          id: docRef.id,
          nombre: this.nuevoProducto.nombre.trim(),
          precio: Number(this.nuevoProducto.precio),
          stock: this.nuevoProducto.stock,
          categoriaId: this.nuevoProducto.categoriaId
        });
      }

      this.buscar();
      this.cerrarFormulario();

    } catch (error) {
      console.error('❌ Error guardando producto:', error);
    }
  }

  seleccionarProducto(producto: any) {
    this.editando = true;
    this.idProductoEditando = producto.id;
    this.nuevoProducto = {
      nombre: producto.nombre,
      precio: producto.precio,
      stock: producto.stock,
      categoriaId: producto.categoriaId
    };
    this.mostrarFormulario = true; // Abre el modal
  }

  async eliminarProducto(id: string) {
    try {
      await deleteDoc(doc(this.firestore, 'productos', id));
      this.listaProductos = this.listaProductos.filter(p => p.id !== id);
      this.buscar();
    } catch (error) {
      console.error('❌ Error eliminando producto:', error);
    }
  }

  // --- BUSCADOR CON ENFOQUE AL DISEÑO ---
  buscar() {
    const q = this.textoBuscar.toLowerCase().trim();

    this.productosFiltrados = this.listaProductos.filter(p => {
      // Filtrar por texto
      const matchText = !q || p.nombre.toLowerCase().includes(q);
      
      // Filtrar por los chips de categoría superiores
      const catVisual = this.obtenerNombreCategoria(p.categoriaId);
      const matchCat = this.filtroCategoria === 'Todos' || catVisual === this.filtroCategoria;

      return matchText && matchCat;
    });

    this.calcularKPIs();
  }

  limpiarFormulario() {
    this.nuevoProducto = {
      nombre: '',
      precio: null,
      stock: null,
      categoriaId: ''
    };
  }

}