import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Producto {
  id?: number;
  nombre: string;
  precio: number;
  stock?: number;
  categoriaId?: string;
  descripcion?: string;
  activo?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProductoService {

  private productos = new BehaviorSubject<Producto[]>([
    {
      id: 1,
      nombre: 'Pollo a la brasa',
      precio: 50,
      stock: 20,
      categoriaId: 'pollos',
      activo: true
    },
    {
      id: 2,
      nombre: 'Chaufa',
      precio: 25,
      stock: 30,
      categoriaId: 'chifa',
      activo: true
    },
    {
      id: 3,
      nombre: 'Gaseosa',
      precio: 5,
      stock: 100,
      categoriaId: 'bebidas',
      activo: true
    }
  ]);

  constructor() {}

  // 📄 LISTAR PRODUCTOS
  getProductos() {
    return this.productos.asObservable();
  }

  // 📋 PRODUCTOS ACTUALES
  getProductosActuales() {
    return this.productos.value;
  }

  // 🔍 BUSCAR PRODUCTO
  obtenerProducto(id: number) {
    return this.productos.value.find(
      p => p.id === id
    );
  }

  // ➕ AGREGAR PRODUCTO
  agregarProducto(producto: Producto) {
    const nuevoProducto: Producto = {
      id: Date.now(),
      nombre: producto.nombre,
      precio: Number(producto.precio),
      stock: Number(producto.stock) || 0,
      categoriaId: producto.categoriaId || 'otros',
      descripcion: producto.descripcion || '',
      activo: true
    };

    this.productos.next([
      ...this.productos.value,
      nuevoProducto
    ]);
  }

  // ✏️ ACTUALIZAR PRODUCTO
  actualizarProducto(id: number, datos: Partial<Producto>) {
    const actualizados = this.productos.value.map(p =>
      p.id === id
        ? { ...p, ...datos }
        : p
    );

    this.productos.next(actualizados);
  }

  // 📦 ACTUALIZAR STOCK
  actualizarStock(id: number, cantidad: number) {
    const actualizados = this.productos.value.map(p =>
      p.id === id
        ? {
            ...p,
            stock: cantidad < 0 ? 0 : cantidad
          }
        : p
    );

    this.productos.next(actualizados);
  }

  // 📉 DESCONTAR STOCK
  descontarStock(id: number, cantidad: number) {
    const actualizados = this.productos.value.map(p => {
      if (p.id === id) {
        const nuevoStock = (p.stock || 0) - cantidad;

        return {
          ...p,
          stock: nuevoStock < 0 ? 0 : nuevoStock
        };
      }

      return p;
    });

    this.productos.next(actualizados);
  }

  // 🚫 DESACTIVAR PRODUCTO
  desactivarProducto(id: number) {
    const actualizados = this.productos.value.map(p =>
      p.id === id
        ? {
            ...p,
            activo: false
          }
        : p
    );

    this.productos.next(actualizados);
  }

  // ❌ ELIMINAR PRODUCTO
  eliminarProducto(id: number) {
    this.productos.next(
      this.productos.value.filter(
        p => p.id !== id
      )
    );
  }
}