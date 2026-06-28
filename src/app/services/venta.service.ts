import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Venta {
  id?: number;
  mesa?: string;
  idMesa?: string;
  items?: any[];
  subtotal?: number;
  descuento?: number;
  total: number;
  metodoPago?: 'Efectivo' | 'Yape' | 'Plin' | 'Tarjeta';
  fecha?: any;
  mesero?: string;
  estado?: 'pagado' | 'anulado';
}

@Injectable({
  providedIn: 'root'
})
export class VentaService {

  private ventas = new BehaviorSubject<Venta[]>([]);

  constructor() {}

  getVentas() {
    return this.ventas.asObservable();
  }

  getVentasActuales() {
    return this.ventas.value;
  }

  registrarVenta(venta: Venta) {
    const nuevaVenta: Venta = {
      id: venta.id || Date.now(),
      mesa: venta.mesa || '',
      idMesa: venta.idMesa || '',
      items: venta.items || [],
      subtotal: Number(venta.subtotal) || Number(venta.total) || 0,
      descuento: Number(venta.descuento) || 0,
      total: Number(venta.total) || 0,
      metodoPago: venta.metodoPago || 'Efectivo',
      fecha: venta.fecha || new Date(),
      mesero: venta.mesero || '',
      estado: venta.estado || 'pagado'
    };

    this.ventas.next([...this.ventas.value, nuevaVenta]);
  }

  anularVenta(id: number) {
    const ventasActualizadas = this.ventas.value.map(v =>
      v.id === id
        ? { ...v, estado: 'anulado' as const }
        : v
    );

    this.ventas.next(ventasActualizadas);
  }

  getTotalVentas() {
    return this.ventas.value
      .filter(v => v.estado !== 'anulado')
      .reduce((sum, v) => sum + (Number(v.total) || 0), 0);
  }

  getVentasHoy() {
    const hoy = new Date().toDateString();

    return this.ventas.value.filter(v => {
      if (!v.fecha) return false;

      const fecha =
        v.fecha?.seconds
          ? new Date(v.fecha.seconds * 1000)
          : new Date(v.fecha);

      return fecha.toDateString() === hoy && v.estado !== 'anulado';
    });
  }

  limpiarVentas() {
    this.ventas.next([]);
  }
}