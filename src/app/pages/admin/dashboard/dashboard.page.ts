import { Component, OnInit, OnDestroy, AfterViewInit, LOCALE_ID, inject } from '@angular/core';
import { CommonModule, DatePipe, registerLocaleData } from '@angular/common';
import localeEsPe from '@angular/common/locales/es-PE';

import {
  IonContent, IonHeader, IonToolbar, IonButtons, IonMenuButton, IonIcon,
  IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardSubtitle,
  IonCardTitle, IonCardContent, IonBadge, IonList, IonItem, IonLabel
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { trendingUpOutline, cartOutline, gridOutline, peopleOutline, timeOutline } from 'ionicons/icons';

import {
  Firestore,
  collection,
  collectionData
} from '@angular/fire/firestore';

import { Subscription } from 'rxjs';

import Chart from 'chart.js/auto';

registerLocaleData(localeEsPe);

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent, IonHeader, IonToolbar, IonButtons, IonMenuButton, IonIcon,
    IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardSubtitle,
    IonCardTitle, IonCardContent, IonBadge, IonList, IonItem, IonLabel
  ],
  providers: [
    DatePipe,
    { provide: LOCALE_ID, useValue: 'es-PE' }
  ]
})
export class DashboardPage implements OnInit, AfterViewInit, OnDestroy {

  fechaActual: string = '';

  ventasDia: number = 0;
  pedidosHoy: number = 0;
  ventasCrecimiento: number = 0;

  pedidosActivos: number = 0;
  pedidosCocina: number = 0;
  pedidosPendientes: number = 0;
  pedidosCrecimiento: number = 0;

  mesasOcupadas: number = 0;
  mesasTotales: number = 0;
  mesasEsperandoCuenta: number = 0;
  mesasCrecimiento: number = 0;

  clientesHoy: number = 0;
  clientesNuevos: number = 0;
  clientesCrecimiento: number = 0;

  ultimosPedidos: any[] = [];

  private firestore = inject(Firestore);

  private subPedidos?: Subscription;
  private subVentas?: Subscription;
  private subClientes?: Subscription;
  private subMesas?: Subscription;

  private ventasLineChart?: Chart;
  private categoriaDoughnutChart?: Chart;

  private ventasGlobales: any[] = [];

  constructor(private datePipe: DatePipe) {
    addIcons({ trendingUpOutline, cartOutline, gridOutline, peopleOutline, timeOutline });
  }

  ngOnInit() {
    this.configurarFecha();
    this.cargarDashboardFirebase();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.inicializarGraficos();
    }, 300);
  }

  configurarFecha() {
    const hoy = new Date();
    this.fechaActual =
      this.datePipe.transform(hoy, "EEEE, d 'de' MMMM 'de' yyyy", '', 'es-PE') || 'Hoy';
  }

  cargarDashboardFirebase() {
    const pedidosRef = collection(this.firestore, 'pedidos');

    this.subPedidos = collectionData(pedidosRef, { idField: 'id' }).subscribe((pedidos: any[]) => {
      const hoy = new Date().toDateString();

      const pedidosDeHoy = pedidos.filter(p => {
        const fechaPedido = this.convertirFecha(p.fecha);
        return p.fecha && fechaPedido.toDateString() === hoy;
      });

      this.pedidosHoy = pedidosDeHoy.length;

      this.pedidosPendientes = pedidos.filter(p => p.estado === 'pendiente_cocina').length;
      this.pedidosCocina = pedidos.filter(p => p.estado === 'preparando').length;

      this.pedidosActivos = pedidos.filter(p =>
        ['pendiente_cocina', 'preparando', 'listo', 'entregado_mesa', 'cuenta'].includes(p.estado)
      ).length;

      this.ultimosPedidos = pedidos
        .slice(-5)
        .reverse()
        .map(p => ({
          id: p.id || '---',
          mesa: p.mesa || '-',
          descripcion: (p.productos || p.items || [])
            .map((x: any) => x.nombre || x.producto || 'Producto')
            .join(' + '),
          total: Number(p.total) || 0,
          estado: p.estado || 'pendiente_cocina',
          hora: this.obtenerHoraPedido(p.fecha)
        }));

      this.pedidosCrecimiento = this.pedidosActivos;
      this.actualizarGraficoCategorias(pedidos);
    });

    const ventasRef = collection(this.firestore, 'ventas');

    this.subVentas = collectionData(ventasRef, { idField: 'id' }).subscribe((ventas: any[]) => {
      this.ventasGlobales = ventas;

      const hoy = new Date().toDateString();

      const ventasDeHoy = ventas.filter(v => {
        const fechaVenta = this.convertirFecha(v.fecha);
        return v.fecha && fechaVenta.toDateString() === hoy;
      });

      this.ventasDia = ventasDeHoy.reduce(
        (acc, v) => acc + (Number(v.total) || 0),
        0
      );

      this.ventasCrecimiento = ventasDeHoy.length;

      this.actualizarGraficoVentas7Dias(ventas);
    });

    const clientesRef = collection(this.firestore, 'clientes');

    this.subClientes = collectionData(clientesRef, { idField: 'id' }).subscribe((clientes: any[]) => {
      this.clientesHoy = clientes.length;
      this.clientesNuevos = clientes.slice(-5).length;
      this.clientesCrecimiento = this.clientesNuevos;
    });

    const mesasRef = collection(this.firestore, 'mesas');

    this.subMesas = collectionData(mesasRef, { idField: 'id' }).subscribe((mesas: any[]) => {
      this.mesasTotales = mesas.length;
      this.mesasOcupadas = mesas.filter(m => m.estado === 'activa' || m.estado === 'listo').length;
      this.mesasEsperandoCuenta = mesas.filter(m => m.estado === 'cuenta').length;
      this.mesasCrecimiento = this.mesasOcupadas;
    });
  }

  inicializarGraficos() {
    const canvasVentas = document.getElementById('ventasLineChart') as HTMLCanvasElement;
    const canvasCategorias = document.getElementById('categoriaDoughnutChart') as HTMLCanvasElement;

    if (canvasVentas) {
      this.ventasLineChart = new Chart(canvasVentas, {
        type: 'line',
        data: {
          labels: this.obtenerLabelsUltimos7Dias(),
          datasets: [
            {
              label: 'Ventas S/',
              data: [0, 0, 0, 0, 0, 0, 0],
              tension: 0.35,
              fill: true
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    }

    if (canvasCategorias) {
      this.categoriaDoughnutChart = new Chart(canvasCategorias, {
        type: 'doughnut',
        data: {
          labels: ['Pollos', 'Chifa', 'Bebidas', 'Parrillas', 'Criollos', 'Otros'],
          datasets: [
            {
              data: [0, 0, 0, 0, 0, 0]
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    }

    if (this.ventasGlobales.length > 0) {
      this.actualizarGraficoVentas7Dias(this.ventasGlobales);
    }
  }

  actualizarGraficoVentas7Dias(ventas: any[]) {
    if (!this.ventasLineChart) return;

    const dias = this.obtenerFechasUltimos7Dias();

    const totales = dias.map(dia => {
      return ventas
        .filter(v => {
          const fechaVenta = this.convertirFecha(v.fecha);
          return v.fecha && fechaVenta.toDateString() === dia.toDateString();
        })
        .reduce((acc, v) => acc + (Number(v.total) || 0), 0);
    });

    this.ventasLineChart.data.labels = this.obtenerLabelsUltimos7Dias();
    this.ventasLineChart.data.datasets[0].data = totales;
    this.ventasLineChart.update();
  }

  actualizarGraficoCategorias(pedidos: any[]) {
    if (!this.categoriaDoughnutChart) return;

    const categorias = {
      pollos: 0,
      chifa: 0,
      bebidas: 0,
      parrillas: 0,
      criollos: 0,
      otros: 0
    };

    pedidos.forEach(pedido => {
      const productos = pedido.productos || pedido.items || [];

      productos.forEach((prod: any) => {
        const nombre = String(prod.nombre || prod.producto || '').toLowerCase();

        if (nombre.includes('pollo') || nombre.includes('brasa')) categorias.pollos++;
        else if (nombre.includes('chaufa') || nombre.includes('chifa') || nombre.includes('sopa')) categorias.chifa++;
        else if (nombre.includes('inka') || nombre.includes('cola') || nombre.includes('bebida') || nombre.includes('gaseosa')) categorias.bebidas++;
        else if (nombre.includes('parrilla') || nombre.includes('anticucho') || nombre.includes('churrasco')) categorias.parrillas++;
        else if (nombre.includes('lomo') || nombre.includes('criollo') || nombre.includes('saltado')) categorias.criollos++;
        else categorias.otros++;
      });
    });

    this.categoriaDoughnutChart.data.datasets[0].data = [
      categorias.pollos,
      categorias.chifa,
      categorias.bebidas,
      categorias.parrillas,
      categorias.criollos,
      categorias.otros
    ];

    this.categoriaDoughnutChart.update();
  }

  obtenerFechasUltimos7Dias(): Date[] {
    const dias: Date[] = [];

    for (let i = 6; i >= 0; i--) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - i);
      fecha.setHours(0, 0, 0, 0);
      dias.push(fecha);
    }

    return dias;
  }

  obtenerLabelsUltimos7Dias(): string[] {
    return this.obtenerFechasUltimos7Dias().map(fecha =>
      fecha.toLocaleDateString('es-PE', {
        weekday: 'short',
        day: '2-digit'
      })
    );
  }

  convertirFecha(fecha: any): Date {
    if (!fecha) return new Date(0);

    if (fecha?.seconds) {
      return new Date(fecha.seconds * 1000);
    }

    return new Date(fecha);
  }

  obtenerHoraPedido(fecha: any): string {
    if (!fecha) return '--:--';

    const fechaConvertida = this.convertirFecha(fecha);

    return fechaConvertida.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  ngOnDestroy() {
    this.subPedidos?.unsubscribe();
    this.subVentas?.unsubscribe();
    this.subClientes?.unsubscribe();
    this.subMesas?.unsubscribe();

    this.ventasLineChart?.destroy();
    this.categoriaDoughnutChart?.destroy();
  }
}