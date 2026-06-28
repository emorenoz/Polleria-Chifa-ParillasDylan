import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonButton,
  IonIcon,
  IonButtons,
  IonMenuButton
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  saveOutline,
  storefrontOutline,
  timeOutline,
  printOutline,
  notificationsOutline,
  cardOutline,
  shieldOutline
} from 'ionicons/icons';

import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';

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
    IonToolbar,
    IonButton,
    IonIcon,
    IonButtons,
    IonMenuButton
  ]
})
export class ConfiguracionPage implements OnInit {
  private firestore = inject(Firestore);

  fechaActual = '';
  guardando = false;
  tabActual = 'general';

  diasSemana = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  config: any = {
    nombreEmpresa: 'Pollería Dylan',
    ruc: '20123456789',
    direccion: 'Av. Los Próceres 1234, San Juan de Lurigancho',
    telefono: '01 234 5678',
    email: 'contacto@polleriadylan.pe',
    moneda: 'S/',
    igv: 18,

    horaApertura: '11:00',
    horaCierre: '22:00',
    atencionDomingos: true,
    diasDescanso: ['M', 'X', 'J', 'V', 'S', 'D'],

    impresionAutomatica: true,
    copiasPedido: 2,
    impresoraCocina: true,
    modeloImpresora: 'Epson TM-T20X',

    alertaPedidos: true,
    alertaStock: true,
    resumenCaja: false,
    correoAlertas: 'contacto@polleriadylan.pe',

    pagoEfectivo: true,
    pagoTarjeta: true,
    pagoYape: true,
    numeroYape: '9XX XXX XXX',

    tiempoSesion: 60,
    dobleFactor: false,
    historialAccesos: true
  };

  constructor() {
    addIcons({
      saveOutline,
      storefrontOutline,
      timeOutline,
      printOutline,
      notificationsOutline,
      cardOutline,
      shieldOutline
    });
  }

  async ngOnInit() {
    this.configurarFecha();
    await this.cargarConfiguracionFirebase();
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

  cambiarTab(tab: string) {
    this.tabActual = tab;
  }

  async cargarConfiguracionFirebase() {
    try {
      const ref = doc(this.firestore, 'configuracion', 'empresa');
      const snap = await getDoc(ref);

      if (snap.exists()) {
        this.config = {
          ...this.config,
          ...snap.data()
        };
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
    }
  }

  async guardarConfiguracion() {
    if (!this.config.nombreEmpresa.trim()) {
      alert('Ingresa el nombre del negocio.');
      return;
    }

    this.guardando = true;

    try {
      await setDoc(
        doc(this.firestore, 'configuracion', 'empresa'),
        {
          ...this.config,
          fechaActualizacion: new Date()
        },
        { merge: true }
      );

      alert('Configuración guardada correctamente.');
    } catch (error) {
      console.error('Error guardando configuración:', error);
      alert('Error al guardar configuración.');
    }

    this.guardando = false;
  }

  toggleDiaDescanso(dia: string) {
    if (!this.config.diasDescanso) {
      this.config.diasDescanso = [];
    }

    if (this.config.diasDescanso.includes(dia)) {
      this.config.diasDescanso = this.config.diasDescanso.filter((d: string) => d !== dia);
    } else {
      this.config.diasDescanso.push(dia);
    }
  }

  cambiarPasswordAdmin() {
    alert('Esta opción se conectará con el módulo de seguridad del administrador.');
  }
}