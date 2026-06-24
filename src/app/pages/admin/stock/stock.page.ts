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
  warningOutline, searchOutline, alertCircleOutline, addOutline, syncOutline, closeOutline, pencilOutline, trashOutline 
} from 'ionicons/icons';

// 🔥 FIREBASE
import {
  Firestore,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
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

  // --- VARIABLES DE UI ---
  fechaActual: string = '';
  mostrarFormulario: boolean = false;
  soloAlertas: boolean = false;

  // --- VARIABLES DE MÉTRICAS ---
  totalInsumos: number = 0;
  totalOk: number = 0;
  totalBajo: number = 0;
  totalCritico: number = 0;

  // --- MODELO EXTENDIDO PARA EL DISEÑO ---
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

  constructor() {
    addIcons({ 
      create, trash, cube, arrowBack,
      warningOutline, searchOutline, alertCircleOutline, addOutline, syncOutline, closeOutline, pencilOutline, trashOutline
    });
  }

  async ngOnInit() {
    this.configurarFecha();
    await this.cargarInventarioFirebase();
  }

  configurarFecha() {
    const opciones: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    this.fechaActual = new Date().toLocaleDateString('es-PE', opciones);
  }

  // --- CONTROL DE FORMULARIO ---
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

  // --- MÉTODOS VISUALES PARA LA TABLA ---
  obtenerEmoji(cat: string): string {
    if (!cat) return '📦';
    const c = cat.toLowerCase();
    if (c.includes('carne') || c.includes('pollo')) return '🍗';
    if (c.includes('verdura')) return '🥔';
    if (c.includes('bebida') || c.includes('gaseosa')) return '🥤';
    if (c.includes('combustible') || c.includes('carbón')) return '🪨';
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
    // Si el stock está muy bien, 100%. Si está cerca del mínimo, un porcentaje representativo.
    if (insumo.cantidad === 0) return 10; // Un poquito rojo visualmente
    if (insumo.cantidad >= insumo.stockMinimo * 2) return 100;
    return (insumo.cantidad / (insumo.stockMinimo * 2)) * 100;
  }

  calcularKPIs() {
    this.totalInsumos = this.listaInsumos.length;
    this.totalCritico = this.listaInsumos.filter(i => i.cantidad <= 0).length;
    this.totalBajo = this.listaInsumos.filter(i => i.cantidad > 0 && i.cantidad <= i.stockMinimo).length;
    this.totalOk = this.listaInsumos.filter(i => i.cantidad > i.stockMinimo).length;
  }


  // --- LOGICA FIREBASE Y CRUD ---

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

      this.calcularKPIs();
      this.buscar();
    } catch (error) {
      console.error('Error cargando inventario:', error);
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

  // ⭐ NUEVO: Lógica rápida para los botones + y - de la tabla
  async ajustarStockRapido(insumo: any, variacion: number) {
    const nuevaCantidad = insumo.cantidad + variacion;
    if (nuevaCantidad < 0) return; // No permitir stock negativo
    
    try {
      const ref = doc(this.firestore, 'inventario', insumo.id);
      await updateDoc(ref, { cantidad: nuevaCantidad });
      
      // Actualizamos localmente para no hacer petición a firebase por cada click
      insumo.cantidad = nuevaCantidad;
      this.calcularKPIs();
      this.buscar(); // Re-aplica filtros por si ahora es "Crítico" o "OK"
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