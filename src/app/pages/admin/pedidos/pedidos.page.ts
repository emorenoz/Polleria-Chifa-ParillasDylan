import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonToolbar, IonButtons, IonMenuButton, IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { searchOutline, funnelOutline, syncOutline, printOutline, eyeOutline } from 'ionicons/icons';

@Component({
  selector: 'app-pedidos',
  templateUrl: './pedidos.page.html',
  styleUrls: ['./pedidos.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonHeader, IonToolbar, IonButtons, IonMenuButton, IonIcon
  ],
  providers: [DatePipe]
})
export class PedidosPage implements OnInit {

  fechaActual: string = '';
  totalPendientes: number = 0; totalCocina: number = 0; totalEntregados: number = 0; totalAnulados: number = 0; montoTotalGlobal: number = 0;

  listaPedidos: any[] = [
    { id: '#1031', mesa: 'Mesa 1', mesero: 'Carlos', items: 3, total: 28.00, estado: 'entregado', hora: '11:02' },
    { id: '#1032', mesa: 'Mesa 4', mesero: 'Ana', items: 5, total: 67.50, estado: 'entregado', hora: '11:18' },
    { id: '#1033', mesa: 'Mesa 7', mesero: 'Carlos', items: 2, total: 22.00, estado: 'entregado', hora: '11:35' },
    { id: '#1034', mesa: 'Mesa 9', mesero: 'Pedro', items: 4, total: 45.00, estado: 'entregado', hora: '11:50' },
    { id: '#1035', mesa: 'Mesa 2', mesero: 'Ana', items: 1, total: 12.50, estado: 'anulado', hora: '12:00' },
    { id: '#1036', mesa: 'Mesa 6', mesero: 'Pedro', items: 6, total: 89.00, estado: 'entregado', hora: '12:05' },
    { id: '#1037', mesa: 'Mesa 10', mesero: 'Carlos', items: 3, total: 36.50, estado: 'entregado', hora: '12:10' },
    { id: '#1038', mesa: 'Mesa 3', mesero: 'Ana', items: 2, total: 24.00, estado: 'entregado', hora: '12:14' },
    { id: '#1044', mesa: 'Mesa 1', mesero: 'Luis', items: 2, total: 40.00, estado: 'pendiente', hora: '12:45' },
    { id: '#1045', mesa: 'Mesa 8', mesero: 'Luis', items: 4, total: 70.00, estado: 'cocina', hora: '12:50' }
  ];

  constructor(private datePipe: DatePipe) {
    addIcons({ searchOutline, funnelOutline, syncOutline, printOutline, eyeOutline });
  }

  ngOnInit() {
    this.configurarFecha();
    this.calcularMetricas();
  }

  configurarFecha() {
    const hoy = new Date();
    this.fechaActual = this.datePipe.transform(hoy, 'EEEE, d \'de\' MMMM \'de\' yyyy', '', 'es-PE') || '';
  }

  calcularMetricas() {
    this.totalPendientes = this.listaPedidos.filter(p => p.estado === 'pendiente').length;
    this.totalCocina = this.listaPedidos.filter(p => p.estado === 'cocina').length;
    this.totalEntregados = this.listaPedidos.filter(p => p.estado === 'entregado').length;
    this.totalAnulados = this.listaPedidos.filter(p => p.estado === 'anulado').length;
    this.montoTotalGlobal = this.listaPedidos.reduce((acc, pedido) => acc + pedido.total, 0);
  }

  filtrarPedidos() {}
  actualizarDatos() {}
  verDetallePedido(id: string) { console.log('Detalle:', id); }
}