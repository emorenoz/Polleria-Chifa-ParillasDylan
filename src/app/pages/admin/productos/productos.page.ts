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
  IonBackButton
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { fastFood, create, trash, arrowBack } from 'ionicons/icons';

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
    IonBackButton
  ]
})
export class ProductosPage implements OnInit {

  private firestore = inject(Firestore);

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
    addIcons({ fastFood, create, trash, arrowBack });
  }

  async ngOnInit() {
    await this.cargarProductosFirebase();
  }

  // 🔥 CARGAR PRODUCTOS FIREBASE
  async cargarProductosFirebase() {

    try {

      const snapshot = await getDocs(
        collection(this.firestore, 'productos')
      );

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

  // 🔥 GUARDAR PRODUCTO (INSERT / UPDATE)
  async guardarProducto() {

    if (
      !this.nuevoProducto.nombre.trim() ||
      !this.nuevoProducto.precio ||
      !this.nuevoProducto.categoriaId
    ) return;

    try {

      if (this.editando && this.idProductoEditando) {

        const ref = doc(
          this.firestore,
          'productos',
          this.idProductoEditando
        );

        await updateDoc(ref, {
          nombre: this.nuevoProducto.nombre.trim(),
          precio: Number(this.nuevoProducto.precio),
          stock: this.nuevoProducto.stock !== null ? Number(this.nuevoProducto.stock) : null,
          categoriaId: this.nuevoProducto.categoriaId
        });

        const index = this.listaProductos.findIndex(
          p => p.id === this.idProductoEditando
        );

        if (index !== -1) {
          this.listaProductos[index] = {
            id: this.idProductoEditando,
            nombre: this.nuevoProducto.nombre.trim(),
            precio: Number(this.nuevoProducto.precio),
            stock: this.nuevoProducto.stock,
            categoriaId: this.nuevoProducto.categoriaId
          };
        }

        this.cancelarEdicion();

      } else {

        const docRef = await addDoc(
          collection(this.firestore, 'productos'),
          {
            nombre: this.nuevoProducto.nombre.trim(),
            precio: Number(this.nuevoProducto.precio),
            stock: this.nuevoProducto.stock !== null ? Number(this.nuevoProducto.stock) : null,
            categoriaId: this.nuevoProducto.categoriaId
          }
        );

        this.listaProductos.push({
          id: docRef.id,
          nombre: this.nuevoProducto.nombre.trim(),
          precio: Number(this.nuevoProducto.precio),
          stock: this.nuevoProducto.stock,
          categoriaId: this.nuevoProducto.categoriaId
        });

      }

      this.buscar();
      this.limpiarFormulario();

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
  }

  cancelarEdicion() {
    this.editando = false;
    this.idProductoEditando = null;
    this.limpiarFormulario();
  }

  // 🔥 ELIMINAR PRODUCTO FIREBASE
  async eliminarProducto(id: string) {

    try {

      await deleteDoc(
        doc(this.firestore, 'productos', id)
      );

      this.listaProductos =
        this.listaProductos.filter(p => p.id !== id);

      this.buscar();

    } catch (error) {
      console.error('❌ Error eliminando producto:', error);
    }

  }

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