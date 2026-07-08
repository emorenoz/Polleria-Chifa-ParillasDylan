import { Component, OnInit, OnDestroy, inject } from '@angular/core';
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
  IonBadge,
  IonButtons,
  IonBackButton,
  IonMenuButton
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  create,
  trash,
  cube,
  arrowBack,
  warningOutline,
  searchOutline,
  alertCircleOutline,
  addOutline,
  syncOutline,
  closeOutline,
  pencilOutline,
  trashOutline
} from 'ionicons/icons';

import {
  Firestore,
  collection,
  collectionData,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  setDoc
} from '@angular/fire/firestore';

import { Subscription } from 'rxjs';

import * as XLSX from 'xlsx-js-style';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-stock',
  templateUrl: './stock.page.html',
  styleUrls: ['./stock.page.scss'],
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
    IonBadge,
    IonButtons,
    IonBackButton,
    IonMenuButton
  ]
})
export class StockPage implements OnInit, OnDestroy {

  private firestore = inject(Firestore);
  private inventarioSub?: Subscription;

  readonly usuarioActual = 'admin';

  fechaActual = '';
  mostrarFormulario = false;
  soloAlertas = false;

  totalInsumos = 0;
  totalOk = 0;
  totalBajo = 0;
  totalCritico = 0;
  valorInventario = 0;
  productosSinStock = 0;
  productosValorizados = 0;

  nuevoInsumo = {
    nombre: '',
    categoria: '',
    cantidad: null as number | null,
    stockMinimo: null as number | null,
    stockMaximo: null as number | null,
    unidad: '',
    precio: null as number | null
  };

  editando = false;
  idInsumoEditando: string | null = null;
  textoBuscar = '';

  listaInsumos: any[] = [];
  insumosFiltrados: any[] = [];

  inventarioCarta: any[] = [
    { id: 'pollo-entero', nombre: 'Pollo entero', categoria: 'Carnes y Pollo', cantidad: 80, stockMinimo: 10, stockMaximo: 200, unidad: 'und', precio: 18 },
    { id: 'pechuga-de-pollo', nombre: 'Pechuga de pollo', categoria: 'Carnes y Pollo', cantidad: 40, stockMinimo: 8, stockMaximo: 100, unidad: 'kg', precio: 16 },
    { id: 'pierna-de-pollo', nombre: 'Pierna de pollo', categoria: 'Carnes y Pollo', cantidad: 40, stockMinimo: 8, stockMaximo: 100, unidad: 'kg', precio: 14 },
    { id: 'pollo-trozos', nombre: 'Pollo en trozos', categoria: 'Carnes y Pollo', cantidad: 35, stockMinimo: 8, stockMaximo: 100, unidad: 'kg', precio: 14 },
    { id: 'carne-res', nombre: 'Carne de res', categoria: 'Carnes y Pollo', cantidad: 35, stockMinimo: 6, stockMaximo: 80, unidad: 'kg', precio: 22 },
    { id: 'carne-lomo', nombre: 'Carne para lomo saltado', categoria: 'Carnes y Pollo', cantidad: 30, stockMinimo: 6, stockMaximo: 80, unidad: 'kg', precio: 24 },
    { id: 'carne-chancho', nombre: 'Carne de chancho', categoria: 'Carnes y Pollo', cantidad: 30, stockMinimo: 6, stockMaximo: 80, unidad: 'kg', precio: 18 },
    { id: 'chuleta-cerdo', nombre: 'Chuleta de cerdo', categoria: 'Carnes y Pollo', cantidad: 35, stockMinimo: 6, stockMaximo: 80, unidad: 'kg', precio: 18 },
    { id: 'bistec-res', nombre: 'Bistec de res', categoria: 'Carnes y Pollo', cantidad: 30, stockMinimo: 6, stockMaximo: 80, unidad: 'kg', precio: 22 },
    { id: 'langostinos', nombre: 'Langostinos', categoria: 'Carnes y Pollo', cantidad: 20, stockMinimo: 4, stockMaximo: 50, unidad: 'kg', precio: 35 },
    { id: 'anticucho-palito', nombre: 'Anticucho', categoria: 'Carnes y Pollo', cantidad: 100, stockMinimo: 20, stockMaximo: 250, unidad: 'und', precio: 3 },
    { id: 'mollejitas', nombre: 'Mollejitas', categoria: 'Carnes y Pollo', cantidad: 25, stockMinimo: 5, stockMaximo: 60, unidad: 'kg', precio: 12 },
    { id: 'chorizo', nombre: 'Chorizo', categoria: 'Carnes y Pollo', cantidad: 100, stockMinimo: 20, stockMaximo: 250, unidad: 'und', precio: 3 },
    { id: 'hot-dog', nombre: 'Hot Dog', categoria: 'Carnes y Pollo', cantidad: 120, stockMinimo: 25, stockMaximo: 300, unidad: 'und', precio: 1.2 },
    { id: 'brocheta-pollo', nombre: 'Brocheta de pollo', categoria: 'Carnes y Pollo', cantidad: 80, stockMinimo: 15, stockMaximo: 200, unidad: 'und', precio: 5 },

    { id: 'papa-amarilla', nombre: 'Papa para fritura', categoria: 'Guarniciones', cantidad: 150, stockMinimo: 25, stockMaximo: 300, unidad: 'kg', precio: 3 },
    { id: 'arroz', nombre: 'Arroz', categoria: 'Chifa y Arroz', cantidad: 120, stockMinimo: 20, stockMaximo: 300, unidad: 'kg', precio: 4 },
    { id: 'fideo-tallarin', nombre: 'Fideo tallarín', categoria: 'Chifa y Arroz', cantidad: 50, stockMinimo: 10, stockMaximo: 120, unidad: 'kg', precio: 5 },
    { id: 'wantan', nombre: 'Masa wantán', categoria: 'Chifa y Arroz', cantidad: 40, stockMinimo: 8, stockMaximo: 100, unidad: 'paq', precio: 8 },
    { id: 'frijol-chino', nombre: 'Frijol chino', categoria: 'Chifa y Arroz', cantidad: 25, stockMinimo: 5, stockMaximo: 80, unidad: 'kg', precio: 6 },
    { id: 'kion', nombre: 'Kion', categoria: 'Chifa y Arroz', cantidad: 10, stockMinimo: 2, stockMaximo: 30, unidad: 'kg', precio: 8 },
    { id: 'sillao', nombre: 'Sillao', categoria: 'Condimentos y Salsas', cantidad: 25, stockMinimo: 5, stockMaximo: 60, unidad: 'lt', precio: 6 },
    { id: 'salsa-ostion', nombre: 'Salsa de ostión', categoria: 'Condimentos y Salsas', cantidad: 15, stockMinimo: 3, stockMaximo: 40, unidad: 'lt', precio: 10 },
    { id: 'aceite-ajonjoli', nombre: 'Aceite de ajonjolí', categoria: 'Condimentos y Salsas', cantidad: 10, stockMinimo: 2, stockMaximo: 25, unidad: 'lt', precio: 18 },

    { id: 'lechuga', nombre: 'Lechuga', categoria: 'Verduras y Ensaladas', cantidad: 60, stockMinimo: 10, stockMaximo: 150, unidad: 'und', precio: 2 },
    { id: 'tomate', nombre: 'Tomate', categoria: 'Verduras y Ensaladas', cantidad: 40, stockMinimo: 8, stockMaximo: 100, unidad: 'kg', precio: 3 },
    { id: 'pepino', nombre: 'Pepino', categoria: 'Verduras y Ensaladas', cantidad: 25, stockMinimo: 5, stockMaximo: 80, unidad: 'kg', precio: 3 },
    { id: 'zanahoria', nombre: 'Zanahoria', categoria: 'Verduras y Ensaladas', cantidad: 35, stockMinimo: 6, stockMaximo: 90, unidad: 'kg', precio: 3 },
    { id: 'cebolla', nombre: 'Cebolla', categoria: 'Verduras y Ensaladas', cantidad: 40, stockMinimo: 8, stockMaximo: 100, unidad: 'kg', precio: 3 },
    { id: 'cebolla-china', nombre: 'Cebolla china', categoria: 'Verduras y Ensaladas', cantidad: 20, stockMinimo: 4, stockMaximo: 60, unidad: 'kg', precio: 5 },
    { id: 'pimiento', nombre: 'Pimiento', categoria: 'Verduras y Ensaladas', cantidad: 20, stockMinimo: 4, stockMaximo: 60, unidad: 'kg', precio: 6 },
    { id: 'limon', nombre: 'Limón', categoria: 'Verduras y Ensaladas', cantidad: 40, stockMinimo: 8, stockMaximo: 120, unidad: 'kg', precio: 4 },
    { id: 'platano', nombre: 'Plátano para freír', categoria: 'Guarniciones', cantidad: 80, stockMinimo: 15, stockMaximo: 180, unidad: 'und', precio: 1 },
    { id: 'huevo', nombre: 'Huevo', categoria: 'Guarniciones', cantidad: 180, stockMinimo: 30, stockMaximo: 400, unidad: 'und', precio: 0.7 },

    { id: 'aceite', nombre: 'Aceite vegetal', categoria: 'Condimentos y Salsas', cantidad: 80, stockMinimo: 15, stockMaximo: 180, unidad: 'lt', precio: 8 },
    { id: 'sal', nombre: 'Sal', categoria: 'Condimentos y Salsas', cantidad: 25, stockMinimo: 5, stockMaximo: 60, unidad: 'kg', precio: 2 },
    { id: 'pimienta', nombre: 'Pimienta', categoria: 'Condimentos y Salsas', cantidad: 8, stockMinimo: 2, stockMaximo: 20, unidad: 'kg', precio: 20 },
    { id: 'comino', nombre: 'Comino', categoria: 'Condimentos y Salsas', cantidad: 8, stockMinimo: 2, stockMaximo: 20, unidad: 'kg', precio: 18 },
    { id: 'aji-panca', nombre: 'Ají panca', categoria: 'Condimentos y Salsas', cantidad: 15, stockMinimo: 3, stockMaximo: 40, unidad: 'kg', precio: 10 },
    { id: 'aji-amarillo', nombre: 'Ají amarillo', categoria: 'Condimentos y Salsas', cantidad: 15, stockMinimo: 3, stockMaximo: 40, unidad: 'kg', precio: 10 },
    { id: 'mayonesa', nombre: 'Mayonesa / crema', categoria: 'Condimentos y Salsas', cantidad: 30, stockMinimo: 6, stockMaximo: 80, unidad: 'kg', precio: 9 },
    { id: 'ketchup', nombre: 'Ketchup', categoria: 'Condimentos y Salsas', cantidad: 20, stockMinimo: 4, stockMaximo: 60, unidad: 'kg', precio: 8 },
    { id: 'mostaza', nombre: 'Mostaza', categoria: 'Condimentos y Salsas', cantidad: 15, stockMinimo: 3, stockMaximo: 40, unidad: 'kg', precio: 8 },

    { id: 'chicha-morada', nombre: 'Chicha morada preparada', categoria: 'Bebidas', cantidad: 60, stockMinimo: 10, stockMaximo: 150, unidad: 'lt', precio: 2 },
    { id: 'maracuya', nombre: 'Maracuyá preparado', categoria: 'Bebidas', cantidad: 60, stockMinimo: 10, stockMaximo: 150, unidad: 'lt', precio: 2 },
    { id: 'limonada-frozen', nombre: 'Limonada frozen preparada', categoria: 'Bebidas', cantidad: 50, stockMinimo: 10, stockMaximo: 120, unidad: 'lt', precio: 2 },
    { id: 'gaseosa-3l', nombre: 'Gaseosa 3 L', categoria: 'Bebidas', cantidad: 30, stockMinimo: 6, stockMaximo: 80, unidad: 'und', precio: 8 },
    { id: 'gaseosa-1-5l', nombre: 'Gaseosa 1.5 L', categoria: 'Bebidas', cantidad: 40, stockMinimo: 8, stockMaximo: 100, unidad: 'und', precio: 6 },
    { id: 'gaseosa-1l', nombre: 'Gaseosa 1 L', categoria: 'Bebidas', cantidad: 40, stockMinimo: 8, stockMaximo: 100, unidad: 'und', precio: 4 },
    { id: 'gaseosa-personal', nombre: 'Gaseosa personal', categoria: 'Bebidas', cantidad: 80, stockMinimo: 15, stockMaximo: 200, unidad: 'und', precio: 2 },
    { id: 'agua-mineral', nombre: 'Agua mineral', categoria: 'Bebidas', cantidad: 80, stockMinimo: 15, stockMaximo: 200, unidad: 'und', precio: 1.5 },
    { id: 'te', nombre: 'Té', categoria: 'Bebidas', cantidad: 50, stockMinimo: 10, stockMaximo: 120, unidad: 'und', precio: 0.5 },
    { id: 'manzanilla', nombre: 'Manzanilla', categoria: 'Bebidas', cantidad: 50, stockMinimo: 10, stockMaximo: 120, unidad: 'und', precio: 0.5 },
    { id: 'anis', nombre: 'Anís', categoria: 'Bebidas', cantidad: 50, stockMinimo: 10, stockMaximo: 120, unidad: 'und', precio: 0.5 },
    { id: 'cafe', nombre: 'Café', categoria: 'Bebidas', cantidad: 30, stockMinimo: 6, stockMaximo: 80, unidad: 'kg', precio: 25 },
    { id: 'vino-queirolo', nombre: 'Vino Santiago Queirolo', categoria: 'Bebidas', cantidad: 10, stockMinimo: 2, stockMaximo: 30, unidad: 'bot', precio: 25 },
    { id: 'vino-tabernero', nombre: 'Vino Tabernero', categoria: 'Bebidas', cantidad: 10, stockMinimo: 2, stockMaximo: 30, unidad: 'bot', precio: 25 },

    { id: 'envases-tecnopor', nombre: 'Envases para llevar', categoria: 'Descartables', cantidad: 300, stockMinimo: 50, stockMaximo: 800, unidad: 'und', precio: 0.4 },
    { id: 'bolsas', nombre: 'Bolsas', categoria: 'Descartables', cantidad: 500, stockMinimo: 100, stockMaximo: 1000, unidad: 'und', precio: 0.1 },
    { id: 'cubiertos-descartables', nombre: 'Cubiertos descartables', categoria: 'Descartables', cantidad: 300, stockMinimo: 50, stockMaximo: 800, unidad: 'und', precio: 0.15 },
    { id: 'vasos-descartables', nombre: 'Vasos descartables', categoria: 'Descartables', cantidad: 300, stockMinimo: 50, stockMaximo: 800, unidad: 'und', precio: 0.12 },
    { id: 'servilletas', nombre: 'Servilletas', categoria: 'Descartables', cantidad: 500, stockMinimo: 100, stockMaximo: 1200, unidad: 'und', precio: 0.05 }
  ];

  constructor() {
    addIcons({
      create,
      trash,
      cube,
      arrowBack,
      warningOutline,
      searchOutline,
      alertCircleOutline,
      addOutline,
      syncOutline,
      closeOutline,
      pencilOutline,
      trashOutline
    });
  }

  async ngOnInit() {
    this.configurarFecha();
    await this.verificarInventarioInicial();
    this.cargarInventarioFirebase();
  }

  ngOnDestroy() {
    this.inventarioSub?.unsubscribe();
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

  async verificarInventarioInicial() {
    try {
      const snapshot = await getDocs(collection(this.firestore, 'inventario'));

      if (snapshot.empty || snapshot.size < this.inventarioCarta.length) {
        await this.crearInventarioAutomatico();
      }
    } catch (error) {
      console.error('Error verificando inventario inicial:', error);
    }
  }

  cargarInventarioFirebase() {
    const inventarioRef = collection(this.firestore, 'inventario');

    this.inventarioSub = collectionData(inventarioRef, { idField: 'id' }).subscribe({
      next: (data: any[]) => {
        this.listaInsumos = (data || [])
          .filter(i => i.activo !== false)
          .map(i => ({
            id: i.id,
            nombre: i.nombre || '',
            categoria: i.categoria || '',
            cantidad: Number(i.cantidad) || 0,
            stockMinimo: Number(i.stockMinimo) || 0,
            stockMaximo: Number(i.stockMaximo) || 0,
            unidad: i.unidad || '',
            precio: Number(i.precio) || 0,
            activo: i.activo !== false,
            fechaCreacion: i.fechaCreacion || null,
            fechaActualizacion: i.fechaActualizacion || null
          }))
          .sort((a, b) => String(a.nombre || '').localeCompare(String(b.nombre || '')));

        this.calcularKPIs();
        this.buscar();
      },
      error: (error) => {
        console.error('Error cargando inventario:', error);
      }
    });
  }

  async crearInventarioAutomatico() {
    try {
      const promesas = this.inventarioCarta.map(insumo => {
        const ref = doc(this.firestore, 'inventario', insumo.id);

        return setDoc(ref, {
          ...insumo,
          activo: true,
          fechaCreacion: new Date(),
          fechaActualizacion: new Date()
        }, { merge: true });
      });

      await Promise.all(promesas);

      console.log('✅ Inventario inicial sincronizado correctamente.');

    } catch (error) {
      console.error('Error creando inventario automático:', error);
    }
  }

  async actualizarInventario() {
    await this.crearInventarioAutomatico();
    this.calcularKPIs();
    this.buscar();
  }

  abrirFormulario() {
    this.limpiarFormulario();
    this.editando = false;
    this.idInsumoEditando = null;
    this.mostrarFormulario = true;
  }

  cerrarFormulario() {
    this.mostrarFormulario = false;
    this.limpiarFormulario();
    this.editando = false;
    this.idInsumoEditando = null;
  }

  toggleAlertas() {
    this.soloAlertas = !this.soloAlertas;
    this.buscar();
  }

  obtenerEmoji(cat: string): string {
    if (!cat) return '📦';

    const c = cat.toLowerCase();

    if (c.includes('carne') || c.includes('pollo')) return '🍗';
    if (c.includes('verdura') || c.includes('ensalada')) return '🥬';
    if (c.includes('bebida') || c.includes('gaseosa') || c.includes('vino')) return '🥤';
    if (c.includes('chifa') || c.includes('arroz')) return '🥡';
    if (c.includes('condimento') || c.includes('salsa')) return '🧂';
    if (c.includes('descartable')) return '🥡';
    if (c.includes('guarnicion') || c.includes('guarniciones')) return '🍟';

    return '📦';
  }

  obtenerColorEstado(insumo: any, esFondo: boolean = false): string {
    const cantidad = Number(insumo.cantidad) || 0;
    const stockMinimo = Number(insumo.stockMinimo) || 0;

    if (cantidad <= 0) return esFondo ? 'bg-red' : 'text-red';
    if (cantidad <= stockMinimo) return esFondo ? 'bg-yellow' : 'text-yellow';

    return esFondo ? 'bg-green' : 'text-green';
  }

  obtenerTextoEstado(insumo: any): string {
    const cantidad = Number(insumo.cantidad) || 0;
    const stockMinimo = Number(insumo.stockMinimo) || 0;

    if (cantidad <= 0) return 'Crítico';
    if (cantidad <= stockMinimo) return 'Bajo stock';

    return 'OK';
  }

  calcularPorcentaje(insumo: any): number {
    const cantidad = Number(insumo.cantidad) || 0;
    const stockMinimo = Number(insumo.stockMinimo) || 0;
    const stockMaximo = Number(insumo.stockMaximo) || 0;

    if (cantidad <= 0) return 0;

    if (stockMaximo > 0) {
      const porcentaje = (cantidad / stockMaximo) * 100;
      return Math.min(100, Math.max(0, porcentaje));
    }

    if (stockMinimo <= 0) return 100;

    if (cantidad >= stockMinimo * 2) return 100;

    const porcentaje = (cantidad / (stockMinimo * 2)) * 100;
    return Math.min(100, Math.max(0, porcentaje));
  }

  calcularKPIs() {
    this.totalInsumos = this.listaInsumos.length;

    this.totalCritico = this.listaInsumos.filter(i => Number(i.cantidad) <= 0).length;

    this.totalBajo = this.listaInsumos.filter(
      i => Number(i.cantidad) > 0 && Number(i.cantidad) <= Number(i.stockMinimo)
    ).length;

    this.totalOk = this.listaInsumos.filter(
      i => Number(i.cantidad) > Number(i.stockMinimo)
    ).length;

    this.valorInventario = this.listaInsumos.reduce(
      (acc, i) => acc + ((Number(i.cantidad) || 0) * (Number(i.precio) || 0)),
      0
    );

    this.productosSinStock = this.listaInsumos.filter(i => Number(i.cantidad) <= 0).length;
    this.productosValorizados = this.listaInsumos.filter(i => Number(i.precio) > 0).length;
  }

  async guardarInsumo() {
    const nombre = this.nuevoInsumo.nombre.trim();
    const cantidad = Number(this.nuevoInsumo.cantidad);
    const stockMinimo = Number(this.nuevoInsumo.stockMinimo);
    const stockMaximo = Number(this.nuevoInsumo.stockMaximo || 0);
    const precio = Number(this.nuevoInsumo.precio || 0);

    if (!nombre || this.nuevoInsumo.cantidad === null || this.nuevoInsumo.stockMinimo === null) {
      alert('Completa nombre, cantidad y stock mínimo.');
      return;
    }

    if (cantidad < 0 || stockMinimo < 0 || stockMaximo < 0 || precio < 0) {
      alert('Los valores numéricos no pueden ser negativos.');
      return;
    }

    try {
      const dataToSave = {
        nombre,
        categoria: this.nuevoInsumo.categoria || '',
        cantidad,
        stockMinimo,
        stockMaximo,
        unidad: this.nuevoInsumo.unidad || 'und',
        precio,
        activo: true,
        fechaActualizacion: new Date()
      };

      if (this.editando && this.idInsumoEditando) {
        const insumoAnterior = this.listaInsumos.find(i => i.id === this.idInsumoEditando);
        const cantidadAnterior = Number(insumoAnterior?.cantidad || 0);
        const diferencia = cantidad - cantidadAnterior;

        const ref = doc(this.firestore, 'inventario', this.idInsumoEditando);
        await updateDoc(ref, dataToSave);

        if (diferencia !== 0) {
          await this.registrarMovimientoInventario(
            { id: this.idInsumoEditando, nombre },
            'ajuste',
            diferencia
          );
        }

      } else {
        const docRef = await addDoc(collection(this.firestore, 'inventario'), {
          ...dataToSave,
          fechaCreacion: new Date()
        });

        await this.registrarMovimientoInventario(
          { id: docRef.id, nombre },
          'entrada',
          cantidad
        );
      }

      this.cerrarFormulario();

    } catch (error) {
      console.error('Error guardando insumo:', error);
    }
  }

  async ajustarStockRapido(insumo: any, variacion: number) {
    const cantidadActual = Number(insumo.cantidad) || 0;
    const nuevaCantidad = cantidadActual + variacion;

    if (nuevaCantidad < 0) {
      alert('El stock no puede quedar en negativo.');
      return;
    }

    try {
      const ref = doc(this.firestore, 'inventario', insumo.id);

      await updateDoc(ref, {
        cantidad: nuevaCantidad,
        fechaActualizacion: new Date()
      });

      await this.registrarMovimientoInventario(
        insumo,
        variacion > 0 ? 'entrada' : 'salida',
        Math.abs(variacion)
      );

    } catch (error) {
      console.error('Error ajustando stock rápido:', error);
    }
  }

  async registrarMovimientoInventario(
    insumo: any,
    tipo: 'entrada' | 'salida' | 'ajuste',
    cantidad: number
  ) {
    await addDoc(collection(this.firestore, 'movimientos_inventario'), {
      idInsumo: insumo.id,
      nombre: insumo.nombre || '',
      tipo,
      cantidad: Number(cantidad) || 0,
      fecha: new Date(),
      usuario: this.usuarioActual
    });
  }

  seleccionarInsumo(insumo: any) {
    this.editando = true;
    this.idInsumoEditando = insumo.id;

    this.nuevoInsumo = {
      nombre: insumo.nombre,
      categoria: insumo.categoria,
      cantidad: insumo.cantidad,
      stockMinimo: insumo.stockMinimo,
      stockMaximo: insumo.stockMaximo || null,
      unidad: insumo.unidad,
      precio: insumo.precio
    };

    this.mostrarFormulario = true;
  }

  async eliminarInsumo(id: string) {
    const confirmar = confirm('¿Seguro que deseas desactivar este insumo?');

    if (!confirmar) return;

    try {
      const ref = doc(this.firestore, 'inventario', id);

      await updateDoc(ref, {
        activo: false,
        fechaEliminacion: new Date(),
        fechaActualizacion: new Date()
      });

      this.cerrarFormulario();

    } catch (error) {
      console.error('Error desactivando insumo:', error);
    }
  }

  buscar() {
    const q = this.textoBuscar.toLowerCase().trim();

    this.insumosFiltrados = this.listaInsumos.filter(i => {
      const nombre = String(i.nombre || '').toLowerCase();
      const categoria = String(i.categoria || '').toLowerCase();

      const matchTexto = !q || nombre.includes(q) || categoria.includes(q);
      const matchAlerta = !this.soloAlertas || Number(i.cantidad) <= Number(i.stockMinimo);

      return matchTexto && matchAlerta;
    });
  }

  generarOrdenCompra() {
    const faltantes = this.listaInsumos.filter(i => Number(i.cantidad) <= Number(i.stockMinimo));

    if (faltantes.length === 0) {
      alert('No hay insumos bajos o críticos.');
      return;
    }

    alert(`Se detectaron ${faltantes.length} insumos para reponer.`);
  }

  exportarInventario() {
    this.exportarInventarioExcel();
  }

  async exportarInventarioExcel() {
    const datos = this.insumosFiltrados.map(i => ({
      Nombre: i.nombre,
      Categoría: i.categoria,
      Cantidad: Number(i.cantidad) || 0,
      'Stock mínimo': Number(i.stockMinimo) || 0,
      'Stock máximo': Number(i.stockMaximo) || 0,
      Unidad: i.unidad,
      Precio: Number(i.precio) || 0,
      Valor: (Number(i.cantidad) || 0) * (Number(i.precio) || 0),
      Estado: this.obtenerTextoEstado(i)
    }));

    const worksheet: any = XLSX.utils.json_to_sheet(datos);

    worksheet['!cols'] = [
      { wch: 28 },
      { wch: 22 },
      { wch: 12 },
      { wch: 15 },
      { wch: 15 },
      { wch: 10 },
      { wch: 12 },
      { wch: 14 },
      { wch: 15 }
    ];

    this.aplicarEstilosExcel(worksheet);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario');

    const nombreArchivo = `inventario_${new Date().toISOString().slice(0, 10)}.xlsx`;

    if (Capacitor.isNativePlatform()) {
      await this.descargarExcelAndroid(workbook, nombreArchivo);
    } else {
      this.descargarExcelWeb(workbook, nombreArchivo);
    }
  }

  aplicarEstilosExcel(worksheet: any) {
    if (!worksheet['!ref']) return;

    const rango = XLSX.utils.decode_range(worksheet['!ref']);

    for (let row = rango.s.r; row <= rango.e.r; row++) {
      for (let col = rango.s.c; col <= rango.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });

        if (!worksheet[cellAddress]) continue;

        worksheet[cellAddress].s = {
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
          font: { name: 'Calibri', sz: 11, color: { rgb: '111827' } },
          border: {
            top: { style: 'thin', color: { rgb: 'D1D5DB' } },
            bottom: { style: 'thin', color: { rgb: 'D1D5DB' } },
            left: { style: 'thin', color: { rgb: 'D1D5DB' } },
            right: { style: 'thin', color: { rgb: 'D1D5DB' } }
          }
        };

        if (row === 0) {
          worksheet[cellAddress].s = {
            alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
            font: { name: 'Calibri', sz: 12, bold: true, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: '7C3AED' } },
            border: {
              top: { style: 'thin', color: { rgb: '6D28D9' } },
              bottom: { style: 'thin', color: { rgb: '6D28D9' } },
              left: { style: 'thin', color: { rgb: '6D28D9' } },
              right: { style: 'thin', color: { rgb: '6D28D9' } }
            }
          };
        }
      }
    }

    worksheet['!rows'] = [
      { hpt: 24 },
      ...Array(Math.max(0, rango.e.r)).fill({ hpt: 22 })
    ];

    const precioCol = 6;
    const valorCol = 7;

    for (let row = 1; row <= rango.e.r; row++) {
      [precioCol, valorCol].forEach(col => {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });

        if (worksheet[cellAddress]) {
          worksheet[cellAddress].z = '"S/ "#,##0.00';
          worksheet[cellAddress].s = {
            ...worksheet[cellAddress].s,
            font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: '111827' } }
          };
        }
      });
    }
  }

  async descargarExcelAndroid(workbook: XLSX.WorkBook, nombreArchivo: string) {
    try {
      const excelBase64 = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });

      const resultado = await Filesystem.writeFile({
        path: nombreArchivo,
        data: excelBase64,
        directory: Directory.Documents,
        recursive: true
      });

      await Share.share({
        title: 'Reporte de inventario',
        text: 'Reporte Excel generado desde Pollería Dylan.',
        url: resultado.uri,
        dialogTitle: 'Guardar o compartir Excel'
      });

    } catch (error) {
      console.error('❌ Error exportando Excel en Android:', error);
      this.descargarExcelWeb(workbook, nombreArchivo);
    }
  }

  descargarExcelWeb(workbook: XLSX.WorkBook, nombreArchivo: string) {
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(blob);
    enlace.download = nombreArchivo;
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
  }

  async exportarInventarioPDF() {
    const docPdf = new jsPDF('landscape', 'mm', 'a4');

    docPdf.setFontSize(16);
    docPdf.text('Reporte de Inventario - Pollería Dylan', 14, 15);

    docPdf.setFontSize(10);
    docPdf.text(`Fecha: ${this.fechaActual}`, 14, 23);
    docPdf.text(`Total insumos: ${this.totalInsumos}`, 14, 30);
    docPdf.text(`Stock OK: ${this.totalOk}`, 14, 36);
    docPdf.text(`Bajo stock: ${this.totalBajo}`, 14, 42);
    docPdf.text(`Crítico: ${this.totalCritico}`, 14, 48);
    docPdf.text(`Valor inventario: S/ ${this.valorInventario.toFixed(2)}`, 14, 54);

    const filas = this.insumosFiltrados.map(i => [
      i.nombre,
      i.categoria,
      Number(i.cantidad) || 0,
      Number(i.stockMinimo) || 0,
      Number(i.stockMaximo) || 0,
      i.unidad,
      `S/ ${(Number(i.precio) || 0).toFixed(2)}`,
      `S/ ${((Number(i.cantidad) || 0) * (Number(i.precio) || 0)).toFixed(2)}`,
      this.obtenerTextoEstado(i)
    ]);

    autoTable(docPdf, {
      startY: 62,
      head: [[
        'Nombre',
        'Categoría',
        'Cantidad',
        'Mínimo',
        'Máximo',
        'Unidad',
        'Precio',
        'Valor',
        'Estado'
      ]],
      body: filas,
      styles: { fontSize: 8 },
      headStyles: {
        fillColor: [126, 58, 242],
        textColor: [255, 255, 255]
      }
    });

    const nombreArchivo = `inventario_${new Date().toISOString().slice(0, 10)}.pdf`;

    if (Capacitor.isNativePlatform()) {
      await this.descargarPDFAndroid(docPdf, nombreArchivo);
    } else {
      docPdf.save(nombreArchivo);
    }
  }

  async descargarPDFAndroid(docPdf: jsPDF, nombreArchivo: string) {
    try {
      const pdfBase64 = docPdf.output('datauristring').split(',')[1];

      const resultado = await Filesystem.writeFile({
        path: nombreArchivo,
        data: pdfBase64,
        directory: Directory.Documents,
        recursive: true
      });

      await Share.share({
        title: 'Reporte de inventario',
        text: 'Reporte PDF generado desde Pollería Dylan.',
        url: resultado.uri,
        dialogTitle: 'Guardar o compartir PDF'
      });

    } catch (error) {
      console.error('❌ Error exportando PDF en Android:', error);
      alert('No se pudo exportar el PDF en Android.');
    }
  }

  limpiarFormulario() {
    this.nuevoInsumo = {
      nombre: '',
      categoria: '',
      cantidad: null,
      stockMinimo: null,
      stockMaximo: null,
      unidad: '',
      precio: null
    };
  }
}