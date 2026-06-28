import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Notificacion {
  id: number;
  tipo: 'info' | 'success' | 'warning' | 'error';
  titulo: string;
  mensaje: string;
  fecha: Date;
  leida: boolean;
  destino?: 'admin' | 'cajero' | 'mesero' | 'cocina' | 'todos';
  data?: any;
}

@Injectable({
  providedIn: 'root',
})
export class Notificaciones {

  private notificaciones = new BehaviorSubject<Notificacion[]>([]);

  constructor() {}

  getNotificaciones() {
    return this.notificaciones.asObservable();
  }

  getActuales() {
    return this.notificaciones.value;
  }

  agregar(notificacion: Omit<Notificacion, 'id' | 'fecha' | 'leida'>) {
    const nueva: Notificacion = {
      id: Date.now(),
      fecha: new Date(),
      leida: false,
      ...notificacion
    };

    this.notificaciones.next([
      nueva,
      ...this.notificaciones.value
    ]);
  }

  pedidoListo(mesa: string, pedidoId?: string) {
    this.agregar({
      tipo: 'success',
      titulo: 'Pedido listo',
      mensaje: `El pedido de la mesa ${mesa} está listo para recoger.`,
      destino: 'mesero',
      data: { mesa, pedidoId }
    });
  }

  cuentaSolicitada(mesa: string) {
    this.agregar({
      tipo: 'warning',
      titulo: 'Cuenta solicitada',
      mensaje: `La mesa ${mesa} está esperando cobro.`,
      destino: 'cajero',
      data: { mesa }
    });
  }

  pagoRealizado(mesa: string) {
    this.agregar({
      tipo: 'success',
      titulo: 'Pago realizado',
      mensaje: `La mesa ${mesa} fue pagada y liberada.`,
      destino: 'admin',
      data: { mesa }
    });
  }

  stockBajo(producto: string, cantidad: number) {
    this.agregar({
      tipo: 'warning',
      titulo: 'Stock bajo',
      mensaje: `${producto} tiene stock bajo: ${cantidad} unidades.`,
      destino: 'admin',
      data: { producto, cantidad }
    });
  }

  marcarComoLeida(id: number) {
    const actualizadas = this.notificaciones.value.map(n =>
      n.id === id
        ? { ...n, leida: true }
        : n
    );

    this.notificaciones.next(actualizadas);
  }

  eliminar(id: number) {
    this.notificaciones.next(
      this.notificaciones.value.filter(n => n.id !== id)
    );
  }

  limpiar() {
    this.notificaciones.next([]);
  }

  getNoLeidas() {
    return this.notificaciones.value.filter(n => !n.leida);
  }
}