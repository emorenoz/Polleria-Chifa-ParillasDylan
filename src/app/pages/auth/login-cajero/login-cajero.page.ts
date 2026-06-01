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

  // Métodos para la interfaz gráfica
  togglePassword() {
    this.mostrarPassword = !this.mostrarPassword;
  }

  volver() {
    this.location.back();
  }

  // Lógica original del login de Cajero
  login() {
    if (
      this.usuario === 'cajero' &&
      this.password === '123456'
    ) {
      this.router.navigate(['/cajero-dashboard']);
    } else {
      alert('Credenciales incorrectas');
    }
  }
}