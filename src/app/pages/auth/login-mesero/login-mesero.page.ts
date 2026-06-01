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
  selector: 'app-login-mesero',
  templateUrl: './login-mesero.page.html',
  styleUrls: ['./login-mesero.page.scss'],
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
export class LoginMeseroPage {

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

  // Métodos de interacción UI
  togglePassword() {
    this.mostrarPassword = !this.mostrarPassword;
  }

  volver() {
    this.location.back();
  }

  // Lógica original del login de Mesero
  login() {
    if (
      this.usuario === 'mesero' &&
      this.password === '123456'
    ) {
      this.router.navigate(['/mesero-dashboard']);
    } else {
      alert('Credenciales incorrectas');
    }
  }
}