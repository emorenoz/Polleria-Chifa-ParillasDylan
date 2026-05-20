import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  IonContent,
  IonItem,
  IonInput,
  IonButton
} from '@ionic/angular/standalone';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonItem,
    IonInput,
    IonButton
  ]
})
export class LoginPage implements OnInit {

  usuario = '';
  password = '';
  errorMensaje = '';

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {}

  ingresar(): void {

    const ok = this.authService.login(this.usuario, this.password);

    if (ok) {
      this.errorMensaje = '';
      this.router.navigateByUrl('/tabs/inicio');
    } else {
      this.errorMensaje = 'Usuario o contraseña incorrectos';
    }
  }
}