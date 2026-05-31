import { Component, OnInit } from '@angular/core';
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
  IonIcon,
  IonLabel,
  IonBadge,
  IonSearchbar,
  IonItemSliding,
  IonItemOptions,
  IonItemOption
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cube, create, trash } from 'ionicons/icons';

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
    IonIcon,
    IonLabel,
    IonBadge,
    IonSearchbar,
    IonItemSliding,
    IonItemOptions,
    IonItemOption
  ]
})
export class StockPage implements OnInit {

  // Modelo reactivo para el formulario de almacén e insumos
  nuevoInsumo = {
    nombre: '',
    cantidad: null as number | null,
    stockMinimo: null as number | null
  };

  editando: boolean = false;
  idInsumoEditando: string | null = null; // String para sincronizar con los UIDs de Firebase
  textoBuscar: string = '';

  // Datos semilla de insumos para emular colecciones de Cloud Firestore
  listaInsumos: any[] = [
    { id: 'ins_1', nombre: 'Papas Yungay (Sacos de 50kg)', cantidad: 5, stockMinimo: 2 },
    { id: 'ins_2', nombre: 'Inca Kola Zero 1.5L (Botellas)', cantidad: 48, stockMinimo: 12 },
    { id: 'ins_3', nombre: 'Aceite Vegetal Cid (Bidones)', cantidad: 1, stockMinimo: 3 }, // Alertará stock bajo ⚠️
    { id: 'ins_4', nombre: 'Carbón Vegetal (Sacos)', cantidad: 0, stockMinimo: 5 } // Alertará agotado ❌
  ];

  insumosFiltrados: any[] = [];

  constructor() {
    // Registro obligatorio de iconos en arquitectura Standalone
    addIcons({ cube, create, trash });
  }

  async ngOnInit() {
    await this.cargarStockFirebase();
  }

  // Simulación de lectura asíncrona de la colección 'stock'
  async cargarStockFirebase() {
    this.buscar();
  }

  // Registra un nuevo insumo o actualiza las existencias de uno seleccionado
  async guardarInsumo() {
    if (!this.nuevoInsumo.nombre.trim() || this.nuevoInsumo.cantidad === null || !this.nuevoInsumo.stockMinimo) return;

    if (this.editando && this.idInsumoEditando !== null) {
      // Simula: db.collection('stock').doc(id).update(...)
      const index = this.listaInsumos.findIndex(i => i.id === this.idInsumoEditando);
      if (index !== -1) {
        this.listaInsumos[index] = {
          id: this.idInsumoEditando,
          nombre: this.nuevoInsumo.nombre.trim(),
          cantidad: Number(this.nuevoInsumo.cantidad),
          stockMinimo: Number(this.nuevoInsumo.stockMinimo)
        };
      }
      this.cancelarEdicion();
    } else {
      // Simula: db.collection('stock').add(...) generando ID automático
      const mockFirebaseId = 'fs_ins_' + Math.random().toString(36).substr(2, 9);
      this.listaInsumos.push({
        id: mockFirebaseId,
        nombre: this.nuevoInsumo.nombre.trim(),
        cantidad: Number(this.nuevoInsumo.cantidad),
        stockMinimo: Number(this.nuevoInsumo.stockMinimo)
      });
    }

    this.buscar();
    this.limpiarFormulario();
  }

  // Carga los datos del artículo en los campos superiores para su ajuste
  seleccionarInsumo(insumo: any) {
    this.editando = true;
    this.idInsumoEditando = insumo.id;
    this.nuevoInsumo = {
      nombre: insumo.nombre,
      cantidad: insumo.cantidad,
      stockMinimo: insumo.stockMinimo
    };
  }

  cancelarEdicion() {
    this.editando = false;
    this.idInsumoEditando = null;
    this.limpiarFormulario();
  }

  // Simula: db.collection('stock').doc(id).delete()
  async eliminarInsumo(id: string) {
    this.listaInsumos = this.listaInsumos.filter(i => i.id !== id);
    this.buscar();
  }

  // Buscador de almacén en tiempo real
  buscar() {
    const q = this.textoBuscar.toLowerCase().trim();
    if (!q) {
      this.insumosFiltrados = [...this.listaInsumos];
    } else {
      this.insumosFiltrados = this.listaInsumos.filter(i =>
        i.nombre.toLowerCase().includes(q)
      );
    }
  }

  limpiarFormulario() {
    this.nuevoInsumo = {
      nombre: '',
      cantidad: null,
      stockMinimo: null
    };
  }
}