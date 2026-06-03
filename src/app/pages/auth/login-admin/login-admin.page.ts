import { Component, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
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
  mostrarPassword = false;

  private firestore = inject(Firestore);

  constructor(
    private router: Router,
    private location: Location
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

  togglePassword() {
    this.mostrarPassword = !this.mostrarPassword;
  }

  volver() {
    this.location.back();
  }

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

        console.log('🔥 Login registrado. ID:', docRef.id);

      } catch (error: any) {

        console.error('❌ Error Firebase:', error);

      }

      console.log('✅ LOGIN CORRECTO');

      window.location.href = '/admin/dashboard';

    } else {

      alert('Usuario o contraseña incorrectos');

    }
  }
}