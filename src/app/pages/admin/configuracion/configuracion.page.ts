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
  IonNote
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cloudDone, save } from 'ionicons/icons';

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
    IonNote
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
    // Inyección de íconos requeridos para Standalone
    addIcons({ cloudDone, save });
  }

  async ngOnInit() {
    await this.cargarConfiguracionFirebase();
  }

  // Simulación de lectura del documento único de configuración en Firestore
  async cargarConfiguracionFirebase() {
    // Simula que recuperamos los datos guardados previamente
    this.config = {
      ruc: '20123456789',
      nombreEmpresa: 'Librería Continental S.A.C.',
      telefono: '987654321',
      direccion: 'Av. España 1230, Trujillo',
      moneda: 'PEN'
    };
  }

  // Simulación de escritura: db.collection('config').doc('empresa').set(this.config)
  async guardarConfiguracion() {
    if (!this.config.nombreEmpresa.trim()) return;

    this.guardando = true;

    // Simulamos los milisegundos que tarda Firebase en responder a la nube
    await new Promise(resolve => setTimeout(resolve, 1500));

    console.log('Datos guardados con éxito en Firebase Firestore:', this.config);
    
    this.guardando = false;
  }
}
