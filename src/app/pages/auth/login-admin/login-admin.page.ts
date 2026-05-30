import { Component, inject } from '@angular/core';

import { CommonModule } from '@angular/common';
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
import { personOutline, lockClosedOutline } from 'ionicons/icons';

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

  // Inyectamos la base de datos de manera segura y compatible con Angular
  private firestore = inject(Firestore);

  constructor(private router: Router) {
    addIcons({
      personOutline,
      lockClosedOutline
    });

   
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