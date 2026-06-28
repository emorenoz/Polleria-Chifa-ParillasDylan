import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonIcon,
  IonButtons,
  IonMenuButton
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  walletOutline,
  printOutline,
  trendingUpOutline,
  trendingDownOutline,
  cashOutline,
  addOutline,
  removeOutline
} from 'ionicons/icons';

import {
  Firestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy
} from '@angular/fire/firestore';

@Component({
  selector: 'app-caja',
  templateUrl: './caja.page.html',
  styleUrls: ['./caja.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonIcon,
    IonButtons,
    IonMenuButton
  ]
})
export class CajaPage implements OnInit {

  private firestore = inject(Firestore);

  fechaActual = '';
  usuarioCaja = 'Admin';
  horaApertura = '08:00';
  fondoInicial = 350;

  totalCaja = 0;
  totalIngresos = 0;
  totalEgresos = 0;

  cantidadIngresos = 0;
  cantidadEgresos = 0;

  totalEfectivo = 0;
  totalTarjeta = 0;
  totalYape = 0;

  porcentajeEfectivo = 0;
  porcentajeTarjeta = 0;
  porcentajeYape = 0;

  mostrarFormulario = false;

  nuevoMovimiento = {
    tipo: '',
    metodo: '',
    monto: null as number | null,
    descripcion: ''
  };

  historial: any[] = [];

  constructor() {
    addIcons({
      walletOutline,
      printOutline,
      trendingUpOutline,
      trendingDownOutline,
      cashOutline,
      addOutline,
      removeOutline
    });
  }

  async ngOnInit() {
    this.configurarFecha();
    await this.cargarMovimientosFirebase();
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

  async cargarMovimientosFirebase() {
    try {
      const movimientosRef = query(
        collection(this.firestore, 'caja'),
        orderBy('fecha', 'desc')
      );

      const querySnapshot = await getDocs(movimientosRef);

      this.historial = [];

      querySnapshot.forEach((docSnap) => {
        this.historial.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });

      this.calcularTotales();

    } catch (error) {
      console.error('❌ Error cargando movimientos:', error);
    }
  }

  prepararIngreso() {
    this.mostrarFormulario = true;

    this.nuevoMovimiento = {
      tipo: 'ingreso',
      metodo: 'Efectivo',
      monto: null,
      descripcion: ''
    };
  }

  prepararEgreso() {
    this.mostrarFormulario = true;

    this.nuevoMovimiento = {
      tipo: 'egreso',
      metodo: 'Retiro',
      monto: null,
      descripcion: ''
    };
  }

  async registrarMovimiento() {
    if (!this.nuevoMovimiento.tipo || !this.nuevoMovimiento.monto) {
      return;
    }

    const movimiento = {
      tipo: this.nuevoMovimiento.tipo,
      metodo: this.nuevoMovimiento.metodo || (
        this.nuevoMovimiento.tipo === 'ingreso' ? 'Efectivo' : 'Retiro'
      ),
      monto: Number(this.nuevoMovimiento.monto),
      descripcion: this.nuevoMovimiento.descripcion.trim() || (
        this.nuevoMovimiento.tipo === 'ingreso'
          ? 'Ingreso manual'
          : 'Egreso manual'
      ),
      fecha: new Date()
    };

    try {
      const docRef = await addDoc(
        collection(this.firestore, 'caja'),
        movimiento
      );

      this.historial.unshift({
        id: docRef.id,
        ...movimiento
      });

      this.calcularTotales();

      this.nuevoMovimiento = {
        tipo: '',
        metodo: '',
        monto: null,
        descripcion: ''
      };

      this.mostrarFormulario = false;

    } catch (error) {
      console.error('❌ Error registrando movimiento:', error);
    }
  }

  calcularTotales() {
    this.totalIngresos = this.historial
      .filter(mov => mov.tipo === 'ingreso')
      .reduce((sum, mov) => sum + Number(mov.monto || 0), 0);

    this.totalEgresos = this.historial
      .filter(mov => mov.tipo === 'egreso')
      .reduce((sum, mov) => sum + Number(mov.monto || 0), 0);

    this.totalCaja = this.fondoInicial + this.totalIngresos - this.totalEgresos;

    this.cantidadIngresos = this.historial
      .filter(mov => mov.tipo === 'ingreso').length;

    this.cantidadEgresos = this.historial
      .filter(mov => mov.tipo === 'egreso').length;

    this.totalEfectivo = this.historial
      .filter(mov => mov.tipo === 'ingreso' && mov.metodo === 'Efectivo')
      .reduce((sum, mov) => sum + Number(mov.monto || 0), 0);

    this.totalTarjeta = this.historial
      .filter(mov => mov.tipo === 'ingreso' && mov.metodo === 'Tarjeta')
      .reduce((sum, mov) => sum + Number(mov.monto || 0), 0);

    this.totalYape = this.historial
      .filter(mov => mov.tipo === 'ingreso' && mov.metodo === 'Yape')
      .reduce((sum, mov) => sum + Number(mov.monto || 0), 0);

    const totalMetodos = this.totalEfectivo + this.totalTarjeta + this.totalYape;

    this.porcentajeEfectivo = totalMetodos > 0
      ? (this.totalEfectivo / totalMetodos) * 100
      : 0;

    this.porcentajeTarjeta = totalMetodos > 0
      ? (this.totalTarjeta / totalMetodos) * 100
      : 0;

    this.porcentajeYape = totalMetodos > 0
      ? (this.totalYape / totalMetodos) * 100
      : 0;
  }

  cerrarTurno() {
    window.print();
  }

}