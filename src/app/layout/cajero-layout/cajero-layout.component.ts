import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonIcon,
  IonMenu,
  IonMenuToggle,
  IonRouterOutlet,
  IonSplitPane,
  IonTabBar,
  IonTabButton,
  IonLabel
} from '@ionic/angular/standalone';

import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { addIcons } from 'ionicons';
import {
  gridOutline,
  cashOutline,
  receiptOutline,
  timeOutline,
  logOutOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-cajero-layout',
  templateUrl: './cajero-layout.component.html',
  styleUrls: ['./cajero-layout.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    IonContent,
    IonIcon,
    IonMenu,
    IonMenuToggle,
    IonRouterOutlet,
    IonSplitPane,
    IonTabBar,
    IonTabButton,
    IonLabel
  ]
})
export class CajeroLayoutComponent {

  private router = inject(Router);

  nombreCajero =
    localStorage.getItem('usuarioNombre') || 'Cajero';

  opciones = [
    {
      titulo: 'Inicio',
      ruta: '/cajero/dashboard',
      icono: 'grid-outline'
    },
    {
      titulo: 'Comprobantes',
      ruta: '/cajero/comprobantes',
      icono: 'receipt-outline'
    },
    {
      titulo: 'Historial',
      ruta: '/cajero/historial',
      icono: 'time-outline'
    }
  ];

  constructor() {
    addIcons({
      gridOutline,
      cashOutline,
      receiptOutline,
      timeOutline,
      logOutOutline
    });
  }

  cerrarSesion(): void {
    localStorage.removeItem('usuarioId');
    localStorage.removeItem('usuarioNombre');
    localStorage.removeItem('usuarioRol');
    localStorage.removeItem('sesionOperativa');

    this.router.navigate(['/select-role'], {
      replaceUrl: true
    });
  }
}