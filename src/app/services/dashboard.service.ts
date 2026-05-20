import { Injectable } from '@angular/core';
import { PedidoService } from './pedido.service';
import { VentaService } from './venta.service';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  constructor(
    private pedidoService: PedidoService,
    private ventaService: VentaService
  ) {}

  // 📊 TOTAL PEDIDOS
  totalPedidos() {
    return this.pedidoService.getPedidos().pipe(
      map(p => p.length)
    );
  }

  // 💰 TOTAL VENTAS
  totalVentas() {
    return this.ventaService.getVentas().pipe(
      map(v => v.reduce((sum, x) => sum + (x.total || 0), 0))
    );
  }

  // 📦 PEDIDOS POR ESTADO
  pedidosPorEstado() {
    return this.pedidoService.getPedidos().pipe(
      map(p => ({
        pendientes: p.filter(x => x.estado === 'pendiente').length,
        enProceso: p.filter(x => x.estado === 'en proceso').length,
        entregados: p.filter(x => x.estado === 'entregado').length
      }))
    );
  }

  // 📅 VENTAS HOY
  ventasHoy() {
    const hoy = new Date().toDateString();

    return this.ventaService.getVentas().pipe(
      map(v => v.filter(x => new Date(x.fecha).toDateString() === hoy))
    );
  }
}