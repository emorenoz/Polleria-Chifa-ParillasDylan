import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';

// Imports de Firebase
import {
  Firestore,
  collection,
  collectionData,
  doc,
  updateDoc,
  addDoc
} from '@angular/fire/firestore';

// 🔥 IMPORTANTE: Importamos los componentes nativos de Ionic para Standalone
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon
} from '@ionic/angular/standalone';

// Interfaces de datos
export interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  imagen: string;
}

export interface ItemCarrito {
  producto: Producto;
  cantidad: number;
}

export interface Mesa {
  id: string;
  numero: string;
  estado: 'libre' | 'activa' | 'cuenta';
  pedido: ItemCarrito[];
}

@Component({
  selector: 'app-dashboard-mesero',
  standalone: true,
  // 🔥 Agregamos CommonModule y los componentes de Ionic que usará tu HTML
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButton,
    IonIcon
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
    'Bebidas Frias','Bebidas Calientes','Criollos','Caldo de Gallina',
    'Guarniciones','Chifa a la Carta','Sopas y Entradas',
    'Ofertas de la Casa','Parrillas','Ofertas Parrillas','Salchipapas'
  ];

  categoriaSeleccionada: string = 'Bebidas Frias';

  productos: Producto[] = [
    { id: 1, nombre: 'Inca Kola / Coca Cola 3L', descripcion: '', precio: 14, categoria: 'Bebidas Frias', imagen: '🥤' },
    { id: 2, nombre: 'Inca Kola / Coca Cola 1.5L', descripcion: '', precio: 10, categoria: 'Bebidas Frias', imagen: '🥤' },
    { id: 3, nombre: 'Té', descripcion: '', precio: 2, categoria: 'Bebidas Calientes', imagen: '🍵' },
    { id: 4, nombre: 'Lomo Saltado', descripcion: '', precio: 14, categoria: 'Criollos', imagen: '🍛' },
    { id: 5, nombre: 'Caldo de Gallina', descripcion: '', precio: 12, categoria: 'Caldo de Gallina', imagen: '🍲' },
    { id: 6, nombre: 'Papas Fritas', descripcion: '', precio: 7, categoria: 'Guarniciones', imagen: '🍟' },
    { id: 7, nombre: 'Mostrito', descripcion: '', precio: 12, categoria: 'Ofertas de la Casa', imagen: '🍗' },
    { id: 8, nombre: 'Salchipapa Clásica', descripcion: '', precio: 8, categoria: 'Salchipapas', imagen: '🌭' }
  ];

  productosFiltrados: Producto[] = [];
  mesas$: Observable<Mesa[]> | undefined;
  mesas: Mesa[] = [];
  mesaSeleccionada: Mesa | null = null;
  private mesasSubscription?: Subscription;

  constructor() {}

  ngOnInit(): void {
    this.filtrarProductos();
    this.initFirebaseRealtime();
    this.iniciarReloj();
  }

  ngOnDestroy(): void {
    if (this.mesasSubscription) this.mesasSubscription.unsubscribe();
    if (this.relojInterval) clearInterval(this.relojInterval);
  }

  iniciarReloj(): void {
    this.relojInterval = setInterval(() => {
      this.horaActual = new Date().toLocaleTimeString();
    }, 1000);
  }

  // ================= FIREBASE REALTIME =================
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
  }

  // ================= ENVIAR A COCINA (TIEMPO REAL NATIVO) =================
  async procesarPago(): Promise<void> {
    if (!this.mesaSeleccionada || this.mesaSeleccionada.pedido.length === 0) return;

    const mesa = this.mesaSeleccionada;
    const total = this.calcularTotal();

    const pedidoFinal = {
      mesa: mesa.numero,
      idMesa: mesa.id,
      items: mesa.pedido.map(i => ({
        producto: i.producto.nombre,
        cantidad: i.cantidad
      })),
      total: total,
      mesero: this.nombreMesero,
      estado: 'enviado_cocina',
      fecha: new Date().toISOString() // ISOString es más óptimo para persistencia en Firebase
    };

    try {
      // 1. Insertamos en la colección que la cocina escucha en tiempo real
      await addDoc(collection(this.firestore, 'pedidos_cocina'), pedidoFinal);

      // 2. Mantenemos el estado de la mesa como 'activa' en Firestore para que el flujo sea correcto
      await this.guardar({
        ...mesa,
        estado: 'activa'
      });

      // 3. Limpiamos la selección actual en la pantalla del mesero
      this.mesaSeleccionada = null;

      alert('🚀 ¡Pedido enviado a la cocina en tiempo real!');

    } catch (error) {
      console.error("Error al enviar el pedido:", error);
    }
  }

  // Alias compatible con la acción de tu botón del HTML
  async enviarACocina(): Promise<void> {
    await this.procesarPago();
  }

  // ================= MÉTODOS DE CONTROL DEL CARRITO Y MESAS =================
  get totalActivas() {
    return this.mesas.filter(m => m.estado === 'activa').length;
  }

  get totalEnCuenta() {
    return this.mesas.filter(m => m.estado === 'cuenta').length;
  }

  get totalLibres() {
    return this.mesas.filter(m => m.estado === 'libre').length;
  }

  seleccionarMesa(mesa: Mesa) {
    this.mesaSeleccionada = { ...mesa, pedido: mesa.pedido ?? [] };
  }

  seleccionarCategoria(cat: string) {
    this.categoriaSeleccionada = cat;
    this.filtrarProductos();
  }

  filtrarProductos() {
    this.productosFiltrados = this.productos.filter(
      p => p.categoria === this.categoriaSeleccionada
    );
  }

  async agregarProducto(producto: Producto) {
    if (!this.mesaSeleccionada) return;

    let estadoActualizado = this.mesaSeleccionada.estado;
    if (estadoActualizado === 'libre') estadoActualizado = 'activa';

    const pedido = [...this.mesaSeleccionada.pedido];
    const item = pedido.find(i => i.producto.id === producto.id);

    if (item) {
      item.cantidad++;
    } else {
      pedido.push({ producto, cantidad: 1 });
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
      pedido[index].cantidad += cambio;
      if (pedido[index].cantidad <= 0) {
        pedido.splice(index, 1);
      }
    }

    this.mesaSeleccionada.pedido = pedido;

    // Si el pedido se queda vacío por completo, regresamos la mesa a 'libre'
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

    // Al procesar el pago final guardamos en el histórico de ventas
    const total = this.calcularTotal();
    const registroVenta = {
      mesa: this.mesaSeleccionada.numero,
      items: this.mesaSeleccionada.pedido,
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