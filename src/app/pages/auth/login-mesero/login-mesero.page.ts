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

  constructor(private router: Router) {

    addIcons({
      personOutline,
      lockClosedOutline
    });

  }

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