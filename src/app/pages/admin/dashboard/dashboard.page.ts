import { Component, OnInit, LOCALE_ID } from '@angular/core'; // 1. Importamos LOCALE_ID para la fecha en español
import { CommonModule, DatePipe, registerLocaleData } from '@angular/common';
import localeEsPe from '@angular/common/locales/es-PE'; // Registrar el idioma de Perú

// Importamos de manera estricta todos los componentes estructurales que de seguro usas en tu diseño
import {
  IonContent, IonHeader, IonToolbar, IonButtons, IonMenuButton, IonIcon,
  IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCardContent,
  IonBadge, IonList, IonItem, IonLabel
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trendingUpOutline, cartOutline, gridOutline, peopleOutline, timeOutline } from 'ionicons/icons';

// Registramos de forma nativa el formato de fecha para que el DatePipe no falle nunca
registerLocaleData(localeEsPe);

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  // 2. Agregamos todos los componentes visuales al arreglo de imports
  imports: [
    CommonModule,
    IonContent, IonHeader, IonToolbar, IonButtons, IonMenuButton, IonIcon,
    IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCardContent,
    IonBadge, IonList, IonItem, IonLabel
  ],
  providers: [
    DatePipe,
    { provide: LOCALE_ID, useValue: 'es-PE' } // Forzar el sistema a usar es-PE
  ]
})
export class DashboardPage implements OnInit {

  fechaActual: string = '';
  ventasDia: number = 0; pedidosHoy: number = 0; ventasCrecimiento: number = 0;
  pedidosActivos: number = 0; pedidosCocina: number = 0; pedidosPendientes: number = 0; pedidosCrecimiento: number = 0;
  mesasOcupadas: number = 0; mesasTotales: number = 0; mesasEsperandoCuenta: number = 0; mesasCrecimiento: number = 0;
  clientesHoy: number = 0; clientesNuevos: number = 0; clientesCrecimiento: number = 0;
  ultimosPedidos: any[] = [];

  constructor(private datePipe: DatePipe) {
    addIcons({ trendingUpOutline, cartOutline, gridOutline, peopleOutline, timeOutline });
  }

  ngOnInit() {
    this.configurarFecha();
    this.cargarDashboardFirebase();
  }

  configurarFecha() {
    const hoy = new Date();
    // Al haber registrado el idioma arriba, esto ya funcionará perfectamente en frío
    this.fechaActual = this.datePipe.transform(hoy, "EEEE, d 'de' MMMM 'de' yyyy", '', 'es-PE') || 'Hoy';
  }

  async cargarDashboardFirebase() {
    await new Promise(resolve => setTimeout(resolve, 600));
    this.ventasDia = 1190; this.pedidosHoy = 53; this.ventasCrecimiento = 12;
    this.pedidosActivos = 8; this.pedidosCocina = 3; this.pedidosPendientes = 5; this.pedidosCrecimiento = 3;
    this.mesasOcupadas = 7; this.mesasTotales = 12; this.mesasEsperandoCuenta = 4; this.mesasCrecimiento = 2;
    this.clientesHoy = 142; this.clientesNuevos = 18; this.clientesCrecimiento = 8;

    this.ultimosPedidos = [
      { id: '#1042', mesa: 'Mesa 5', descripcion: '½ Pollo + Papas x2', total: 34, estado: 'entregado', hora: '12:14' },
      { id: '#1043', mesa: 'Mesa 2', descripcion: '¼ Pollo + Gaseosa', total: 16, estado: 'cocina', hora: '12:22' },
      { id: '#1044', mesa: 'Mesa 8', descripcion: 'Pollo Entero + Yucas', total: 44, estado: 'cocina', hora: '12:31' },
      { id: '#1045', mesa: 'Mesa 11', descripcion: 'Alitas x6 + Chicha', total: 22, estado: 'pendiente', hora: '12:38' }
    ];
  }
}