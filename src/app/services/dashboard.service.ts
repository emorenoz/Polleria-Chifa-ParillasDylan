import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';

import { PedidoService } from './pedido.service';
import { VentaService } from './venta.service';

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
      map(pedidos => pedidos.length)
    );
  }

  // 💰 TOTAL VENTAS
  totalVentas() {
    return this.ventaService.getVentas().pipe(
      map(ventas =>
        ventas.reduce(
          (sum, venta) => sum + (Number(venta.total) || 0),
          0
        )
      )
    );
  }

  // 📦 PEDIDOS POR ESTADO
  pedidosPorEstado() {
    return this.pedidoService.getPedidos().pipe(
      map(pedidos => ({
        pendientes: pedidos.filter(
          p => p.estado === 'pendiente_cocina'
        ).length,

        preparando: pedidos.filter(
          p => p.estado === 'preparando'
        ).length,

        listos: pedidos.filter(
          p => p.estado === 'listo'
        ).length,

        entregados: pedidos.filter(
          p => p.estado === 'entregado_mesa'
        ).length,

        enCuenta: pedidos.filter(
          p => p.estado === 'cuenta'
        ).length,

        pagados: pedidos.filter(
          p => p.estado === 'pagado'
        ).length,

        anulados: pedidos.filter(
          p => p.estado === 'anulado'
        ).length
      }))
    );
  }

  // 📅 VENTAS DEL DÍA
  ventasHoy() {
    const hoy = new Date().toDateString();

    return this.ventaService.getVentas().pipe(
      map(ventas =>
        ventas.filter(v => {
          if (!v.fecha) return false;

          const fecha =
            v.fecha?.seconds
              ? new Date(v.fecha.seconds * 1000)
              : new Date(v.fecha);

          return fecha.toDateString() === hoy;
        })
      )
    );
  }

  // 💵 TOTAL RECAUDADO HOY
  totalVentasHoy() {
    const hoy = new Date().toDateString();

    return this.ventaService.getVentas().pipe(
      map(ventas =>
        ventas
          .filter(v => {
            if (!v.fecha) return false;

            const fecha =
              v.fecha?.seconds
                ? new Date(v.fecha.seconds * 1000)
                : new Date(v.fecha);

            return fecha.toDateString() === hoy;
          })
          .reduce(
            (sum, venta) =>
              sum + (Number(venta.total) || 0),
            0
          )
      )
    );
  }
}