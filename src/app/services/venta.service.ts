import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VentaService {

  private ventas = new BehaviorSubject<any[]>([]);

  constructor() {}

  // 💰 LISTAR VENTAS
  getVentas() {
    return this.ventas.asObservable();
  }

  // ➕ REGISTRAR VENTA
  registrarVenta(venta: any) {

    const actual = this.ventas.value;

    venta.id = Date.now();
    venta.fecha = new Date();

    this.ventas.next([...actual, venta]);
  }
}