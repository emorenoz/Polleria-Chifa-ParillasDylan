import { Component, inject } from '@angular/core';
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

import {
  Firestore,
  collection,
  addDoc,
  getDocs,
  query,
  where
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

  async login() {
    const usuarioIngresado = this.usuario.trim().toLowerCase();
    const passwordIngresado = this.password.trim();

    if (!usuarioIngresado || !passwordIngresado) {
      alert('Ingresa usuario y contraseña');
      return;
    }

    try {
      const usuariosRef = collection(this.firestore, 'usuarios');

      const consulta = query(
        usuariosRef,
        where('email', '==', usuarioIngresado),
        where('password', '==', passwordIngresado),
        where('rol', '==', 'caja'),
        where('estadoActivo', '==', true)
      );

      const snapshot = await getDocs(consulta);

      if (snapshot.empty) {
        alert('Credenciales incorrectas');
        return;
      }

      const usuarioDoc = snapshot.docs[0];
      const data: any = usuarioDoc.data();

      await addDoc(
        collection(this.firestore, 'login_cajero'),
        {
          idUsuario: usuarioDoc.id,
          usuario: data.email,
          nombre: data.nombre,
          rol: data.rol,
          mensaje: 'Login exitoso',
          fecha: new Date()
        }
      );

      localStorage.setItem('usuarioId', usuarioDoc.id);
      localStorage.setItem('usuarioNombre', data.nombre);
      localStorage.setItem('usuarioRol', data.rol);

      this.router.navigate(['/cajero-dashboard']);

    } catch (error) {
      console.error('❌ Error login cajero:', error);
      alert('Error al iniciar sesión');
    }
  }
}