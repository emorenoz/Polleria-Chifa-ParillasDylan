import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
  IonButton,
  IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  cashOutline,
  cubeOutline,
  trendingUpOutline,
  alertCircleOutline,
  addOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.page.html',
  styleUrls: ['./inicio.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardContent,
    IonButton,
    IonIcon
  ]
})
export class InicioPage {

  constructor() {
    addIcons({
      'cash-outline': cashOutline,
      'cube-outline': cubeOutline,
      'trending-up-outline': trendingUpOutline,
      'alert-circle-outline': alertCircleOutline,
      'add-outline': addOutline
    });
  }
}