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
import { cloudDone, save, arrowBack } from 'ionicons/icons'; // 👈 Se agregó arrowBack

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
    IonButtons,   // 👈 REGISTRADO EN IMPORTS
    IonBackButton // 👈 REGISTRADO EN IMPORTS
  ]
})
export class ConfiguracionPage implements OnInit {

  // Objeto estructurado en formato clave-valor listo para un documento de Firestore
  config = {
    ruc: '',
    nombreEmpresa: '',
    telefono: '',
    direccion: '',
    moneda: 'PEN'
  };

  // Estado para controlar la carga visual al guardar
  guardando: boolean = false;

  constructor() {
    // Inyección de íconos requeridos para Standalone (incluido el de navegación)
    addIcons({ cloudDone, save, arrowBack });
  }

  async ngOnInit() {
    await this.cargarConfiguracionFirebase();
  }

  // Simulación de lectura del documento único de configuración en Firestore
  async cargarConfiguracionFirebase() {
    //los datos guardados previamente
    this.config = {
      ruc: '10436830560',
      nombreEmpresa: 'Polleria Dylan',
      telefono: '982061791',
      direccion: 'Av. Los Angeles 320, Comas, Lima',
      moneda: 'PEN'
    };
  }

  // Simulación de escritura: db.collection('config').doc('empresa').set(this.config)
  async guardarConfiguracion() {
    if (!this.config.nombreEmpresa.trim()) return;

    this.guardando = true;

    // Respuesta de la Base De Datos Firebase
    await new Promise(resolve => setTimeout(resolve, 1500));

    console.log('Datos guardados con éxito en Firebase Firestore:', this.config);

    this.guardando = false;
  }
}