import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import {
  IonContent,
  IonCard,
  IonIcon
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';

import {
  shieldCheckmarkOutline,
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
      shieldCheckmarkOutline,
      cashOutline,
      restaurantOutline,
      flameOutline
    });
  }

  irAdmin(): void {
    this.limpiarSesionOperativa();
    this.router.navigate(['/login-admin']);
  }

  irCajero(): void {
    this.limpiarSesionOperativa();
    this.router.navigate(['/login-cajero']);
  }

  irMesero(): void {
    this.limpiarSesionOperativa();
    this.router.navigate(['/seleccionar-mesero']);
  }

  irCocina(): void {
    this.limpiarSesionOperativa();
    this.router.navigate(['/seleccionar-cocina']);
  }

  private limpiarSesionOperativa(): void {
    localStorage.removeItem('usuarioId');
    localStorage.removeItem('usuarioNombre');
    localStorage.removeItem('usuarioRol');
    localStorage.removeItem('sesionOperativa');
  }
}