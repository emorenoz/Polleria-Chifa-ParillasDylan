import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';

import {
  Firestore,
  collection,
  collectionData,
  doc,
  updateDoc,
  addDoc
} from '@angular/fire/firestore';

import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonButtons,
  IonMenuButton,
  IonList,
  IonItem,
  IonLabel
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  searchOutline,
  addOutline,
  closeOutline,
  pencilOutline,
  trashOutline
} from 'ionicons/icons';

export interface Producto {
  id: string;
  nombre: string;
  precio: number;
  categoriaId: string;
  categoria?: string;
  stock: number | null;
}

export interface ItemCarrito {
  producto: Producto;
  cantidad: number;
}

export interface Mesa {
  id: string;
  numero: string;
  estado: 'libre' | 'activa' | 'listo' | 'cuenta' | 'pagado';
  pedido: ItemCarrito[];
}

@Component({
  selector: 'app-dashboard-mesero',
  standalone: true,
  imports: [
    CommonModule,
    DecimalPipe,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButton,
    IonIcon,
    IonButtons,
    IonMenuButton,
    IonList,
    IonItem,
    IonLabel
  ],
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss']
})
export class DashboardPage implements OnInit, OnDestroy {

  private firestore: Firestore = inject(Firestore);
  private router: Router = inject(Router);

  nombreMesero: string = 'Carlos Ramos';
  horaActual: string = new Date().toLocaleTimeString();
  private relojInterval: any;

  categorias: string[] = [
    'Todos',
    'Pollos',
    'Chifa',
    'Parrillas',
    'Criollos',
    'Bebidas',
    'Guarniciones'
  ];

  categoriaSeleccionada: string = 'Todos';

  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];

  mesas$: Observable<Mesa[]> | undefined;
  mesas: Mesa[] = [];
  mesaSeleccionada: Mesa | null = null;

  private mesasSubscription?: Subscription;
  private productosSubscription?: Subscription;

  constructor() {
    addIcons({
      searchOutline,
      addOutline,
      closeOutline,
      pencilOutline,
      trashOutline
    });
  }

  ngOnInit(): void {
    this.initFirebaseRealtime();
    this.iniciarReloj();
  }

  ngOnDestroy(): void {
    if (this.mesasSubscription) this.mesasSubscription.unsubscribe();
    if (this.productosSubscription) this.productosSubscription.unsubscribe();
    if (this.relojInterval) clearInterval(this.relojInterval);
  }

  iniciarReloj(): void {
    this.relojInterval = setInterval(() => {
      this.horaActual = new Date().toLocaleTimeString();
    }, 1000);
  }

  initFirebaseRealtime(): void {
    const mesasCollection = collection(this.firestore, 'mesas');
    this.mesas$ = collectionData(mesasCollection, { idField: 'id' }) as Observable<Mesa[]>;

    this.mesasSubscription = this.mesas$.subscribe(res => {
      this.mesas = res;

      const id = this.mesaSeleccionada?.id;

      if (id) {
        const encontrada = this.mesas.find(m => m.id === id);

        if (encontrada) {
          this.mesaSeleccionada = {
            ...encontrada,
            pedido: encontrada.pedido ?? []
          };
        }
      }
    });

    const inventarioCollection = collection(this.firestore, 'inventario');
    const inventario$ = collectionData(inventarioCollection, { idField: 'id' }) as Observable<any[]>;

    this.productosSubscription = inventario$.subscribe(res => {
      this.productos = res.map(item => ({
        id: item.id,
        nombre: item.nombre || '',
        precio: Number(item.precio || 0),
        categoria: item.categoria || 'General',
        categoriaId: this.convertirCategoriaAId(item.categoria || ''),
        stock: item.cantidad ?? 0
      }));

      this.filtrarProductos();
    });
  }

  convertirCategoriaAId(categoria: string): string {
    const c = categoria.toLowerCase();

    if (c.includes('pollo') || c.includes('brasa')) return 'cat_pollos';
    if (c.includes('chifa') || c.includes('sopa')) return 'cat_chifa';
    if (c.includes('bebida') || c.includes('vino')) return 'cat_bebidas';
    if (c.includes('parrilla')) return 'cat_parrillas';
    if (c.includes('criollo')) return 'cat_criollos';
    if (c.includes('guarnicion') || c.includes('guarniciones')) return 'cat_guarniciones';

    return 'cat_extras';
  }

  obtenerIcono(categoriaId: string): string {
    switch (categoriaId) {
      case 'cat_pollos': return '🍗';
      case 'cat_chifa': return '🥡';
      case 'cat_bebidas': return '🥤';
      case 'cat_parrillas': return '🥩';
      case 'cat_criollos': return '🍽️';
      case 'cat_guarniciones': return '🍟';
      default: return '🍽️';
    }
  }

  obtenerNombreCategoria(categoriaId: string): string {
    switch (categoriaId) {
      case 'cat_pollos': return 'Pollos a la Brasa';
      case 'cat_chifa': return 'Chifa';
      case 'cat_bebidas': return 'Bebidas';
      case 'cat_parrillas': return 'Parrillas';
      case 'cat_criollos': return 'Criollos';
      case 'cat_guarniciones': return 'Guarniciones';
      default: return 'Especialidades / Extras';
    }
  }

  obtenerClaseCategoria(categoriaId: string): string {
    switch (categoriaId) {
      case 'cat_pollos': return 'badge-pollos';
      case 'cat_chifa': return 'badge-chifa';
      case 'cat_bebidas': return 'badge-bebidas';
      case 'cat_parrillas': return 'badge-parrillas';
      case 'cat_criollos': return 'badge-criollos';
      case 'cat_guarniciones': return 'badge-guarniciones';
      default: return 'badge-extras';
    }
  }

  seleccionarCategoria(cat: string) {
    this.categoriaSeleccionada = cat;
    this.filtrarProductos();
  }

  filtrarProductos() {
    this.productosFiltrados = this.productos.filter(p => {
      const nombreBajo = p.nombre.toLowerCase();
      const categoriaBaja = (p.categoria || '').toLowerCase();

      if (this.categoriaSeleccionada === 'Todos') return true;

      if (this.categoriaSeleccionada === 'Pollos') {
        return p.categoriaId === 'cat_pollos';
      }

      if (this.categoriaSeleccionada === 'Chifa') {
        return p.categoriaId === 'cat_chifa';
      }

      if (this.categoriaSeleccionada === 'Bebidas') {
        return p.categoriaId === 'cat_bebidas';
      }

      if (this.categoriaSeleccionada === 'Guarniciones') {
        return p.categoriaId === 'cat_guarniciones' ||
               categoriaBaja.includes('guarnicion') ||
               categoriaBaja.includes('guarniciones') ||
               nombreBajo.includes('papas') ||
               nombreBajo.includes('ensalada') ||
               nombreBajo.includes('arroz') ||
               nombreBajo.includes('wantan');
      }

      if (this.categoriaSeleccionada === 'Parrillas') {
        return p.categoriaId === 'cat_parrillas' ||
               nombreBajo.includes('parrilla') ||
               nombreBajo.includes('anticucho') ||
               nombreBajo.includes('churrasco') ||
               nombreBajo.includes('chuleta') ||
               nombreBajo.includes('bistec');
      }

      if (this.categoriaSeleccionada === 'Criollos') {
        return p.categoriaId === 'cat_criollos' ||
               categoriaBaja.includes('criollo') ||
               nombreBajo.includes('lomo') ||
               nombreBajo.includes('saltado') ||
               nombreBajo.includes('tallarín verde') ||
               nombreBajo.includes('chicharrón');
      }

      return true;
    });
  }

  async procesarPago(): Promise<void> {
    if (!this.mesaSeleccionada || this.mesaSeleccionada.pedido.length === 0) return;

    const mesa = this.mesaSeleccionada;
    const total = this.calcularTotal();

    const pedido = {
      mesa: mesa.numero,
      idMesa: mesa.id,
      mesero: this.nombreMesero,
      total: total,
      estado: 'pendiente_cocina',
      fecha: new Date(),
      productos: mesa.pedido.map(i => ({
        id: i.producto.id,
        nombre: i.producto.nombre,
        cantidad: i.cantidad,
        precio: i.producto.precio
      })),
      cajero: ''
    };

    try {
      await addDoc(collection(this.firestore, 'pedidos'), pedido);

      const refMesa = doc(this.firestore, `mesas/${mesa.id}`);
      await updateDoc(refMesa, {
        estado: 'activa',
        pedido: []
      });

      this.mesaSeleccionada = null;
      console.log('✅ Pedido enviado a cocina usando productos del inventario');

    } catch (error) {
      console.error('Error al procesar y enviar el pedido:', error);
    }
  }

  async enviarACocina(): Promise<void> {
    await this.procesarPago();
  }

  get totalActivas() {
    return this.mesas.filter(m => m.estado === 'activa').length;
  }

  get totalListas() {
    return this.mesas.filter(m => m.estado === 'listo').length;
  }

  get totalEnCuenta() {
    return this.mesas.filter(m => m.estado === 'cuenta').length;
  }

  get totalLibres() {
    return this.mesas.filter(m => m.estado === 'libre').length;
  }

  seleccionarMesa(mesa: Mesa) {
    this.mesaSeleccionada = {
      ...mesa,
      pedido: mesa.pedido ?? []
    };
  }

  async agregarProducto(producto: Producto) {
    if (!this.mesaSeleccionada) return;

    if (producto.stock !== null && producto.stock <= 0) {
      console.warn('Producto sin stock:', producto.nombre);
      return;
    }

    let estadoActualizado = this.mesaSeleccionada.estado;

    if (estadoActualizado === 'libre') {
      estadoActualizado = 'activa';
    }

    const pedido = [...this.mesaSeleccionada.pedido];
    const item = pedido.find(i => i.producto.id === producto.id);

    if (item) {
      if (producto.stock !== null && item.cantidad + 1 > producto.stock) {
        console.warn('No hay suficiente stock para:', producto.nombre);
        return;
      }

      item.cantidad++;
    } else {
      pedido.push({
        producto,
        cantidad: 1
      });
    }

    this.mesaSeleccionada = {
      ...this.mesaSeleccionada,
      estado: estadoActualizado,
      pedido
    };

    await this.guardar(this.mesaSeleccionada);
  }

  async modificarCantidad(item: ItemCarrito, cambio: number) {
    if (!this.mesaSeleccionada) return;

    const pedido = [...this.mesaSeleccionada.pedido];
    const index = pedido.findIndex(i => i.producto.id === item.producto.id);

    if (index !== -1) {
      const nuevaCantidad = pedido[index].cantidad + cambio;

      if (cambio > 0) {
        const productoActualizado = this.productos.find(
          p => p.id === item.producto.id
        );

        const stockDisponible = productoActualizado?.stock ?? item.producto.stock;

        if (stockDisponible !== null && nuevaCantidad > stockDisponible) {
          console.warn('No hay suficiente stock para:', item.producto.nombre);
          return;
        }
      }

      pedido[index].cantidad = nuevaCantidad;

      if (pedido[index].cantidad <= 0) {
        pedido.splice(index, 1);
      }
    }

    this.mesaSeleccionada.pedido = pedido;

    if (pedido.length === 0) {
      this.mesaSeleccionada.estado = 'libre';
      await this.guardar(this.mesaSeleccionada);
      this.mesaSeleccionada = null;
    } else {
      await this.guardar(this.mesaSeleccionada);
    }
  }

  calcularTotal() {
    if (!this.mesaSeleccionada) return 0;

    return this.mesaSeleccionada.pedido.reduce(
      (acc, i) => acc + i.producto.precio * i.cantidad,
      0
    );
  }

  private async guardar(mesa: Mesa) {
    const ref = doc(this.firestore, `mesas/${mesa.id}`);

    await updateDoc(ref, {
      estado: mesa.estado,
      pedido: mesa.pedido ?? []
    });
  }

  async pedirCuenta() {
    if (!this.mesaSeleccionada) return;

    this.mesaSeleccionada.estado = 'cuenta';
    await this.guardar(this.mesaSeleccionada);
  }

  async liberarMesa() {
    if (!this.mesaSeleccionada) return;

    const total = this.calcularTotal();

    const registroVenta = {
      mesa: this.mesaSeleccionada.numero,
      items: this.mesaSeleccionada.pedido.map(i => ({
        id: i.producto.id,
        producto: i.producto.nombre,
        cantidad: i.cantidad,
        precioUnitario: i.producto.precio
      })),
      total,
      fecha: new Date().toISOString(),
      mesero: this.nombreMesero
    };

    await addDoc(collection(this.firestore, 'ventas'), registroVenta);

    this.mesaSeleccionada.estado = 'libre';
    this.mesaSeleccionada.pedido = [];

    await this.guardar(this.mesaSeleccionada);

    this.mesaSeleccionada = null;
  }

  salir() {
    this.router.navigate(['/select-role']);
  }
}