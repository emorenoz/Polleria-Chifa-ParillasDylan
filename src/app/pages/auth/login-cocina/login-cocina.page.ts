import { Component } from '@angular/core';

import { CommonModule } from '@angular/common';
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
  lockClosedOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-login-cocina',
  templateUrl: './login-cocina.page.html',
  styleUrls: ['./login-cocina.page.scss'],
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

export class LoginCocinaPage {

  usuario = '';
  password = '';

  constructor(private router: Router) {

    addIcons({
      personOutline,
      lockClosedOutline
    });

  }

  login() {

    if (
      this.usuario === 'cocina' &&
      this.password === '123456'
    ) {

      this.router.navigate(['/cocina-dashboard']);

    } else {

      alert('Credenciales incorrectas');

    }

  }

}