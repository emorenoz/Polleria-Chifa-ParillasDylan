import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Reportes {

  constructor() {}

  // 💰 Total de ventas
  calcularTotalVentas(ventas: any[]): number {
    return ventas.reduce(
      (sum, v) => sum + (Number(v.total) || 0),
      0
    );
  }

  // 📅 Ventas del día
  ventasHoy(ventas: any[]) {
    const hoy = new Date().toDateString();

    return ventas.filter(v => {
      if (!v.fecha) return false;

      const fecha =
        v.fecha?.seconds
          ? new Date(v.fecha.seconds * 1000)
          : new Date(v.fecha);

      return fecha.toDateString() === hoy;
    });
  }

  // 📅 Ventas del mes
  ventasMes(ventas: any[]) {
    const hoy = new Date();

    return ventas.filter(v => {
      if (!v.fecha) return false;

      const fecha =
        v.fecha?.seconds
          ? new Date(v.fecha.seconds * 1000)
          : new Date(v.fecha);

      return (
        fecha.getMonth() === hoy.getMonth() &&
        fecha.getFullYear() === hoy.getFullYear()
      );
    });
  }

  // 🧾 Total de pedidos
  totalPedidos(pedidos: any[]): number {
    return pedidos.length;
  }

  // 📦 Pedidos por estado
  pedidosPorEstado(pedidos: any[]) {
    return {
      pendiente_cocina: pedidos.filter(
        p => p.estado === 'pendiente_cocina'
      ).length,

      preparando: pedidos.filter(
        p => p.estado === 'preparando'
      ).length,

      listo: pedidos.filter(
        p => p.estado === 'listo'
      ).length,

      entregado_mesa: pedidos.filter(
        p => p.estado === 'entregado_mesa'
      ).length,

      cuenta: pedidos.filter(
        p => p.estado === 'cuenta'
      ).length,

      pagado: pedidos.filter(
        p => p.estado === 'pagado'
      ).length,

      anulado: pedidos.filter(
        p => p.estado === 'anulado'
      ).length
    };
  }

  // 🍗 Producto más vendido
  productoMasVendido(ventas: any[]) {
    const contador: any = {};

    ventas.forEach(v => {
      (v.items || []).forEach((item: any) => {
        const nombre =
          item.nombre ||
          item.producto?.nombre;

        contador[nombre] =
          (contador[nombre] || 0) +
          (item.cantidad || 0);
      });
    });

    let producto = '';
    let cantidad = 0;

    for (const key in contador) {
      if (contador[key] > cantidad) {
        producto = key;
        cantidad = contador[key];
      }
    }

    return {
      producto,
      cantidad
    };
  }
}