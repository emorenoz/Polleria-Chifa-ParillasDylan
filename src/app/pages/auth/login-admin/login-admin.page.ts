import { Component } from '@angular/core';

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

import {
  personOutline,
  lockClosedOutline
} from 'ionicons/icons';

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

  constructor(private router: Router) {

    addIcons({
      personOutline,
      lockClosedOutline
    });

  }

  login() {

    if (
      this.usuario === 'admin' &&
      this.password === '1234567'
    ) {

      this.router.navigate(['/admin-dashboard']);

    } else {

      alert('Usuario o contraseña incorrectos');

    }

  }

}