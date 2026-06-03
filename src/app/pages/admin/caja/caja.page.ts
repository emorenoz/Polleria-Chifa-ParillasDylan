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
  IonCardSubtitle,
  IonCardTitle,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonText,
  IonList,
  IonItem,
  IonSelect,
  IonSelectOption,
  IonInput,
  IonButton,
  IonIcon,
  IonNote,
  IonLabel,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonButtons,
  IonBackButton
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  arrowUpCircle,
  arrowDownCircle,
  create,
  trash,
  arrowBack
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
    IonTitle,
    IonToolbar,
    IonCard,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol,
    IonText,
    IonList,
    IonItem,
    IonSelect,
    IonSelectOption,
    IonInput,
    IonButton,
    IonIcon,
    IonNote,
    IonLabel,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonButtons,
    IonBackButton
  ]
})
export class CajaPage implements OnInit {

  private firestore = inject(Firestore);

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
    addIcons({
      arrowUpCircle,
      arrowDownCircle,
      create,
      trash,
      arrowBack
    });
  }

  async ngOnInit() {
    await this.cargarMovimientosFirebase();
  }

  // Cargar movimientos desde Firebase
  async cargarMovimientosFirebase() {

    try {

      const movimientosRef = query(
        collection(this.firestore, 'caja'),
        orderBy('fecha', 'desc')
      );

      const querySnapshot =
        await getDocs(movimientosRef);

      this.historial = [];

      querySnapshot.forEach((docSnap) => {

        this.historial.push({
          id: docSnap.id,
          ...docSnap.data()
        });

      });

      this.calcularTotales();

      console.log(
        '✅ Movimientos cargados:',
        this.historial.length
      );

    } catch (error) {

      console.error(
        '❌ Error cargando movimientos:',
        error
      );

    }

  }

  // Registrar movimiento en Firebase
  async registrarMovimiento() {

    if (
      !this.nuevoMovimiento.monto ||
      !this.nuevoMovimiento.tipo
    ) return;

    const movimiento = {
      tipo: this.nuevoMovimiento.tipo,
      monto: Number(this.nuevoMovimiento.monto),
      descripcion:
        this.nuevoMovimiento.descripcion.trim()
        ||
        (
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
        monto: null,
        descripcion: ''
      };

      console.log(
        '✅ Movimiento registrado:',
        docRef.id
      );

    } catch (error) {

      console.error(
        '❌ Error registrando movimiento:',
        error
      );

    }

  }

  calcularTotales() {

    this.totalIngresos =
      this.historial
        .filter(
          mov => mov.tipo === 'ingreso'
        )
        .reduce(
          (sum, mov) => sum + mov.monto,
          0
        );

    this.totalEgresos =
      this.historial
        .filter(
          mov => mov.tipo === 'egreso'
        )
        .reduce(
          (sum, mov) => sum + mov.monto,
          0
        );

    this.totalCaja =
      this.totalIngresos -
      this.totalEgresos;

  }

}