import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Stock {

  private stock = new BehaviorSubject<any[]>([]);

  constructor() {}

  getStock() {
    return this.stock.asObservable();
  }

  getStockActual() {
    return this.stock.value;
  }

  agregarProducto(producto: any) {
    this.stock.next([
      ...this.stock.value,
      producto
    ]);
  }

  actualizarStock(id: string, cantidad: number) {
    const actualizado = this.stock.value.map(p =>
      p.id === id
        ? { ...p, stock: cantidad }
        : p
    );

    this.stock.next(actualizado);
  }

  descontarStock(id: string, cantidad: number) {
    const actualizado = this.stock.value.map(p => {
      if (p.id === id) {
        const nuevoStock = (p.stock || 0) - cantidad;

        return {
          ...p,
          stock: nuevoStock < 0 ? 0 : nuevoStock
        };
      }

      return p;
    });

    this.stock.next(actualizado);
  }

  eliminarProducto(id: string) {
    this.stock.next(
      this.stock.value.filter(p => p.id !== id)
    );
  }
}