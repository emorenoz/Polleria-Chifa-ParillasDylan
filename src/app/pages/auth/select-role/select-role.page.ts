import { Component } from '@angular/core';

import {
  IonContent,
  IonCard,
  IonIcon
} from '@ionic/angular/standalone';

import { CommonModule } from '@angular/common';

import { Router } from '@angular/router';

import { addIcons } from 'ionicons';

import {
  settingsOutline,
  cashOutline,
  restaurantOutline,
  flameOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-select-role',
  templateUrl: './select-role.page.html',
  styleUrls: ['./select-role.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonCard,
    IonIcon
  ]
})

export class SelectRolePage {

  constructor(private router: Router) {

    addIcons({
      settingsOutline,
      cashOutline,
      restaurantOutline,
      flameOutline
    });

  }

 irAdmin() {
  this.router.navigate(['/login-admin']);
}

irCajero() {
  this.router.navigate(['/login-cajero']);
}

irMesero() {
  this.router.navigate(['/mesero-dashboard']);
}

irCocina() {
  this.router.navigate(['/cocina-dashboard']);
}
}