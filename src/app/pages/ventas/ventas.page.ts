import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
// Cambiamos drumstickOutline por restaurantOutline
import { restaurantOutline, cashOutline, cartOutline, trendingUpOutline, peopleOutline } from 'ionicons/icons';

import { VentaService } from '../../services/venta.service';

@Component({
  selector: 'app-ventas',
  templateUrl: './ventas.page.html',
  styleUrls: ['./ventas.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardContent
  ]
})
export class VentasPage {

  constructor(private ventaService: VentaService) {
    addIcons({
      'restaurant-outline': restaurantOutline, // Ajustado aquí también
      'cash-outline': cashOutline,
      'cart-outline': cartOutline,
      'trending-up-outline': trendingUpOutline,
      'people-outline': peopleOutline
    });
  }

}