import { Component } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  IonContent,
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

// 🔥 FIREBASE
import { inject } from '@angular/core';
import {
  Firestore,
  collection,
  addDoc
} from '@angular/fire/firestore';

@Component({
  selector: 'app-login-cajero',
  templateUrl: './login-cajero.page.html',
  styleUrls: ['./login-cajero.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
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
export class LoginCajeroPage {

  private firestore = inject(Firestore);

  usuario = '';
  password = '';
  mostrarPassword = false;

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

  // 🔥 LOGIN + REGISTRO EN FIREBASE (SIN CAMBIAR TU LÓGICA)
  async login() {

    if (
      this.usuario === 'cajero' &&
      this.password === '123456'
    ) {

      try {

        await addDoc(
          collection(this.firestore, 'login_cajero'),
          {
            usuario: this.usuario,
            rol: 'cajero',
            mensaje: 'Login exitoso',
            fecha: new Date()
          }
        );

        console.log('🔥 Login cajero registrado en Firebase');

      } catch (error) {
        console.error('❌ Error Firebase login cajero:', error);
      }

      this.router.navigate(['/cajero-dashboard']);

    } else {
      alert('Credenciales incorrectas');
    }

  }
}