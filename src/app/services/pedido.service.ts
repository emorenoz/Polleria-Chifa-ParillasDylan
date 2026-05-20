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

  // ➕ CREAR PEDIDO (Actualizado para respetar el estado que le mandas)
  crearPedido(pedido: any) {
    const actual = this.pedidos.value;

    pedido.id = Date.now();

    // Si desde el componente ya definiste pedido.estado (ej: 'Activo'), lo conserva.
    // Si no viene ningún estado, por defecto le pone 'pendiente'.
    pedido.estado = pedido.estado || 'pendiente';

    this.pedidos.next([...actual, pedido]);
    console.log('Pedido agregado al servicio reactivo:', pedido);
  }

  // ✏️ ACTUALIZAR ESTADO
  actualizarEstado(id: number, estado: string) {
    const actual = this.pedidos.value;

    const updated = actual.map(p => {
      if (p.id === id) {
        return { ...p, estado };
      }
      return p;
    });

    this.pedidos.next(updated);
  }

  // ❌ ELIMINAR PEDIDO
  eliminarPedido(id: number) {
    const actual = this.pedidos.value;
    this.pedidos.next(actual.filter(p => p.id !== id));
  }
}