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
  IonSearchbar,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonIcon,
  IonLabel,
  IonBadge,     // 👈 AGREGADO PARA LAS ALERTAS DE COLOR DEL STOCK
  IonButtons,   // 👈 AGREGADO PARA EL BOTÓN DE RETROCESO
  IonBackButton // 👈 AGREGADO PARA EL BOTÓN DE RETROCESO
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { create, trash, cube, arrowBack } from 'ionicons/icons'; // 👈 Íconos registrados

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
    IonBadge,     // 👈 REGISTRADO EN IMPORTS
    IonButtons,   // 👈 REGISTRADO EN IMPORTS
    IonBackButton // 👈 REGISTRADO EN IMPORTS
  ]
})
export class StockPage implements OnInit {

  // Objeto enlazado al formulario con los tipos adecuados para inputs numéricos
  nuevoInsumo = {
    nombre: '',
    cantidad: null as number | null,
    stockMinimo: null as number | null
  };

  editando: boolean = false;
  idInsumoEditando: string | null = null;
  textoBuscar: string = '';

  // Datos de prueba iniciales para Firebase
  listaInsumos: any[] = [
    { id: 'ins_1', nombre: 'Inca Kola 1.5L', cantidad: 25, stockMinimo: 10 },
    { id: 'ins_2', nombre: 'Papas Yungay (kg)', cantidad: 5, stockMinimo: 12 }
  ];
  insumosFiltrados: any[] = [];

  constructor() {
    // Inyección de todos los íconos presentes en tu HTML (incluido el del botón volver)
    addIcons({ create, trash, cube, arrowBack });
  }

  async ngOnInit() {
    await this.cargarInventarioFirebase();
  }

  // Simulación de lectura de la colección de inventarios de Cloud Firestore
  async cargarInventarioFirebase() {
    this.insumosFiltrados = [...this.listaInsumos];
  }

  // Simulación de guardado: db.collection('inventario').add() o .update()
  async guardarInsumo() {
    if (!this.nuevoInsumo.nombre.trim() || this.nuevoInsumo.cantidad === null || !this.nuevoInsumo.stockMinimo) return;

    if (this.editando && this.idInsumoEditando !== null) {
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
      const mockFirebaseId = 'fs_' + Math.random().toString(36).substring(2, 11);
      this.listaInsumos.push({
        id: mockFirebaseId,
        nombre: this.nuevoInsumo.nombre.trim(),
        text: this.nuevoInsumo.nombre.trim(),
        cantidad: Number(this.nuevoInsumo.cantidad),
        stockMinimo: Number(this.nuevoInsumo.stockMinimo)
      });
    }

    this.buscar();
    this.limpiarFormulario();
  }

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

  async eliminarInsumo(id: string) {
    this.listaInsumos = this.listaInsumos.filter(i => i.id !== id);
    this.buscar();
  }

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
    this.nuevoInsumo = { nombre: '', cantidad: null, stockMinimo: null };
  }
}