import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Firestore, collection, collectionData, doc, updateDoc } from '@angular/fire/firestore';
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

  horaActual: string = new Date().toLocaleTimeString();
  private relojInterval: any;
  private pedidosSubscription?: Subscription;

  pedidos: any[] = [];
  pedidosFiltrados: any[] = [];

  categoriaSeleccionada: string = 'todos';

  ngOnInit() {
    this.cargarDatos();
    this.iniciarReloj();
  }

  ngOnDestroy() {
    if (this.relojInterval) clearInterval(this.relojInterval);
    if (this.pedidosSubscription) this.pedidosSubscription.unsubscribe();
  }

  iniciarReloj() {
    this.relojInterval = setInterval(() => {
      this.horaActual = new Date().toLocaleTimeString();
    }, 1000);
  }

  cargarDatos() {
    const pedidosRef = collection(this.firestore, 'pedidos');

    this.pedidosSubscription = collectionData(pedidosRef, { idField: 'id' }).subscribe((data: any[]) => {
      this.pedidos = data.filter(p =>
        p.estado !== 'pagado' &&
        p.estado !== 'anulado' &&
        p.estado !== 'entregado_mesa' &&
        p.estado !== 'cuenta'
      );

      this.filtrarPedidos();
    });
  }

  aplicarFiltro(tipo: string) {
    this.categoriaSeleccionada = tipo;
    this.filtrarPedidos();
  }

  filtrarPedidos() {
    if (this.categoriaSeleccionada === 'todos') {
      this.pedidosFiltrados = this.pedidos;
    } else {
      this.pedidosFiltrados = this.pedidos.filter(p => p.estado === this.categoriaSeleccionada);
    }
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

    if (pedido.estado === 'pendiente_cocina') nuevoEstado = 'preparando';
    else if (pedido.estado === 'preparando') nuevoEstado = 'listo';
    else if (pedido.estado === 'listo') nuevoEstado = 'entregado_mesa';

    if (nuevoEstado) {
      const docRef = doc(this.firestore, 'pedidos', pedido.id);

      await updateDoc(docRef, {
        estado: nuevoEstado
      });

      if (nuevoEstado === 'listo' && pedido.idMesa) {
        try {
          const mesaRef = doc(this.firestore, 'mesas', pedido.idMesa);

          await updateDoc(mesaRef, {
            estado: 'listo',
            mesero: pedido.mesero || 'Mesero'
          });

          console.log(`Mesa ${pedido.mesa} lista para recoger.`);
        } catch (error) {
          console.error('Error al marcar la mesa como lista:', error);
        }
      }

      if (nuevoEstado === 'entregado_mesa' && pedido.idMesa) {
        try {
          const mesaRef = doc(this.firestore, 'mesas', pedido.idMesa);

          await updateDoc(mesaRef, {
            estado: 'cuenta',
            mesero: pedido.mesero || 'Mesero'
          });

          await updateDoc(docRef, {
            estado: 'cuenta'
          });

          console.log(`Mesa ${pedido.mesa} enviada automáticamente a Caja.`);
        } catch (error) {
          console.error('Error al enviar los datos de la mesa a Caja:', error);
        }
      }
    }
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

  obtenerMinutosTranscurridos(fecha: any): string {
    if (!fecha) return '0 min';

    const creacion = fecha?.seconds
      ? new Date(fecha.seconds * 1000).getTime()
      : new Date(fecha).getTime();

    const ahora = new Date().getTime();
    const diferenciaMinutos = Math.floor((ahora - creacion) / 60000);

    return `${diferenciaMinutos > 0 ? diferenciaMinutos : 0} min`;
  }

  salir() {
    console.log('Saliendo del Panel de Cocina...');
    this.router.navigate(['/select-role']);
  }
}