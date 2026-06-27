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
  IonBadge,
  IonButtons,
  IonBackButton,
  IonMenuButton
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  create, trash, cube, arrowBack,
  warningOutline, searchOutline, alertCircleOutline,
  addOutline, syncOutline, closeOutline, pencilOutline, trashOutline
} from 'ionicons/icons';

import {
  Firestore,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc
} from '@angular/fire/firestore';

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
export class StockPage implements OnInit {

  private firestore = inject(Firestore);

  fechaActual: string = '';
  mostrarFormulario: boolean = false;
  soloAlertas: boolean = false;

  totalInsumos: number = 0;
  totalOk: number = 0;
  totalBajo: number = 0;
  totalCritico: number = 0;

  nuevoInsumo = {
    nombre: '',
    categoria: '',
    cantidad: null as number | null,
    stockMinimo: null as number | null,
    unidad: '',
    precio: null as number | null
  };

  editando = false;
  idInsumoEditando: string | null = null;
  textoBuscar = '';

  listaInsumos: any[] = [];
  insumosFiltrados: any[] = [];

  inventarioCarta: any[] = [
    { id: 'pollo-entero', nombre: 'Pollo entero', categoria: 'Carnes y Pollo', cantidad: 100, stockMinimo: 10, unidad: 'und', precio: 18 },
    { id: 'pechuga-de-pollo', nombre: 'Pechuga de pollo', categoria: 'Carnes y Pollo', cantidad: 100, stockMinimo: 10, unidad: 'kg', precio: 16 },
    { id: 'pierna-de-pollo', nombre: 'Pierna de pollo', categoria: 'Carnes y Pollo', cantidad: 100, stockMinimo: 10, unidad: 'kg', precio: 14 },
    { id: 'alita-de-pollo', nombre: 'Alita de pollo', categoria: 'Carnes y Pollo', cantidad: 100, stockMinimo: 10, unidad: 'kg', precio: 12 },
    { id: 'menudencia-de-pollo', nombre: 'Menudencia de pollo', categoria: 'Carnes y Pollo', cantidad: 100, stockMinimo: 10, unidad: 'kg', precio: 8 },
    { id: 'chuleta-de-cerdo', nombre: 'Chuleta de cerdo', categoria: 'Carnes y Pollo', cantidad: 100, stockMinimo: 10, unidad: 'kg', precio: 18 },
    { id: 'bistec-de-res', nombre: 'Bistec de res', categoria: 'Carnes y Pollo', cantidad: 100, stockMinimo: 10, unidad: 'kg', precio: 22 },
    { id: 'carne-para-lomo', nombre: 'Carne para lomo saltado', categoria: 'Carnes y Pollo', cantidad: 100, stockMinimo: 10, unidad: 'kg', precio: 24 },
    { id: 'carne-de-chancho', nombre: 'Carne de chancho', categoria: 'Carnes y Pollo', cantidad: 100, stockMinimo: 10, unidad: 'kg', precio: 18 },
    { id: 'langostinos', nombre: 'Langostinos', categoria: 'Carnes y Pollo', cantidad: 100, stockMinimo: 10, unidad: 'kg', precio: 35 },
    { id: 'anticucho', nombre: 'Anticucho', categoria: 'Carnes y Pollo', cantidad: 100, stockMinimo: 10, unidad: 'und', precio: 3 },
    { id: 'mollejitas', nombre: 'Mollejitas', categoria: 'Carnes y Pollo', cantidad: 100, stockMinimo: 10, unidad: 'kg', precio: 12 },
    { id: 'chorizo', nombre: 'Chorizo', categoria: 'Carnes y Pollo', cantidad: 100, stockMinimo: 10, unidad: 'und', precio: 3 },
    { id: 'hot-dog', nombre: 'Hot Dog', categoria: 'Carnes y Pollo', cantidad: 100, stockMinimo: 10, unidad: 'und', precio: 1.2 },
    { id: 'brocheta-de-pollo', nombre: 'Brocheta de pollo', categoria: 'Carnes y Pollo', cantidad: 100, stockMinimo: 10, unidad: 'und', precio: 5 },
    { id: 'papa-blanca', nombre: 'Papa blanca', categoria: 'Guarniciones', cantidad: 100, stockMinimo: 20, unidad: 'kg', precio: 3.5 },
    { id: 'papa-amarilla', nombre: 'Papa amarilla', categoria: 'Guarniciones', cantidad: 100, stockMinimo: 20, unidad: 'kg', precio: 4 },
    { id: 'arroz', nombre: 'Arroz', categoria: 'Guarniciones', cantidad: 100, stockMinimo: 20, unidad: 'kg', precio: 4 },
    { id: 'arroz-chaufa-preparado', nombre: 'Arroz chaufa preparado', categoria: 'Guarniciones', cantidad: 100, stockMinimo: 10, unidad: 'kg', precio: 6 },
    { id: 'fideos', nombre: 'Fideos', categoria: 'Guarniciones', cantidad: 100, stockMinimo: 10, unidad: 'kg', precio: 5 },
    { id: 'wantan', nombre: 'Wantán', categoria: 'Guarniciones', cantidad: 100, stockMinimo: 10, unidad: 'und', precio: 0.2 },
    { id: 'pan', nombre: 'Pan', categoria: 'Guarniciones', cantidad: 100, stockMinimo: 10, unidad: 'und', precio: 0.5 },
    { id: 'yuca', nombre: 'Yuca', categoria: 'Guarniciones', cantidad: 100, stockMinimo: 10, unidad: 'kg', precio: 4 },
    { id: 'platano', nombre: 'Plátano', categoria: 'Guarniciones', cantidad: 100, stockMinimo: 10, unidad: 'und', precio: 1 },
    { id: 'huevo', nombre: 'Huevo', categoria: 'Insumos Chifa', cantidad: 100, stockMinimo: 20, unidad: 'und', precio: 0.6 },
    { id: 'lechuga', nombre: 'Lechuga', categoria: 'Verduras', cantidad: 100, stockMinimo: 10, unidad: 'und', precio: 2.5 },
    { id: 'tomate', nombre: 'Tomate', categoria: 'Verduras', cantidad: 100, stockMinimo: 10, unidad: 'kg', precio: 4 },
    { id: 'cebolla', nombre: 'Cebolla', categoria: 'Verduras', cantidad: 100, stockMinimo: 10, unidad: 'kg', precio: 3 },
    { id: 'pepino', nombre: 'Pepino', categoria: 'Verduras', cantidad: 100, stockMinimo: 10, unidad: 'kg', precio: 3 },
    { id: 'palta', nombre: 'Palta', categoria: 'Verduras', cantidad: 100, stockMinimo: 10, unidad: 'kg', precio: 8 },
    { id: 'limon', nombre: 'Limón', categoria: 'Verduras', cantidad: 100, stockMinimo: 10, unidad: 'kg', precio: 5 },
    { id: 'aji-amarillo', nombre: 'Ají amarillo', categoria: 'Verduras', cantidad: 100, stockMinimo: 10, unidad: 'kg', precio: 6 },
    { id: 'aji-limo', nombre: 'Ají limo', categoria: 'Verduras', cantidad: 100, stockMinimo: 10, unidad: 'kg', precio: 8 },
    { id: 'kion', nombre: 'Kion', categoria: 'Verduras', cantidad: 100, stockMinimo: 5, unidad: 'kg', precio: 7 },
    { id: 'ajo', nombre: 'Ajo', categoria: 'Verduras', cantidad: 100, stockMinimo: 5, unidad: 'kg', precio: 7 },
    { id: 'culantro', nombre: 'Culantro', categoria: 'Verduras', cantidad: 100, stockMinimo: 10, unidad: 'atado', precio: 1.5 },
    { id: 'zanahoria', nombre: 'Zanahoria', categoria: 'Verduras', cantidad: 100, stockMinimo: 10, unidad: 'kg', precio: 3 },
    { id: 'holantao', nombre: 'Holantao', categoria: 'Verduras', cantidad: 100, stockMinimo: 10, unidad: 'kg', precio: 7 },
    { id: 'frejol-chino', nombre: 'Frejol chino', categoria: 'Verduras', cantidad: 100, stockMinimo: 10, unidad: 'kg', precio: 5 },
    { id: 'sal', nombre: 'Sal', categoria: 'Condimentos', cantidad: 100, stockMinimo: 10, unidad: 'kg', precio: 2 },
    { id: 'pimienta', nombre: 'Pimienta', categoria: 'Condimentos', cantidad: 100, stockMinimo: 5, unidad: 'kg', precio: 18 },
    { id: 'comino', nombre: 'Comino', categoria: 'Condimentos', cantidad: 100, stockMinimo: 5, unidad: 'kg', precio: 15 },
    { id: 'sillao', nombre: 'Sillao', categoria: 'Condimentos', cantidad: 100, stockMinimo: 10, unidad: 'lt', precio: 6 },
    { id: 'vinagre', nombre: 'Vinagre', categoria: 'Condimentos', cantidad: 100, stockMinimo: 10, unidad: 'lt', precio: 4 },
    { id: 'oregano', nombre: 'Orégano', categoria: 'Condimentos', cantidad: 100, stockMinimo: 5, unidad: 'kg', precio: 12 },
    { id: 'mostaza', nombre: 'Mostaza', categoria: 'Condimentos', cantidad: 100, stockMinimo: 10, unidad: 'lt', precio: 7 },
    { id: 'ketchup', nombre: 'Ketchup', categoria: 'Condimentos', cantidad: 100, stockMinimo: 10, unidad: 'lt', precio: 7 },
    { id: 'mayonesa', nombre: 'Mayonesa', categoria: 'Condimentos', cantidad: 100, stockMinimo: 10, unidad: 'lt', precio: 8 },
    { id: 'crema-de-aji', nombre: 'Crema de ají', categoria: 'Condimentos', cantidad: 100, stockMinimo: 10, unidad: 'lt', precio: 8 },
    { id: 'aceite', nombre: 'Aceite', categoria: 'Insumos Chifa', cantidad: 100, stockMinimo: 20, unidad: 'lt', precio: 7 },
    { id: 'harina', nombre: 'Harina', categoria: 'Insumos Chifa', cantidad: 100, stockMinimo: 10, unidad: 'kg', precio: 4 },
    { id: 'maicena', nombre: 'Maicena', categoria: 'Insumos Chifa', cantidad: 100, stockMinimo: 10, unidad: 'kg', precio: 6 },
    { id: 'salsa-de-ostion', nombre: 'Salsa de ostión', categoria: 'Insumos Chifa', cantidad: 100, stockMinimo: 10, unidad: 'lt', precio: 12 },
    { id: 'coca-cola-500ml', nombre: 'Coca Cola 500ml', categoria: 'Bebidas', cantidad: 100, stockMinimo: 10, unidad: 'und', precio: 2.5 },
    { id: 'coca-cola-1-5l', nombre: 'Coca Cola 1.5L', categoria: 'Bebidas', cantidad: 100, stockMinimo: 10, unidad: 'und', precio: 7 },
    { id: 'coca-cola-3l', nombre: 'Coca Cola 3L', categoria: 'Bebidas', cantidad: 100, stockMinimo: 10, unidad: 'und', precio: 10 },
    { id: 'inca-kola-500ml', nombre: 'Inca Kola 500ml', categoria: 'Bebidas', cantidad: 100, stockMinimo: 10, unidad: 'und', precio: 2.5 },
    { id: 'inca-kola-1-5l', nombre: 'Inca Kola 1.5L', categoria: 'Bebidas', cantidad: 100, stockMinimo: 10, unidad: 'und', precio: 7 },
    { id: 'inca-kola-3l', nombre: 'Inca Kola 3L', categoria: 'Bebidas', cantidad: 100, stockMinimo: 10, unidad: 'und', precio: 10 },
    { id: 'sprite', nombre: 'Sprite', categoria: 'Bebidas', cantidad: 100, stockMinimo: 10, unidad: 'und', precio: 3 },
    { id: 'fanta', nombre: 'Fanta', categoria: 'Bebidas', cantidad: 100, stockMinimo: 10, unidad: 'und', precio: 3 },
    { id: 'agua-mineral', nombre: 'Agua Mineral', categoria: 'Bebidas', cantidad: 100, stockMinimo: 10, unidad: 'und', precio: 2 },
    { id: 'maracuya', nombre: 'Maracuyá', categoria: 'Bebidas', cantidad: 100, stockMinimo: 10, unidad: 'kg', precio: 5 },
    { id: 'chicha-morada-concentrado', nombre: 'Chicha morada concentrado', categoria: 'Bebidas', cantidad: 100, stockMinimo: 10, unidad: 'lt', precio: 6 },
    { id: 'limonada-concentrado', nombre: 'Limonada concentrado', categoria: 'Bebidas', cantidad: 100, stockMinimo: 10, unidad: 'lt', precio: 5 },
    { id: 'cafe', nombre: 'Café', categoria: 'Bebidas Calientes', cantidad: 100, stockMinimo: 10, unidad: 'kg', precio: 18 },
    { id: 'te', nombre: 'Té', categoria: 'Bebidas Calientes', cantidad: 100, stockMinimo: 10, unidad: 'caja', precio: 5 },
    { id: 'anis', nombre: 'Anís', categoria: 'Bebidas Calientes', cantidad: 100, stockMinimo: 10, unidad: 'caja', precio: 5 },
    { id: 'manzanilla', nombre: 'Manzanilla', categoria: 'Bebidas Calientes', cantidad: 100, stockMinimo: 10, unidad: 'caja', precio: 5 },
    { id: 'vino-borgona', nombre: 'Vino Borgoña', categoria: 'Vinos', cantidad: 100, stockMinimo: 5, unidad: 'und', precio: 18 },
    { id: 'vino-tabernero', nombre: 'Vino Tabernero', categoria: 'Vinos', cantidad: 100, stockMinimo: 5, unidad: 'und', precio: 22 },
    { id: 'carbon', nombre: 'Carbón', categoria: 'Parrillas', cantidad: 100, stockMinimo: 10, unidad: 'kg', precio: 4 },
    { id: 'lena', nombre: 'Leña', categoria: 'Parrillas', cantidad: 100, stockMinimo: 10, unidad: 'kg', precio: 3 },
    { id: 'gas', nombre: 'Gas', categoria: 'Parrillas', cantidad: 100, stockMinimo: 5, unidad: 'balón', precio: 55 },
    { id: 'vasos-descartables', nombre: 'Vasos descartables', categoria: 'Descartables', cantidad: 100, stockMinimo: 20, unidad: 'paquete', precio: 8 },
    { id: 'tapers', nombre: 'Tapers', categoria: 'Descartables', cantidad: 100, stockMinimo: 20, unidad: 'paquete', precio: 15 },
    { id: 'bolsas', nombre: 'Bolsas', categoria: 'Descartables', cantidad: 100, stockMinimo: 20, unidad: 'paquete', precio: 8 },
    { id: 'servilletas', nombre: 'Servilletas', categoria: 'Descartables', cantidad: 100, stockMinimo: 20, unidad: 'paquete', precio: 5 },
    { id: 'cubiertos-descartables', nombre: 'Cubiertos descartables', categoria: 'Descartables', cantidad: 100, stockMinimo: 20, unidad: 'paquete', precio: 10 },
  ];

  constructor() {
    addIcons({
      create, trash, cube, arrowBack,
      warningOutline, searchOutline, alertCircleOutline,
      addOutline, syncOutline, closeOutline, pencilOutline, trashOutline
    });
  }

  async ngOnInit() {
    this.configurarFecha();
    await this.cargarInventarioFirebase();
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
    this.idInsumoEditando = null;
  }

  toggleAlertas() {
    this.soloAlertas = !this.soloAlertas;
    this.buscar();
  }

  obtenerEmoji(cat: string): string {
    if (!cat) return '📦';

    const c = cat.toLowerCase();

    if (c.includes('carne') || c.includes('pollo') || c.includes('brasa') || c.includes('parrilla')) return '🍗';
    if (c.includes('verdura') || c.includes('guarniciones')) return '🍟';
    if (c.includes('bebida') || c.includes('gaseosa') || c.includes('vinos')) return '🥤';
    if (c.includes('chifa')) return '🥡';
    if (c.includes('sopa')) return '🍜';

    return '📦';
  }

  obtenerColorEstado(insumo: any, esFondo: boolean = false): string {
    if (insumo.cantidad <= 0) return esFondo ? 'bg-red' : 'text-red';
    if (insumo.cantidad <= insumo.stockMinimo) return esFondo ? 'bg-yellow' : 'text-yellow';
    return esFondo ? 'bg-green' : 'text-green';
  }

  obtenerTextoEstado(insumo: any): string {
    if (insumo.cantidad <= 0) return 'Crítico';
    if (insumo.cantidad <= insumo.stockMinimo) return 'Bajo stock';
    return 'OK';
  }

  calcularPorcentaje(insumo: any): number {
    if (insumo.cantidad === 0) return 10;
    if (insumo.cantidad >= insumo.stockMinimo * 2) return 100;

    return (insumo.cantidad / (insumo.stockMinimo * 2)) * 100;
  }

  calcularKPIs() {
    this.totalInsumos = this.listaInsumos.length;
    this.totalCritico = this.listaInsumos.filter(i => i.cantidad <= 0).length;
    this.totalBajo = this.listaInsumos.filter(i => i.cantidad > 0 && i.cantidad <= i.stockMinimo).length;
    this.totalOk = this.listaInsumos.filter(i => i.cantidad > i.stockMinimo).length;
  }

  async cargarInventarioFirebase() {
    try {
      const snapshot = await getDocs(collection(this.firestore, 'inventario'));
      this.listaInsumos = [];

      snapshot.forEach(docSnap => {
        const data: any = docSnap.data();

        this.listaInsumos.push({
          id: docSnap.id,
          nombre: data.nombre || '',
          categoria: data.categoria || '',
          cantidad: data.cantidad || 0,
          stockMinimo: data.stockMinimo || 0,
          unidad: data.unidad || '',
          precio: data.precio || null
        });
      });

      if (this.listaInsumos.length < this.inventarioCarta.length) {
        await this.crearInventarioAutomatico();
        return;
      }

      this.calcularKPIs();
      this.buscar();

    } catch (error) {
      console.error('Error cargando inventario:', error);
    }
  }

  async crearInventarioAutomatico() {
    try {
      for (const insumo of this.inventarioCarta) {
        const ref = doc(this.firestore, 'inventario', insumo.id);

        await setDoc(ref, {
          nombre: insumo.nombre,
          categoria: insumo.categoria,
          cantidad: insumo.cantidad,
          stockMinimo: insumo.stockMinimo,
          unidad: insumo.unidad,
          precio: insumo.precio
        }, { merge: true });
      }

      const snapshotActualizado = await getDocs(collection(this.firestore, 'inventario'));
      this.listaInsumos = [];

      snapshotActualizado.forEach(docSnap => {
        const data: any = docSnap.data();

        this.listaInsumos.push({
          id: docSnap.id,
          nombre: data.nombre || '',
          categoria: data.categoria || '',
          cantidad: data.cantidad || 0,
          stockMinimo: data.stockMinimo || 0,
          unidad: data.unidad || '',
          precio: data.precio || null
        });
      });

      this.calcularKPIs();
      this.buscar();

      console.log('✅ Inventario automático completado:', this.listaInsumos.length);

    } catch (error) {
      console.error('Error creando inventario automático:', error);
    }
  }

  async actualizarInventario() {
    try {
      await this.cargarInventarioFirebase();
      console.log('✅ Inventario actualizado correctamente');
    } catch (error) {
      console.error('❌ Error actualizando inventario:', error);
    }
  }

  async guardarInsumo() {
    if (!this.nuevoInsumo.nombre.trim() || this.nuevoInsumo.cantidad === null || !this.nuevoInsumo.stockMinimo) return;

    try {
      const dataToSave = {
        nombre: this.nuevoInsumo.nombre.trim(),
        categoria: this.nuevoInsumo.categoria || '',
        cantidad: Number(this.nuevoInsumo.cantidad),
        stockMinimo: Number(this.nuevoInsumo.stockMinimo),
        unidad: this.nuevoInsumo.unidad || 'und',
        precio: this.nuevoInsumo.precio ? Number(this.nuevoInsumo.precio) : 0
      };

      if (this.editando && this.idInsumoEditando) {
        const ref = doc(this.firestore, 'inventario', this.idInsumoEditando);
        await updateDoc(ref, dataToSave);
      } else {
        await addDoc(collection(this.firestore, 'inventario'), dataToSave);
      }

      await this.cargarInventarioFirebase();
      this.cerrarFormulario();

    } catch (error) {
      console.error('Error guardando insumo:', error);
    }
  }

  async ajustarStockRapido(insumo: any, variacion: number) {
    const nuevaCantidad = insumo.cantidad + variacion;

    if (nuevaCantidad < 0) return;

    try {
      const ref = doc(this.firestore, 'inventario', insumo.id);

      await updateDoc(ref, {
        cantidad: nuevaCantidad
      });

      insumo.cantidad = nuevaCantidad;

      this.calcularKPIs();
      this.buscar();

    } catch (error) {
      console.error('Error ajustando stock rápido:', error);
    }
  }

  seleccionarInsumo(insumo: any) {
    this.editando = true;
    this.idInsumoEditando = insumo.id;

    this.nuevoInsumo = {
      nombre: insumo.nombre,
      categoria: insumo.categoria,
      cantidad: insumo.cantidad,
      stockMinimo: insumo.stockMinimo,
      unidad: insumo.unidad,
      precio: insumo.precio
    };

    this.mostrarFormulario = true;
  }

  async eliminarInsumo(id: string) {
    try {
      await deleteDoc(doc(this.firestore, 'inventario', id));
      await this.cargarInventarioFirebase();
      this.cerrarFormulario();

    } catch (error) {
      console.error('Error eliminando insumo:', error);
    }
  }

  buscar() {
    const q = this.textoBuscar.toLowerCase().trim();

    this.insumosFiltrados = this.listaInsumos.filter(i => {
      const matchTexto = !q || i.nombre.toLowerCase().includes(q);
      const matchAlerta = !this.soloAlertas || i.cantidad <= i.stockMinimo;

      return matchTexto && matchAlerta;
    });
  }

  limpiarFormulario() {
    this.nuevoInsumo = {
      nombre: '',
      categoria: '',
      cantidad: null,
      stockMinimo: null,
      unidad: '',
      precio: null
    };
  }
}