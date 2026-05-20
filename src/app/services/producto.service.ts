import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {

  private productos = new BehaviorSubject<any[]>([
    { id: 1, nombre: 'Pollo a la brasa', precio: 50 },
    { id: 2, nombre: 'Chaufa', precio: 25 },
    { id: 3, nombre: 'Gaseosa', precio: 5 }
  ]);

  constructor() {}

  // 📄 LISTAR PRODUCTOS
  getProductos() {
    return this.productos.asObservable();
  }

  // ➕ AGREGAR PRODUCTO
  agregarProducto(producto: any) {

    const actual = this.productos.value;

    producto.id = Date.now();

    this.productos.next([...actual, producto]);
  }

  // ❌ ELIMINAR PRODUCTO
  eliminarProducto(id: number) {

    const actual = this.productos.value;

    this.productos.next(actual.filter(p => p.id !== id));
  }
}