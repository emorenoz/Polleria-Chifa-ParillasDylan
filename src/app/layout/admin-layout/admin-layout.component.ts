import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { 
  IonApp, IonSplitPane, IonMenu, IonHeader, IonContent, IonList, 
  IonItem, IonIcon, IonLabel, IonBadge, IonFooter, IonRouterOutlet,
  IonMenuButton, IonButtons, IonToolbar, MenuController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  appsOutline, cartOutline, walletOutline, gridOutline, cubeOutline,
  pricetagOutline, archiveOutline, peopleOutline, personAddOutline,
  barChartOutline, settingsOutline, logOutOutline, chevronBackOutline,
  chevronForwardOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    IonApp, 
    IonSplitPane, 
    IonMenu, 
    IonHeader,
    IonContent, 
    IonList, 
    IonItem, 
    IonIcon, 
    IonLabel, 
    IonBadge, 
    IonFooter, 
    IonRouterOutlet,
    IonMenuButton,
    IonButtons,
    IonToolbar
  ]
})
export class AdminLayoutComponent {
  isCollapsed: boolean = false;

  constructor(private router: Router, private menuCtrl: MenuController) {
    // Registramos TODOS los iconos que usamos en el menú
    addIcons({
      appsOutline, cartOutline, walletOutline, gridOutline, cubeOutline,
      pricetagOutline, archiveOutline, peopleOutline, personAddOutline,
      barChartOutline, settingsOutline, logOutOutline, chevronBackOutline,
      chevronForwardOutline
    });
  }

  async toggleSidebar() {
    const isMobile = window.innerWidth < 992;
    if (isMobile) {
      // En celulares el menú se cierra por completo (overlay)
      await this.menuCtrl.close();
    } else {
      // En escritorio se colapsa / expande
      this.isCollapsed = !this.isCollapsed;
    }
  }

  cerrarSesion() {
    this.router.navigate(['/select-role']);
  }
}