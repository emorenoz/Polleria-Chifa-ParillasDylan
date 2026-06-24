import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Firestore, collection, collectionData, doc, updateDoc } from '@angular/fire/firestore';
import { Observable, Subscription } from 'rxjs';
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

  // Control de filtros superiores ('todos' | 'enviado_cocina' | 'preparando' | 'listo')
  categoriaSeleccionada: string = 'todos';

  ngOnInit() {
    this.cargarDatos();
    this.iniciarReloj();
  }

  ngOnDestroy() {
    // Limpieza de subscripciones y temporizadores activos al destruir la pantalla
    if (this.relojInterval) clearInterval(this.relojInterval);
    if (this.pedidosSubscription) this.pedidosSubscription.unsubscribe();
  }

  iniciarReloj() {
    this.relojInterval = setInterval(() => {
      this.horaActual = new Date().toLocaleTimeString();
    }, 1000);
  }

  // ================= CONEXIÓN CON FIREBASE EN TIEMPO REAL =================
  cargarDatos() {
    // Apuntamos a la colección unificada 'pedidos_cocina'
    const pedidosRef = collection(this.firestore, 'pedidos_cocina');

    // Sincronización mediante canales reactivos nativos de Firestore
    this.pedidosSubscription = collectionData(pedidosRef, { idField: 'id' }).subscribe((data: any[]) => {
      // Sincronizamos y barremos de la vista los pedidos que el mesero ya retiró de cocina ('entregado')
      this.pedidos = data.filter(p => p.estado !== 'entregado');
      this.filtrarPedidos();
    });
  }

  // Cambiar el filtro activo desde el submenú superior
  aplicarFiltro(tipo: string) {
    this.categoriaSeleccionada = tipo;
    this.filtrarPedidos();
  }

  filtrarPedidos() {
    if (this.categoriaSeleccionada === 'todos') {
      this.pedidosFiltrados = this.pedidos;
    } else {
      // Se eliminó la línea redundante/errónea que causaba bugs de asignación estática
      this.pedidosFiltrados = this.pedidos.filter(p => p.estado === this.categoriaSeleccionada);
    }
  }

  // ================= METODOS CONTADORES PARA LOS BADGES =================
  get totalNuevos(): number {
    return this.pedidos.filter(p => p.estado === 'enviado_cocina').length;
  }
  get totalEnCocina(): number {
    return this.pedidos.filter(p => p.estado === 'preparando').length;
  }
  get totalListos(): number {
    return this.pedidos.filter(p => p.estado === 'listo').length;
  }

  // ================= ACCIONES DE LAS TARJETAS (ACTUALIZACIÓN EN BD) =================
  async cambiarEstado(pedido: any) {
    let nuevoEstado = '';

    // Avanza de forma secuencial según el flujo de estados lógicos establecidos
    if (pedido.estado === 'enviado_cocina') nuevoEstado = 'preparando';
    else if (pedido.estado === 'preparando') nuevoEstado = 'listo';
    else if (pedido.estado === 'listo') nuevoEstado = 'entregado';

    if (nuevoEstado) {
      // 1. Apunta al documento específico mediante su ID único en la cocina e inyecta la actualización
      const docRef = doc(this.firestore, 'pedidos_cocina', pedido.id);
      await updateDoc(docRef, { estado: nuevoEstado });

      // 🚀 CONEXIÓN DE FLUJO DIRECTO CON EL CAJERO:
      // Cuando el cocinero le dé clic a "Entregado", modificamos el estado de la mesa en el salón a 'cuenta'
      if (nuevoEstado === 'entregado' && pedido.idMesa) {
        try {
          const mesaRef = doc(this.firestore, 'mesas', pedido.idMesa);

          await updateDoc(mesaRef, {
            estado: 'cuenta',
            mesero: pedido.mesero || 'Mesero'
          });

          console.log(`Mesa ${pedido.mesa} enviada automáticamente a Caja.`);
        } catch (error) {
          console.error("Error al enviar los datos de la mesa a Caja:", error);
        }
      }
    }
  }

  // ================= FORMATOS DINÁMICOS PARA TU INTERFAZ =================
  getCardClass(estado: string): string {
    if (estado === 'enviado_cocina') return 'borde-nuevo';
    if (estado === 'preparando') return 'borde-preparando';
    return 'borde-listo';
  }

  getBadgeLabel(estado: string): string {
    if (estado === 'enviado_cocina') return '🔥 Nuevo';
    if (estado === 'preparando') return '⏳ Preparando';
    return '✅ Listo';
  }

  getLabelBtn(estado: string): string {
    if (estado === 'enviado_cocina') return '🔥 Iniciar';
    if (estado === 'preparando') return '✔ Marcar Listo';
    return '🚀 Entregado';
  }

  getColorBtn(estado: string): string {
    if (estado === 'enviado_cocina') return 'iniciar';
    if (estado === 'preparando') return 'listo';
    return 'entregado';
  }

  obtenerMinutosTranscurridos(fechaIso: string): string {
    if (!fechaIso) return '0 min';
    const creacion = new Date(fechaIso).getTime();
    const ahora = new Date().getTime();
    const diferenciaMinutos = Math.floor((ahora - creacion) / 60000);
    return `${diferenciaMinutos > 0 ? diferenciaMinutos : 0} min`;
  }

  // Navegación nativa hacia el selector de roles
  salir() {
    console.log('Saliendo del Panel de Cocina...');
    this.router.navigate(['/select-role']);
  }
}