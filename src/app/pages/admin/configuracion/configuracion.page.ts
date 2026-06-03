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
  IonList,
  IonItem,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonIcon,
  IonLabel,
  IonNote,
  IonButtons,
  IonBackButton
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { cloudDone, save, arrowBack } from 'ionicons/icons';

import {
  Firestore,
  doc,
  getDoc,
  setDoc
} from '@angular/fire/firestore';

@Component({
  selector: 'app-configuracion',
  templateUrl: './configuracion.page.html',
  styleUrls: ['./configuracion.page.scss'],
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
    IonList,
    IonItem,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonIcon,
    IonLabel,
    IonNote,
    IonButtons,
    IonBackButton
  ]
})
export class ConfiguracionPage implements OnInit {

  private firestore = inject(Firestore);

  config = {
    ruc: '',
    nombreEmpresa: '',
    telefono: '',
    direccion: '',
    moneda: 'PEN'
  };

  guardando: boolean = false;

  constructor() {
    addIcons({ cloudDone, save, arrowBack });
  }

  async ngOnInit() {
    await this.cargarConfiguracionFirebase();
  }

  // 🔥 CARGAR CONFIGURACIÓN REAL DESDE FIREBASE
  async cargarConfiguracionFirebase() {

    try {

      const ref = doc(this.firestore, 'configuracion', 'empresa');
      const snap = await getDoc(ref);

      if (snap.exists()) {

        this.config = snap.data() as any;

      } else {

        console.log('⚠️ No existe configuración, usando valores por defecto');

      }

    } catch (error) {

      console.error('❌ Error cargando configuración:', error);

    }

  }

  // 🔥 GUARDAR CONFIGURACIÓN EN FIREBASE
  async guardarConfiguracion() {

    if (!this.config.nombreEmpresa.trim()) return;

    this.guardando = true;

    try {

      const ref = doc(this.firestore, 'configuracion', 'empresa');

      await setDoc(ref, this.config);

      console.log('✅ Configuración guardada en Firebase:', this.config);

    } catch (error) {

      console.error('❌ Error guardando configuración:', error);

    }

    this.guardando = false;

  }
}