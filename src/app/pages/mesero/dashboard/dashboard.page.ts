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
  addDoc,
  getDocs,
  query,
  where
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
  estado: 'libre' | 'activa' | 'listo' | 'recogido' | 'cuenta' | 'pagado';
  pedido: ItemCarrito[];
  fechaPedido?: any;
  fechaPedidoCocina?: any;
  fechaRecogidoCocina?: any;
  fechaEntregadoMesa?: any;
  mesero?: string;
  pedidoEnCocina?: boolean;
  pedidoListo?: boolean;
  pedidoRecogido?: boolean;
  pedidoEntregadoMesa?: boolean;
  notificacionMesero?: boolean;
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

  enviandoCocina: boolean = false;
  pedidoEnviado: boolean = false;

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

    this.mesas$ = collectionData(
      mesasCollection,
      { idField: 'id' }
    ) as Observable<Mesa[]>;

    this.mesasSubscription = this.mesas$.subscribe(res => {
      this.mesas = res.map(m => ({
        ...m,
        pedido: m.pedido ?? []
      }));

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

    const inventario$ = collectionData(
      inventarioCollection,
      { idField: 'id' }
    ) as Observable<any[]>;

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

  seleccionarCategoria(cat: string): void {
    this.categoriaSeleccionada = cat;
    this.filtrarProductos();
  }

  filtrarProductos(): void {
    this.productosFiltrados = this.productos.filter(p => {
      const nombreBajo = p.nombre.toLowerCase();
      const categoriaBaja = (p.categoria || '').toLowerCase();

      if (this.categoriaSeleccionada === 'Todos') return true;
      if (this.categoriaSeleccionada === 'Pollos') return p.categoriaId === 'cat_pollos';
      if (this.categoriaSeleccionada === 'Chifa') return p.categoriaId === 'cat_chifa';
      if (this.categoriaSeleccionada === 'Bebidas') return p.categoriaId === 'cat_bebidas';

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

  seleccionarMesa(mesa: Mesa): void {
    this.mesaSeleccionada = {
      ...mesa,
      pedido: mesa.pedido ?? []
    };
  }

  async agregarProducto(producto: Producto): Promise<void> {
    if (!this.mesaSeleccionada || this.enviandoCocina || this.pedidoEnviado) return;

    if (producto.stock !== null && producto.stock <= 0) {
      console.warn('Producto sin stock:', producto.nombre);
      return;
    }

    let estadoActualizado = this.mesaSeleccionada.estado;
    let fechaPedido = this.mesaSeleccionada.fechaPedido ?? null;

    if (estadoActualizado === 'libre') {
      estadoActualizado = 'activa';
      fechaPedido = new Date().toISOString();
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
      pedido,
      fechaPedido
    };

    await this.guardar(this.mesaSeleccionada);
  }

  async modificarCantidad(item: ItemCarrito, cambio: number): Promise<void> {
    if (!this.mesaSeleccionada || this.enviandoCocina || this.pedidoEnviado) return;

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
      this.mesaSeleccionada.fechaPedido = null;
      await this.guardar(this.mesaSeleccionada);
      this.mesaSeleccionada = null;
    } else {
      await this.guardar(this.mesaSeleccionada);
    }
  }

  calcularTotal(): number {
    if (!this.mesaSeleccionada) return 0;
    return this.calcularTotalMesa(this.mesaSeleccionada);
  }

  calcularTotalMesa(mesa: Mesa | null): number {
    if (!mesa || !mesa.pedido) return 0;

    return mesa.pedido.reduce((total: number, item: ItemCarrito) => {
      return total + (Number(item.producto.precio || 0) * Number(item.cantidad || 0));
    }, 0);
  }

  obtenerFechaBaseMesa(mesa: Mesa): Date | null {
    const fecha: any =
      mesa.fechaPedido ||
      mesa.fechaPedidoCocina ||
      mesa.fechaRecogidoCocina ||
      mesa.fechaEntregadoMesa;

    if (!fecha) return null;

    if (fecha?.toDate) {
      return fecha.toDate();
    }

    const date = new Date(fecha);

    if (isNaN(date.getTime())) return null;

    return date;
  }

  obtenerTiempoMesa(mesa: Mesa | null): string {
    if (!mesa || mesa.estado === 'libre') return '';

    const fechaBase = this.obtenerFechaBaseMesa(mesa);

    if (!fechaBase) return 'recién';

    const ahora = new Date().getTime();
    const inicio = fechaBase.getTime();
    const minutos = Math.floor((ahora - inicio) / 60000);

    if (minutos < 1) return 'recién';
    if (minutos < 60) return `${minutos} min`;

    const horas = Math.floor(minutos / 60);
    const minRestantes = minutos % 60;

    return `${horas}h ${minRestantes}m`;
  }

  obtenerPrioridadMesa(mesa: Mesa | null): string {
    if (!mesa || mesa.estado === 'libre') return '';

    const fechaBase = this.obtenerFechaBaseMesa(mesa);

    if (!fechaBase) return 'baja';

    const ahora = new Date().getTime();
    const inicio = fechaBase.getTime();
    const minutos = Math.floor((ahora - inicio) / 60000);

    if (minutos >= 30) return 'alta';
    if (minutos >= 15) return 'media';

    return 'baja';
  }

  async procesarPago(): Promise<void> {
    if (this.enviandoCocina || this.pedidoEnviado) return;

    if (!this.mesaSeleccionada || this.mesaSeleccionada.pedido.length === 0) {
      return;
    }

    this.enviandoCocina = true;
    this.pedidoEnviado = false;

    const mesa = this.mesaSeleccionada;
    const total = this.calcularTotal();
    const fechaActual = new Date();

    const productosPedido = mesa.pedido.map(i => ({
      id: i.producto.id,
      nombre: i.producto.nombre,
      producto: i.producto.nombre,
      cantidad: i.cantidad,
      precio: i.producto.precio,
      precioUnitario: i.producto.precio,
      subtotal: i.producto.precio * i.cantidad
    }));

    const pedido = {
      mesa: mesa.numero,
      idMesa: mesa.id,
      mesero: this.nombreMesero,
      total,
      estado: 'pendiente_cocina',
      fecha: fechaActual,
      fechaPedido: fechaActual.toISOString(),
      productos: productosPedido,
      items: productosPedido,
      cajero: '',
      origen: 'mesero',
      creadoPor: this.nombreMesero
    };

    try {
      await addDoc(collection(this.firestore, 'pedidos'), pedido);

      const refMesa = doc(this.firestore, `mesas/${mesa.id}`);

      await updateDoc(refMesa, {
        estado: 'activa',
        pedido: mesa.pedido,
        mesero: this.nombreMesero,
        pedidoEnCocina: true,
        pedidoListo: false,
        pedidoRecogido: false,
        pedidoEntregadoMesa: false,
        notificacionMesero: false,
        fechaPedido: mesa.fechaPedido ?? fechaActual.toISOString(),
        fechaPedidoCocina: fechaActual
      });

      this.mesaSeleccionada = {
        ...mesa,
        estado: 'activa',
        fechaPedido: mesa.fechaPedido ?? fechaActual.toISOString(),
        fechaPedidoCocina: fechaActual
      };

      console.log('✅ Pedido enviado a cocina:', pedido);

      this.enviandoCocina = false;
      this.pedidoEnviado = true;

      setTimeout(() => {
        this.pedidoEnviado = false;
      }, 2000);

    } catch (error) {
      console.error('❌ Error al enviar el pedido a cocina:', error);

      this.enviandoCocina = false;
      this.pedidoEnviado = false;
    }
  }

  async enviarACocina(): Promise<void> {
    await this.procesarPago();
  }

  get totalActivas(): number {
    return this.mesas.filter(m => m.estado === 'activa').length;
  }

  get totalListas(): number {
    return this.mesas.filter(m => m.estado === 'listo').length;
  }

  get totalEnCuenta(): number {
    return this.mesas.filter(m => m.estado === 'cuenta').length;
  }

  get totalLibres(): number {
    return this.mesas.filter(m => m.estado === 'libre').length;
  }

  get totalVentasMesero(): number {
    return this.mesas.reduce((total, mesa) => {
      if (mesa.mesero === this.nombreMesero && mesa.pedido?.length > 0) {
        return total + this.calcularTotalMesa(mesa);
      }

      return total;
    }, 0);
  }

  private async guardar(mesa: Mesa): Promise<void> {
    const ref = doc(this.firestore, `mesas/${mesa.id}`);

    await updateDoc(ref, {
      estado: mesa.estado,
      pedido: mesa.pedido ?? [],
      fechaPedido: mesa.fechaPedido ?? null,
      mesero: mesa.estado === 'libre' ? '' : this.nombreMesero
    });
  }

  async recibirPlato(): Promise<void> {
    if (!this.mesaSeleccionada) return;

    const mesa = this.mesaSeleccionada;

    try {
      mesa.estado = 'recogido';

      const refMesa = doc(this.firestore, `mesas/${mesa.id}`);

      await updateDoc(refMesa, {
        estado: 'recogido',
        pedidoRecogido: true,
        pedidoListo: false,
        notificacionMesero: false,
        fechaRecogidoCocina: new Date()
      });

      await this.actualizarPedidoActivoMesa(mesa.id, 'recogido');

      this.mesaSeleccionada = {
        ...mesa,
        estado: 'recogido'
      };

      console.log(`✅ Plato recibido de cocina - Mesa ${mesa.numero}`);

    } catch (error) {
      console.error('Error al recibir plato:', error);
    }
  }

  async entregarAMesa(): Promise<void> {
    if (!this.mesaSeleccionada) return;

    const mesa = this.mesaSeleccionada;

    try {
      mesa.estado = 'cuenta';

      const refMesa = doc(this.firestore, `mesas/${mesa.id}`);

      await updateDoc(refMesa, {
        estado: 'cuenta',
        pedidoEntregadoMesa: true,
        pedidoRecogido: false,
        fechaEntregadoMesa: new Date()
      });

      await this.actualizarPedidoActivoMesa(mesa.id, 'cuenta');

      this.mesaSeleccionada = {
        ...mesa,
        estado: 'cuenta'
      };

      console.log(`🚀 Pedido entregado a mesa ${mesa.numero}`);

    } catch (error) {
      console.error('Error al entregar pedido a mesa:', error);
    }
  }

  private async actualizarPedidoActivoMesa(idMesa: string, nuevoEstado: string): Promise<void> {
    const pedidosRef = collection(this.firestore, 'pedidos');

    const q = query(
      pedidosRef,
      where('idMesa', '==', idMesa),
      where('estado', 'in', [
        'pendiente_cocina',
        'preparando',
        'listo',
        'recogido',
        'cuenta',
        'entregado_mesa'
      ])
    );

    const snapshot = await getDocs(q);

    for (const pedidoDoc of snapshot.docs) {
      const refPedido = doc(this.firestore, 'pedidos', pedidoDoc.id);

      await updateDoc(refPedido, {
        estado: nuevoEstado,
        fechaActualizacion: new Date()
      });
    }
  }

  async pedirCuenta(): Promise<void> {
    await this.entregarAMesa();
  }

  async liberarMesa(): Promise<void> {
    if (!this.mesaSeleccionada) return;

    const total = this.calcularTotal();

    const registroVenta = {
      mesa: this.mesaSeleccionada.numero,
      idMesa: this.mesaSeleccionada.id,
      items: this.mesaSeleccionada.pedido.map(i => ({
        id: i.producto.id,
        producto: i.producto.nombre,
        nombre: i.producto.nombre,
        cantidad: i.cantidad,
        precio: i.producto.precio,
        precioUnitario: i.producto.precio,
        subtotal: i.producto.precio * i.cantidad
      })),
      productos: this.mesaSeleccionada.pedido.map(i => ({
        id: i.producto.id,
        producto: i.producto.nombre,
        nombre: i.producto.nombre,
        cantidad: i.cantidad,
        precio: i.producto.precio,
        precioUnitario: i.producto.precio,
        subtotal: i.producto.precio * i.cantidad
      })),
      total,
      metodoPago: 'Efectivo',
      fecha: new Date().toISOString(),
      mesero: this.nombreMesero,
      estado: 'pagado'
    };

    await addDoc(collection(this.firestore, 'ventas'), registroVenta);

    const refMesa = doc(this.firestore, `mesas/${this.mesaSeleccionada.id}`);

    await updateDoc(refMesa, {
      estado: 'libre',
      pedido: [],
      mesero: '',
      pedidoEnCocina: false,
      pedidoListo: false,
      pedidoRecogido: false,
      pedidoEntregadoMesa: false,
      notificacionMesero: false,
      fechaPedido: null,
      fechaPedidoCocina: null,
      fechaRecogidoCocina: null,
      fechaEntregadoMesa: null
    });

    this.mesaSeleccionada = null;
  }

  salir(): void {
    this.router.navigate(['/select-role']);
  }
}