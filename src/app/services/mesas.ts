import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Mesas {

  private mesas = new BehaviorSubject<any[]>([]);

  constructor() {}

  getMesas() {
    return this.mesas.asObservable();
  }

  getMesasActuales() {
    return this.mesas.value;
  }

  cargarMesas(mesas: any[]) {
    this.mesas.next(mesas);
  }

  actualizarMesa(id: string, datos: any) {
    const actualizadas = this.mesas.value.map(m =>
      m.id === id
        ? { ...m, ...datos }
        : m
    );

    this.mesas.next(actualizadas);
  }

  cambiarEstado(
    id: string,
    estado: 'libre' | 'activa' | 'listo' | 'cuenta' | 'pagado'
  ) {
    const actualizadas = this.mesas.value.map(m =>
      m.id === id
        ? { ...m, estado }
        : m
    );

    this.mesas.next(actualizadas);
  }

  liberarMesa(id: string) {
    const actualizadas = this.mesas.value.map(m =>
      m.id === id
        ? {
            ...m,
            estado: 'libre',
            pedido: [],
            total: 0,
            mesero: null
          }
        : m
    );

    this.mesas.next(actualizadas);
  }

  obtenerMesa(id: string) {
    return this.mesas.value.find(m => m.id === id);
  }
}