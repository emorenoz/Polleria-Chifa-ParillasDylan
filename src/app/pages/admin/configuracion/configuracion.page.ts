import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButton, 
  IonIcon, IonButtons, IonBackButton, IonSegment, 
  IonSegmentButton, IonLabel 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { save, arrowBack } from 'ionicons/icons';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-configuracion',
  templateUrl: './configuracion.page.html',
  styleUrls: ['./configuracion.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonHeader, IonTitle, 
    IonToolbar, IonButton, IonIcon, IonButtons, IonBackButton, 
    IonSegment, IonSegmentButton, IonLabel
  ]
})
export class ConfiguracionPage implements OnInit {
  private firestore = inject(Firestore);
  config = { ruc: '', nombreEmpresa: '', telefono: '', direccion: '', moneda: 'PEN' };
  guardando: boolean = false;

  constructor() { addIcons({ save, arrowBack }); }

  async ngOnInit() { await this.cargarConfiguracionFirebase(); }

  async cargarConfiguracionFirebase() {
    try {
      const ref = doc(this.firestore, 'configuracion', 'empresa');
      const snap = await getDoc(ref);
      if (snap.exists()) this.config = snap.data() as any;
    } catch (error) { console.error('Error:', error); }
  }

  async guardarConfiguracion() {
    if (!this.config.nombreEmpresa.trim()) return;
    this.guardando = true;
    try {
      await setDoc(doc(this.firestore, 'configuracion', 'empresa'), this.config);
    } catch (error) { console.error('Error:', error); }
    this.guardando = false;
  }
}