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
  appsOutline, cartOutline, archiveOutline, gridOutline, cubeOutline,
  clipboardOutline, settingsOutline, peopleOutline, personCircleOutline,
  barChartOutline, logOutOutline, chevronBackOutline, chevronForwardOutline
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
    IonHeader,      // <--- IMPORTANTE: Agregado
    IonContent, 
    IonList, 
    IonItem, 
    IonIcon, 
    IonLabel, 
    IonBadge, 
    IonFooter, 
    IonRouterOutlet,
    IonMenuButton,  // <--- IMPORTANTE: Agregado
    IonButtons,     // <--- IMPORTANTE: Agregado
    IonToolbar      // <--- IMPORTANTE: Agregado
  ]
})
export class AdminLayoutComponent {
  isCollapsed: boolean = false;

  constructor(private router: Router, private menuCtrl: MenuController) {
    addIcons({
      appsOutline, cartOutline, archiveOutline, gridOutline, cubeOutline,
      clipboardOutline, settingsOutline, peopleOutline, personCircleOutline,
      barChartOutline, logOutOutline, chevronBackOutline, chevronForwardOutline
    });
  }

  async toggleSidebar() {
    const isMobile = window.innerWidth < 992;
    if (isMobile) {
      await this.menuCtrl.close();
    } else {
      this.isCollapsed = !this.isCollapsed;
    }
  }

  cerrarSesion() {
    this.router.navigate(['/select-role']);
  }
}