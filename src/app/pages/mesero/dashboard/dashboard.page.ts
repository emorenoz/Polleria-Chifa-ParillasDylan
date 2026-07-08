import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  where,
  setDoc
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
  estado: 'libre' | 'activa' | 'preparando' | 'listo' | 'entregado_mesa' | 'cuenta' | 'pagado';
  pedido: ItemCarrito[];
  fechaPedido?: any;
  fechaPedidoCocina?: any;
  fechaEntregadoMesa?: any;
  fechaCuenta?: any;
  mesero?: string;
  pedidoEnCocina?: boolean;
  pedidoListo?: boolean;
  pedidoEntregadoMesa?: boolean;
  notificacionMesero?: boolean;
}

@Component({
  selector: 'app-dashboard-mesero',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
    'Guarniciones',
    'Bebidas'
  ];

  categoriaSeleccionada: string = 'Todos';

  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];

  mesas$: Observable<Mesa[]> | undefined;
  mesas: Mesa[] = [];
  mesaSeleccionada: Mesa | null = null;

  modoPedido: 'mesas' | 'para_llevar' = 'mesas';
  clienteNombre: string = '';
  clienteTelefono: string = '';
  pedidoParaLlevar: ItemCarrito[] = [];

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
    this.mesasSubscription?.unsubscribe();
    this.productosSubscription?.unsubscribe();

    if (this.relojInterval) {
      clearInterval(this.relojInterval);
    }
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
        estado: this.normalizarEstadoMesa(m.estado),
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

    const productosCollection = collection(this.firestore, 'productos');

    const productos$ = collectionData(
      productosCollection,
      { idField: 'id' }
    ) as Observable<any[]>;

    this.productosSubscription = productos$.subscribe(res => {
      this.productos = res
        .map(item => ({
          id: item.id,
          nombre: item.nombre ?? '',
          precio: Number(item.precio ?? 0),
          categoria: item.categoria ?? 'General',
          categoriaId: this.convertirCategoriaAId(item.categoria ?? ''),
          stock: item.stock ?? null
        }))
        .filter(producto =>
          producto.nombre.trim() !== '' &&
          producto.precio > 0
        )
        .sort((a, b) => a.nombre.localeCompare(b.nombre));

      this.filtrarProductos();
    });
  }

  normalizarEstadoMesa(estado: any): Mesa['estado'] {
    const e = String(estado || 'libre').toLowerCase().trim();

    if (e === 'recogido') return 'entregado_mesa';
    if (e === 'entregado') return 'entregado_mesa';
    if (e === 'ocupada') return 'activa';
    if (e === 'pendiente_cocina') return 'activa';

    if (
      e === 'libre' ||
      e === 'activa' ||
      e === 'preparando' ||
      e === 'listo' ||
      e === 'entregado_mesa' ||
      e === 'cuenta' ||
      e === 'pagado'
    ) {
      return e;
    }

    return 'libre';
  }

  convertirCategoriaAId(categoria: string): string {
    const c = categoria.toLowerCase().trim();

    if (
      c.includes('pollo') ||
      c.includes('brasa') ||
      c.includes('mostro') ||
      c.includes('mostrito') ||
      c.includes('salchibrasa')
    ) return 'cat_pollos';

    if (
      c.includes('chifa') ||
      c.includes('sopa')
    ) return 'cat_chifa';

    if (
      c.includes('parrilla') ||
      c.includes('parrillero')
    ) return 'cat_parrillas';

    if (
      c.includes('criollo')
    ) return 'cat_criollos';

    if (
      c.includes('guarnicion') ||
      c.includes('guarniciones')
    ) return 'cat_guarniciones';

    if (
      c.includes('bebida') ||
      c.includes('fria') ||
      c.includes('fría') ||
      c.includes('caliente') ||
      c.includes('vino')
    ) return 'cat_bebidas';

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

      if (this.categoriaSeleccionada === 'Pollos') {
        return p.categoriaId === 'cat_pollos' ||
          nombreBajo.includes('pollo') ||
          nombreBajo.includes('brasa') ||
          nombreBajo.includes('mostro') ||
          nombreBajo.includes('mostrito') ||
          nombreBajo.includes('salchibrasa');
      }

      if (this.categoriaSeleccionada === 'Chifa') {
        return p.categoriaId === 'cat_chifa' ||
          categoriaBaja.includes('chifa') ||
          categoriaBaja.includes('sopa') ||
          nombreBajo.includes('chaufa') ||
          nombreBajo.includes('aeropuerto') ||
          nombreBajo.includes('tallarin') ||
          nombreBajo.includes('tallarín') ||
          nombreBajo.includes('wantan');
      }

      if (this.categoriaSeleccionada === 'Bebidas') {
        return p.categoriaId === 'cat_bebidas' ||
          categoriaBaja.includes('bebida') ||
          nombreBajo.includes('gaseosa') ||
          nombreBajo.includes('chicha') ||
          nombreBajo.includes('maracuy') ||
          nombreBajo.includes('limonada') ||
          nombreBajo.includes('agua') ||
          nombreBajo.includes('café') ||
          nombreBajo.includes('cafe') ||
          nombreBajo.includes('té') ||
          nombreBajo.includes('te') ||
          nombreBajo.includes('anís') ||
          nombreBajo.includes('anis');
      }

      if (this.categoriaSeleccionada === 'Guarniciones') {
        return p.categoriaId === 'cat_guarniciones' ||
          categoriaBaja.includes('guarnicion') ||
          categoriaBaja.includes('guarniciones') ||
          nombreBajo.includes('papas') ||
          nombreBajo.includes('ensalada') ||
          nombreBajo.includes('arroz') ||
          nombreBajo.includes('plátano') ||
          nombreBajo.includes('platano') ||
          nombreBajo.includes('huevo') ||
          nombreBajo.includes('hot dog') ||
          nombreBajo.includes('wantan');
      }

      if (this.categoriaSeleccionada === 'Parrillas') {
        return p.categoriaId === 'cat_parrillas' ||
          nombreBajo.includes('parrilla') ||
          nombreBajo.includes('anticucho') ||
          nombreBajo.includes('brocheta') ||
          nombreBajo.includes('churrasco') ||
          nombreBajo.includes('chuleta') ||
          nombreBajo.includes('bistec') ||
          nombreBajo.includes('pechuga') ||
          nombreBajo.includes('chorizo');
      }

      if (this.categoriaSeleccionada === 'Criollos') {
        return p.categoriaId === 'cat_criollos' ||
          categoriaBaja.includes('criollo') ||
          nombreBajo.includes('lomo') ||
          nombreBajo.includes('saltado') ||
          nombreBajo.includes('tallarín verde') ||
          nombreBajo.includes('tallarin verde') ||
          nombreBajo.includes('chicharrón') ||
          nombreBajo.includes('chicharron');
      }

      return true;
    });
  }

  seleccionarMesa(mesa: Mesa): void {
    this.mesaSeleccionada = {
      ...mesa,
      estado: this.normalizarEstadoMesa(mesa.estado),
      pedido: mesa.pedido ?? []
    };
  }

  async agregarProducto(producto: Producto): Promise<void> {
    if (this.modoPedido === 'para_llevar') {
      await this.agregarProductoParaLlevar(producto);
      return;
    }

    if (!this.mesaSeleccionada || this.enviandoCocina || this.pedidoEnviado) return;

    if (producto.stock !== null && producto.stock <= 0) {
      console.warn('Producto sin stock:', producto.nombre);
      return;
    }

    let estadoActualizado = this.normalizarEstadoMesa(this.mesaSeleccionada.estado);
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
      mesa.fechaEntregadoMesa ||
      mesa.fechaCuenta;

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
    if (this.modoPedido === 'para_llevar') {
      await this.enviarParaLlevarACocina();
      return;
    }

    if (this.enviandoCocina || this.pedidoEnviado) return;

    if (!this.mesaSeleccionada || this.mesaSeleccionada.pedido.length === 0) {
      return;
    }

    this.enviandoCocina = true;
    this.pedidoEnviado = false;

    const mesa = this.mesaSeleccionada;
    const total = this.calcularTotal();
    const fechaActual = new Date();
    const fechaCaja = this.obtenerFechaCaja();

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
      tipoPedido: 'mesa',
      mesa: mesa.numero,
      idMesa: mesa.id,
      mesero: this.nombreMesero,
      total,
      estado: 'pendiente_cocina',
      fecha: fechaActual,
      fechaPedido: fechaActual.toISOString(),
      fechaCaja,
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
    return this.mesas.filter(m => m.estado === 'activa' || m.estado === 'preparando').length;
  }

  get totalListas(): number {
    return this.mesas.filter(m => m.estado === 'listo').length;
  }

  get totalEntregadas(): number {
    return this.mesas.filter(m => m.estado === 'entregado_mesa').length;
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
      const refMesa = doc(this.firestore, `mesas/${mesa.id}`);

      await updateDoc(refMesa, {
        estado: 'listo',
        pedidoListo: true,
        pedidoEnCocina: false,
        pedidoEntregadoMesa: false,
        notificacionMesero: false
      });

      await this.actualizarPedidoActivoMesa(mesa.id, 'listo');

      this.mesaSeleccionada = {
        ...mesa,
        estado: 'listo',
        pedidoListo: true,
        pedidoEnCocina: false
      };

      console.log(`✅ Plato listo para entregar - Mesa ${mesa.numero}`);

    } catch (error) {
      console.error('Error al marcar plato como listo:', error);
    }
  }

  async entregarAMesa(): Promise<void> {
    if (!this.mesaSeleccionada) return;

    const mesa = this.mesaSeleccionada;

    try {
      const refMesa = doc(this.firestore, `mesas/${mesa.id}`);

      await updateDoc(refMesa, {
        estado: 'entregado_mesa',
        pedidoEntregadoMesa: true,
        pedidoListo: false,
        fechaEntregadoMesa: new Date()
      });

      await this.actualizarPedidoActivoMesa(mesa.id, 'entregado_mesa');

      this.mesaSeleccionada = {
        ...mesa,
        estado: 'entregado_mesa',
        pedidoEntregadoMesa: true,
        pedidoListo: false,
        fechaEntregadoMesa: new Date()
      };

      console.log(`🚀 Pedido entregado a mesa ${mesa.numero}`);

    } catch (error) {
      console.error('Error al entregar pedido a mesa:', error);
    }
  }

  async pedirCuenta(): Promise<void> {
    if (!this.mesaSeleccionada) return;

    const mesa = this.mesaSeleccionada;

    try {
      const refMesa = doc(this.firestore, `mesas/${mesa.id}`);

      await updateDoc(refMesa, {
        estado: 'cuenta',
        fechaCuenta: new Date()
      });

      await this.actualizarPedidoActivoMesa(mesa.id, 'cuenta');

      this.mesaSeleccionada = {
        ...mesa,
        estado: 'cuenta',
        fechaCuenta: new Date()
      };

      console.log(`🧾 Cuenta solicitada - Mesa ${mesa.numero}`);

    } catch (error) {
      console.error('Error al pedir cuenta:', error);
    }
  }

  private async actualizarPedidoActivoMesa(
    idMesa: string,
    nuevoEstado: 'pendiente_cocina' | 'preparando' | 'listo' | 'entregado_mesa' | 'cuenta' | 'pagado' | 'anulado'
  ): Promise<void> {
    const pedidosRef = collection(this.firestore, 'pedidos');

    const q = query(
      pedidosRef,
      where('idMesa', '==', idMesa),
      where('estado', 'in', [
        'pendiente_cocina',
        'preparando',
        'listo',
        'entregado_mesa',
        'cuenta'
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

  async liberarMesa(): Promise<void> {
    if (!this.mesaSeleccionada) return;

    const total = this.calcularTotal();
    const fechaCaja = this.obtenerFechaCaja();

    const registroVenta = {
      tipoPedido: 'mesa',
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
      fechaCaja,
      mesero: this.nombreMesero,
      estado: 'pagado'
    };

    await addDoc(collection(this.firestore, 'ventas'), registroVenta);

    await this.actualizarPedidoActivoMesa(this.mesaSeleccionada.id, 'pagado');

    const refMesa = doc(this.firestore, `mesas/${this.mesaSeleccionada.id}`);

    await updateDoc(refMesa, {
      estado: 'libre',
      pedido: [],
      mesero: '',
      pedidoEnCocina: false,
      pedidoListo: false,
      pedidoEntregadoMesa: false,
      notificacionMesero: false,
      fechaPedido: null,
      fechaPedidoCocina: null,
      fechaEntregadoMesa: null,
      fechaCuenta: null
    });

    this.mesaSeleccionada = null;
  }

  cambiarModoPedido(modo: 'mesas' | 'para_llevar'): void {
    this.modoPedido = modo;

    if (modo === 'mesas') {
      this.clienteNombre = '';
      this.clienteTelefono = '';
      this.pedidoParaLlevar = [];
    }

    if (modo === 'para_llevar') {
      this.mesaSeleccionada = null;
    }

    this.filtrarProductos();
  }

  async agregarProductoParaLlevar(producto: Producto): Promise<void> {
    if (this.enviandoCocina || this.pedidoEnviado) return;

    if (producto.stock !== null && producto.stock <= 0) {
      console.warn('Producto sin stock:', producto.nombre);
      return;
    }

    const pedido = [...this.pedidoParaLlevar];
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

    this.pedidoParaLlevar = pedido;
  }

  modificarCantidadParaLlevar(item: ItemCarrito, cambio: number): void {
    if (this.enviandoCocina || this.pedidoEnviado) return;

    const pedido = [...this.pedidoParaLlevar];
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

    this.pedidoParaLlevar = pedido;
  }

  calcularTotalParaLlevar(): number {
    return this.pedidoParaLlevar.reduce((total, item) => {
      return total + (Number(item.producto.precio || 0) * Number(item.cantidad || 0));
    }, 0);
  }

  obtenerFechaCaja(): string {
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');
    const day = String(hoy.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  validarClienteParaLlevar(): boolean {
    return (
      this.clienteNombre.trim().length >= 2 &&
      this.clienteTelefono.trim().length >= 6 &&
      this.pedidoParaLlevar.length > 0
    );
  }

  async enviarParaLlevarACocina(): Promise<void> {
    if (this.enviandoCocina || this.pedidoEnviado) return;

    if (!this.validarClienteParaLlevar()) {
      console.warn('Falta nombre, teléfono o productos para llevar.');
      return;
    }

    this.enviandoCocina = true;
    this.pedidoEnviado = false;

    const fechaActual = new Date();
    const fechaCaja = this.obtenerFechaCaja();
    const total = this.calcularTotalParaLlevar();

    const productosPedido = this.pedidoParaLlevar.map(i => ({
      id: i.producto.id,
      nombre: i.producto.nombre,
      producto: i.producto.nombre,
      cantidad: i.cantidad,
      precio: i.producto.precio,
      precioUnitario: i.producto.precio,
      subtotal: i.producto.precio * i.cantidad
    }));

    const clienteNombreLimpio = this.clienteNombre.trim();
    const clienteTelefonoLimpio = this.clienteTelefono.trim();

    const pedido = {
      tipoPedido: 'para_llevar',
      mesa: 'Para llevar',
      idMesa: '',
      clienteNombre: clienteNombreLimpio,
      clienteTelefono: clienteTelefonoLimpio,
      mesero: this.nombreMesero,
      total,
      estado: 'pendiente_cocina',
      fecha: fechaActual,
      fechaPedido: fechaActual.toISOString(),
      fechaCaja,
      productos: productosPedido,
      items: productosPedido,
      cajero: '',
      origen: 'mesero',
      creadoPor: this.nombreMesero
    };

    try {
      await addDoc(collection(this.firestore, 'pedidos'), pedido);

      const clienteId = clienteTelefonoLimpio.replace(/[^0-9]/g, '');

      if (clienteId) {
        await setDoc(doc(this.firestore, `clientes/${clienteId}`), {
          nombre: clienteNombreLimpio,
          telefono: clienteTelefonoLimpio,
          ultimaCompra: fechaActual.toISOString(),
          fecha: fechaActual,
          fechaRegistro: fechaActual,
          fechaCaja,
          actualizadoEn: fechaActual
        }, { merge: true });
      }

      console.log('✅ Pedido para llevar enviado a cocina:', pedido);

      this.clienteNombre = '';
      this.clienteTelefono = '';
      this.pedidoParaLlevar = [];

      this.enviandoCocina = false;
      this.pedidoEnviado = true;

      setTimeout(() => {
        this.pedidoEnviado = false;
      }, 2000);

    } catch (error) {
      console.error('❌ Error al enviar pedido para llevar:', error);

      this.enviandoCocina = false;
      this.pedidoEnviado = false;
    }
  }

  limpiarPedidoParaLlevar(): void {
    this.clienteNombre = '';
    this.clienteTelefono = '';
    this.pedidoParaLlevar = [];
  }

  salir(): void {
    this.router.navigate(['/select-role']);
  }
}