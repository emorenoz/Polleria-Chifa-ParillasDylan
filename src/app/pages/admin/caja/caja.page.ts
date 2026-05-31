import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader,
  IonCardSubtitle, IonCardTitle, IonCardContent, IonGrid, IonRow, IonCol,
  IonText, IonList, IonItem, IonSelect, IonSelectOption, IonInput,
  IonButton, IonIcon, IonNote
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowUpCircle, arrowDownCircle } from 'ionicons/icons';

@Component({
  selector: 'app-caja',
  templateUrl: './caja.page.html',
  styleUrls: ['./caja.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonHeader, IonTitle, IonToolbar,
    IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCardContent,
    IonGrid, IonRow, IonCol, IonText, IonList, IonItem, IonSelect,
    IonSelectOption, IonInput, IonButton, IonIcon, IonNote
  ]
})
export class CajaPage implements OnInit {

  totalCaja: number = 0;
  totalIngresos: number = 0;
  totalEgresos: number = 0;

  nuevoMovimiento = {
    tipo: '',
    monto: null as number | null,
    descripcion: ''
  };

  historial: any[] = [];

  constructor() {
    addIcons({ arrowUpCircle, arrowDownCircle });
  }

  async ngOnInit() {
    await this.cargarMovimientosFirebase();
  }

  // Simulación de lectura desde Firestore en tiempo real
  async cargarMovimientosFirebase() {
    // Aquí irá: this.firestore.collection('caja').snapshotChanges()...
    this.historial = []; 
    this.calcularTotales();
  }

  // Preparado para: db.collection('caja').add(movimiento)
  async registrarMovimiento() {
    if (!this.nuevoMovimiento.monto || !this.nuevoMovimiento.tipo) return;

    const movimiento = {
      tipo: this.nuevoMovimiento.tipo,
      monto: Number(this.nuevoMovimiento.monto),
      descripcion: this.nuevoMovimiento.descripcion.trim() || (this.nuevoMovimiento.tipo === 'ingreso' ? 'Ingreso manual' : 'Egreso manual'),
      fecha: new Date().toISOString() // Firebase prefiere strings ISO o Timestamps nativos
    };

    // SIMULACIÓN FIREBASE: Agregamos localmente mientras tanto
    this.historial.unshift(movimiento);
    this.calcularTotales();

    // Resetear formulario
    this.nuevoMovimiento = { tipo: '', monto: null, descripcion: '' };
  }

  calcularTotales() {
    this.totalIngresos = this.historial
      .filter(mov => mov.tipo === 'ingreso')
      .reduce((sum, mov) => sum + mov.monto, 0);

    this.totalEgresos = this.historial
      .filter(mov => mov.tipo === 'egreso')
      .reduce((sum, mov) => sum + mov.monto, 0);

    this.totalCaja = this.totalIngresos - this.totalEgresos;
  }
}