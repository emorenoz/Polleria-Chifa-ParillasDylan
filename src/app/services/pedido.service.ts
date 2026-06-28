import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PedidoService {

  private pedidos = new BehaviorSubject<any[]>([]);

  constructor() {}

  // 📄 LISTAR PEDIDOS
  getPedidos() {
    return this.pedidos.asObservable();
  }

  // 📋 OBTENER PEDIDOS ACTUALES
  getPedidosActuales() {
    return this.pedidos.value;
  }

  // ➕ CREAR PEDIDO
  crearPedido(pedido: any) {
    const actual = this.pedidos.value;

    const nuevoPedido = {
      id: pedido.id || Date.now(),
      mesa: pedido.mesa || '',
      productos: pedido.productos || pedido.items || [],
      total: Number(pedido.total) || 0,
      mesero: pedido.mesero || '',
      fecha: pedido.fecha || new Date(),
      estado: pedido.estado || 'pendiente_cocina'
    };

    this.pedidos.next([...actual, nuevoPedido]);

    console.log('Pedido agregado:', nuevoPedido);
  }

  // ✏️ ACTUALIZAR ESTADO
  actualizarEstado(id: number, estado: string) {
    const updated = this.pedidos.value.map(p =>
      p.id === id
        ? { ...p, estado }
        : p
    );

    this.pedidos.next(updated);
  }

  // 🔍 BUSCAR PEDIDO
  obtenerPedido(id: number) {
    return this.pedidos.value.find(p => p.id === id);
  }

  // ❌ ELIMINAR PEDIDO
  eliminarPedido(id: number) {
    this.pedidos.next(
      this.pedidos.value.filter(p => p.id !== id)
    );
  }

  // 🚫 ANULAR PEDIDO (recomendado)
  anularPedido(id: number) {
    const updated = this.pedidos.value.map(p =>
      p.id === id
        ? { ...p, estado: 'anulado' }
        : p
    );

    this.pedidos.next(updated);
  }

  // 🧹 LIMPIAR TODO
  limpiarPedidos() {
    this.pedidos.next([]);
  }
}