import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import {
  Firestore,
  collection,
  collectionData,
  doc,
  updateDoc
} from '@angular/fire/firestore';

import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class DashboardPage implements OnInit, OnDestroy {

  private firestore = inject(Firestore);
  private router = inject(Router);

  nombreCocinero = 'Juan Moreno';
  mensajeNotificacion = '';
  pedidosRecientes: any[] = [];

  horaActual: string = new Date().toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  private relojInterval: any;
  private pedidosSubscription?: Subscription;
  private notificacionTimeout: any;

  pedidos: any[] = [];
  pedidosFiltrados: any[] = [];

  categoriaSeleccionada: string = 'todos';

  ngOnInit() {
    this.cargarDatos();
    this.iniciarReloj();
  }

  ngOnDestroy() {
    if (this.relojInterval) clearInterval(this.relojInterval);
    if (this.notificacionTimeout) clearTimeout(this.notificacionTimeout);
    if (this.pedidosSubscription) this.pedidosSubscription.unsubscribe();
  }

  iniciarReloj() {
    this.relojInterval = setInterval(() => {
      this.horaActual = new Date().toLocaleTimeString('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    }, 1000);
  }

  cargarDatos() {
    const pedidosRef = collection(this.firestore, 'pedidos');

    this.pedidosSubscription = collectionData(
      pedidosRef,
      { idField: 'id' }
    ).subscribe((data: any[]) => {
      this.pedidos = (data || [])
        .filter(p =>
          p.estado !== 'pagado' &&
          p.estado !== 'anulado' &&
          p.estado !== 'entregado_mesa' &&
          p.estado !== 'cuenta' &&
          p.estado !== 'Liberado Sin Pagar'
        )
        .sort((a, b) => this.obtenerTime(b.fecha) - this.obtenerTime(a.fecha));

      this.asignarNumerosPedidos();
      this.actualizarPedidosRecientes();
      this.filtrarPedidos();
    });
  }

  asignarNumerosPedidos() {
    const pedidosOrdenados = [...this.pedidos]
      .sort((a, b) => this.obtenerTime(a.fecha) - this.obtenerTime(b.fecha));

    pedidosOrdenados.forEach((pedido, index) => {
      pedido.numeroVisual = String(index + 1).padStart(2, '0');
    });
  }

  obtenerNumeroPedido(pedido: any): string {
    if (pedido.numeroVisual) {
      return pedido.numeroVisual;
    }

    const pedidosOrdenados = [...this.pedidos]
      .sort((a, b) => this.obtenerTime(a.fecha) - this.obtenerTime(b.fecha));

    const index = pedidosOrdenados.findIndex(p => p.id === pedido.id);

    return String(index >= 0 ? index + 1 : 1).padStart(2, '0');
  }

  aplicarFiltro(tipo: string) {
    this.categoriaSeleccionada = tipo;
    this.filtrarPedidos();
  }

  filtrarPedidos() {
    if (this.categoriaSeleccionada === 'todos') {
      this.pedidosFiltrados = this.pedidos;
    } else {
      this.pedidosFiltrados = this.pedidos.filter(
        p => p.estado === this.categoriaSeleccionada
      );
    }
  }

  actualizarPedidosRecientes() {
    this.pedidosRecientes = this.pedidos
      .filter(p => p.estado === 'listo')
      .slice(0, 5);
  }

  mostrarNotificacion(mensaje: string) {
    this.mensajeNotificacion = mensaje;

    if (this.notificacionTimeout) {
      clearTimeout(this.notificacionTimeout);
    }

    this.notificacionTimeout = setTimeout(() => {
      this.mensajeNotificacion = '';
    }, 5000);
  }

  get totalNuevos(): number {
    return this.pedidos.filter(p => p.estado === 'pendiente_cocina').length;
  }

  get totalEnCocina(): number {
    return this.pedidos.filter(p => p.estado === 'preparando').length;
  }

  get totalListos(): number {
    return this.pedidos.filter(p => p.estado === 'listo').length;
  }

  async cambiarEstado(pedido: any) {
    let nuevoEstado = '';

    if (pedido.estado === 'pendiente_cocina') {
      nuevoEstado = 'preparando';
    } else if (pedido.estado === 'preparando') {
      nuevoEstado = 'listo';
    } else if (pedido.estado === 'listo') {
      nuevoEstado = 'entregado_mesa';
    }

    if (!nuevoEstado) return;

    try {
      const docRef = doc(this.firestore, 'pedidos', pedido.id);
      const numeroPedido = this.obtenerNumeroPedido(pedido);

      await updateDoc(docRef, {
        estado: nuevoEstado,
        numeroPedido: numeroPedido,
        cocinero: this.nombreCocinero,
        fechaActualizacion: new Date()
      });

      if (nuevoEstado === 'listo') {
        this.mostrarNotificacion(
          `✅ Pedido #${numeroPedido} listo para recoger - Mesa ${pedido.mesa}`
        );

        this.agregarPedidoReciente({
          ...pedido,
          estado: 'listo',
          numeroPedido: numeroPedido,
          cocinero: this.nombreCocinero
        });

        if (pedido.idMesa) {
          const mesaRef = doc(this.firestore, 'mesas', pedido.idMesa);

          await updateDoc(mesaRef, {
            estado: 'listo',
            mesero: pedido.mesero || 'Mesero',
            cocinero: this.nombreCocinero,
            numeroPedido: numeroPedido,
            pedidoListo: true,
            notificacionMesero: true,
            mensajeCocina: `Pedido #${numeroPedido} listo para recoger en Mesa ${pedido.mesa}`,
            fechaPedidoListo: new Date()
          });
        }
      }

      if (nuevoEstado === 'entregado_mesa') {
        if (pedido.idMesa) {
          const mesaRef = doc(this.firestore, 'mesas', pedido.idMesa);

          await updateDoc(mesaRef, {
            estado: 'cuenta',
            mesero: pedido.mesero || 'Mesero',
            cocinero: this.nombreCocinero,
            numeroPedido: numeroPedido,
            pedidoListo: false,
            notificacionMesero: false,
            fechaEntregadoMesa: new Date()
          });
        }

        await updateDoc(docRef, {
          estado: 'cuenta',
          numeroPedido: numeroPedido,
          fechaEntregadoMesa: new Date()
        });
      }

    } catch (error) {
      console.error('Error cambiando estado del pedido:', error);
      alert('No se pudo actualizar el pedido.');
    }
  }

  agregarPedidoReciente(pedido: any) {
    this.pedidosRecientes = [
      pedido,
      ...this.pedidosRecientes.filter(p => p.id !== pedido.id)
    ].slice(0, 5);
  }

  getCardClass(estado: string): string {
    if (estado === 'pendiente_cocina') return 'borde-nuevo';
    if (estado === 'preparando') return 'borde-preparando';
    return 'borde-listo';
  }

  getBadgeLabel(estado: string): string {
    if (estado === 'pendiente_cocina') return '🔥 Nuevo';
    if (estado === 'preparando') return '⏳ Preparando';
    if (estado === 'listo') return '✅ Listo';
    if (estado === 'entregado_mesa') return '🍽️ Entregado';
    if (estado === 'cuenta') return '💵 En cuenta';
    return '📌 Pedido';
  }

  getLabelBtn(estado: string): string {
    if (estado === 'pendiente_cocina') return '🔥 Iniciar';
    if (estado === 'preparando') return '✔ Marcar Listo';
    if (estado === 'listo') return '🚀 Entregado';
    return 'Procesar';
  }

  getColorBtn(estado: string): string {
    if (estado === 'pendiente_cocina') return 'iniciar';
    if (estado === 'preparando') return 'listo';
    return 'entregado';
  }

  obtenerTime(fecha: any): number {
    if (!fecha) return 0;

    if (fecha.seconds) {
      return fecha.seconds * 1000;
    }

    return new Date(fecha).getTime();
  }

  obtenerMinutosTranscurridos(fecha: any): string {
    if (!fecha) return '0 min';

    const creacion = this.obtenerTime(fecha);
    const ahora = new Date().getTime();
    const diferenciaMinutos = Math.floor((ahora - creacion) / 60000);

    return `${diferenciaMinutos > 0 ? diferenciaMinutos : 0} min`;
  }

  salir() {
    console.log('Saliendo del Panel de Cocina...');
    this.router.navigate(['/select-role']);
  }
}