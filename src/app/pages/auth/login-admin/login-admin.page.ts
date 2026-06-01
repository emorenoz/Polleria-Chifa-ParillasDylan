import { Component, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common'; // Agregamos Location
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonInput,
  IonButton,
  IonIcon
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
// Nuevos íconos según el diseño de Figma
import { 
  personOutline, 
  lockClosedOutline, 
  arrowBackOutline, 
  shieldCheckmarkOutline, 
  eyeOutline, 
  eyeOffOutline 
} from 'ionicons/icons';

import { Firestore, collection, addDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-login-admin',
  templateUrl: './login-admin.page.html',
  styleUrls: ['./login-admin.page.scss'],
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
    IonItem,
    IonInput,
    IonButton,
    IonIcon
  ]
})
export class LoginAdminPage {

  usuario = '';
  password = '';
  mostrarPassword = false; // Control para el ojito de la contraseña

  private firestore = inject(Firestore);

  constructor(
    private router: Router,
    private location: Location // Inyectamos Location para el botón Volver
  ) {
    addIcons({
      personOutline,
      lockClosedOutline,
      arrowBackOutline,
      shieldCheckmarkOutline,
      eyeOutline,
      eyeOffOutline
    });
  }

  // --- Lógica de Figma (Interfaz) ---
  togglePassword() {
    this.mostrarPassword = !this.mostrarPassword;
  }

  volver() {
    // Esto te regresará a la página anterior (por ejemplo, al menú de selección de roles)
    this.location.back(); 
  }

  // --- Tu Lógica de Firebase (Intacta) ---
  async login() {
    if (
      this.usuario === 'admin' &&
      this.password === '1234567'
    ) {
      try {
        const docRef = await addDoc(
          collection(this.firestore, 'Login Admin'),
          {
            usuario: this.usuario,
            mensaje: 'Login exitoso',
            fecha: new Date()
          }
        );

        console.log('🔥 Login registrado');
        console.log('ID Documento:', docRef.id);

      } catch (error: any) {
        console.error('❌ Error Firebase:', error);
        alert(
          'Error Firebase:\n\n' +
          JSON.stringify(error, null, 2)
        );
      }

      this.router.navigate(['/admin-dashboard']);
    } else {
      alert('Usuario o contraseña incorrectos');
    }
  }
}