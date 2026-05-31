import { Component, OnInit } from '@angular/core';
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
  IonItemOption
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { fastFood, create, trash } from 'ionicons/icons';

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
    IonItemOption
  ]
})
export class ProductosPage implements OnInit {

  // Modelo reactivo para el formulario de la carta/inventario
  nuevoProducto = {
    nombre: '',
    precio: null as number | null,
    stock: null as number | null, // null representa platos de cocina con disponibilidad ilimitada
    categoriaId: ''
  };

  editando: boolean = false;
  idProductoEditando: string | null = null;
  textoBuscar: string = '';

  // Datos semilla locales preparados para emular Firebase Firestore
  listaProductos: any[] = [
    { id: 'prod_1', nombre: '1/4 Pollo', precio: 22.90, stock: null, categoriaId: 'cat_pollos' },
    { id: 'prod_2', nombre: '1/2 Pollo', precio: 39.90, stock: null, categoriaId: 'cat_pollos' },
    { id: 'prod_3', nombre: 'Pollo Entero', precio: 69.90, stock: null, categoriaId: 'cat_pollos' },
    { id: 'prod_4', nombre: 'Chaufa Especial', precio: 18.90, stock: null, categoriaId: 'cat_chifa' },
    { id: 'prod_5', nombre: 'Inca Kola 1L', precio: 8.50, stock: 24, categoriaId: 'cat_bebidas' }
  ];
  
  productosFiltrados: any[] = [];

  constructor() {
    // Inyección de íconos requeridos para el diseño standalone
    addIcons({ fastFood, create, trash });
  }

  async ngOnInit() {
    await this.cargarProductosFirebase();
  }

  // Simulación de escucha en tiempo real de la colección 'productos'
  async cargarProductosFirebase() {
    this.buscar();
  }

  // Inserta o actualiza un producto de forma asíncrona
  async guardarProducto() {
    if (!this.nuevoProducto.nombre.trim() || !this.nuevoProducto.precio || !this.nuevoProducto.categoriaId) return;

    if (this.editando && this.idProductoEditando !== null) {
      // Simula: db.collection('productos').doc(id).update(...)
      const index = this.listaProductos.findIndex(p => p.id === this.idProductoEditando);
      if (index !== -1) {
        this.listaProductos[index] = {
          id: this.idProductoEditando,
          nombre: this.nuevoProducto.nombre.trim(),
          precio: Number(this.nuevoProducto.precio),
          stock: this.nuevoProducto.stock !== null ? Number(this.nuevoProducto.stock) : null,
          categoriaId: this.nuevoProducto.categoriaId
        };
      }
      this.cancelarEdicion();
    } else {
      // Simula: db.collection('productos').add(...) con UID automático
      const mockFirebaseId = 'fs_prod_' + Math.random().toString(36).substr(2, 9);
      this.listaProductos.push({
        id: mockFirebaseId,
        nombre: this.nuevoProducto.nombre.trim(),
        precio: Number(this.nuevoProducto.precio),
        stock: this.nuevoProducto.stock !== null ? Number(this.nuevoProducto.stock) : null,
        categoriaId: this.nuevoProducto.categoriaId
      });
    }

    this.buscar();
    this.limpiarFormulario();
  }

  // Carga los datos del producto seleccionado en el formulario para editarlo
  seleccionarProducto(producto: any) {
    this.editando = true;
    this.idProductoEditando = producto.id;
    this.nuevoProducto = {
      nombre: producto.nombre,
      precio: producto.precio,
      stock: producto.stock,
      categoriaId: producto.categoriaId
    };
  }

  cancelarEdicion() {
    this.editando = false;
    this.idProductoEditando = null;
    this.limpiarFormulario();
  }

  // Simula: db.collection('productos').doc(id).delete()
  async eliminarProducto(id: string) {
    this.listaProductos = this.listaProductos.filter(p => p.id !== id);
    this.buscar();
  }

  // Buscador local síncrono que hereda la estructura del query
  buscar() {
    const q = this.textoBuscar.toLowerCase().trim();
    if (!q) {
      this.productosFiltrados = [...this.listaProductos];
    } else {
      this.productosFiltrados = this.listaProductos.filter(p =>
        p.nombre.toLowerCase().includes(q)
      );
    }
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