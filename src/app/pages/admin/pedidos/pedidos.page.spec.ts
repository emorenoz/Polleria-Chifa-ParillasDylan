import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonButtons, IonMenuButton, IonContent, IonIcon 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  searchOutline, funnelOutline, syncOutline, printOutline, eyeOutline 
} from 'ionicons/icons';

@Component({
  selector: 'app-pedidos',
  templateUrl: './pedidos.page.html',
  styleUrls: ['./pedidos.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    IonHeader, 
    IonToolbar, 
    IonButtons, 
    IonMenuButton, 
    IonContent, 
    IonIcon
  ]
})
export class PedidosPage implements OnInit {
  fechaActual: string = '';
  
  // Contadores KPI
  totalPendientes: number = 0;
  totalCocina: number = 0;
  totalEntregados: number = 0;
  totalAnulados: number = 0;
  montoTotalGlobal: number = 0;

  // Lista de Pedidos (Mock Data inicial)
  listaPedidos: any[] = [];

  constructor() {
    // Registramos los iconos que usas en tu HTML
    addIcons({ searchOutline, funnelOutline, syncOutline, printOutline, eyeOutline });
  }

  ngOnInit() {
    this.obtenerFechaActual();
    this.cargarPedidos();
  }

  obtenerFechaActual() {
    const opciones: Intl.DateTimeFormatOptions = { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    };
    let fecha = new Date().toLocaleDateString('es-PE', opciones);
    // Capitalizar la primera letra
    this.fechaActual = fecha.charAt(0).toUpperCase() + fecha.slice(1);
  }

  cargarPedidos() {
    // Aquí posteriormente harás la petición HTTP a tu backend en PHP/MySQL
    // Por ahora, usamos datos de prueba para pintar la interfaz
    this.listaPedidos = [
      { id: '#PED-001', mesa: 'Mesa 4', mesero: 'Carlos R.', items: '1x Pollo Entero, 2x Chicha', total: 85.50, estado: 'entregado', hora: '14:30' },
      { id: '#PED-002', mesa: 'Mesa 12', mesero: 'Ana M.', items: '1/2 Pollo, 1x Inka Kola', total: 42.00, estado: 'cocina', hora: '14:45' },
      { id: '#PED-003', mesa: 'Delivery', mesero: 'App', items: '2x Salchipapa Especial', total: 36.00, estado: 'pendiente', hora: '14:50' },
      { id: '#PED-004', mesa: 'Mesa 2', mesero: 'Carlos R.', items: '1/4 Pollo, 1x Limonada', total: 22.00, estado: 'anulado', hora: '13:15' },
      { id: '#PED-005', mesa: 'Para Llevar', mesero: 'Caja', items: '1x Pollo Entero', total: 70.00, estado: 'entregado', hora: '14:00' }
    ];

    this.calcularKPIs();
  }

  calcularKPIs() {
    // Calculamos las cantidades según el estado
    this.totalPendientes = this.listaPedidos.filter(p => p.estado === 'pendiente').length;
    this.totalCocina = this.listaPedidos.filter(p => p.estado === 'cocina').length;
    this.totalEntregados = this.listaPedidos.filter(p => p.estado === 'entregado').length;
    this.totalAnulados = this.listaPedidos.filter(p => p.estado === 'anulado').length;
    
    // Sumamos el total (excluyendo los anulados)
    this.montoTotalGlobal = this.listaPedidos
      .filter(p => p.estado !== 'anulado')
      .reduce((acc, pedido) => acc + pedido.total, 0);
  }

  filtrarPedidos() {
    console.log('Abriendo panel de filtros...');
  }

  actualizarDatos() {
    console.log('Refrescando la tabla de pedidos...');
    this.cargarPedidos();
  }

  verDetallePedido(id: string) {
    console.log('Mostrando el detalle del pedido:', id);
  }
}