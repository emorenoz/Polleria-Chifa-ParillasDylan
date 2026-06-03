import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Firestore, collection, collectionData, doc, updateDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class DashboardPage implements OnInit {
  private firestore = inject(Firestore);
  pedidos: any[] = [];
  pedidosFiltrados: any[] = [];
  categoriaSeleccionada: string = 'Todos';

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    const pedidosRef = collection(this.firestore, 'pedidos');
    collectionData(pedidosRef, { idField: 'id' }).subscribe((data: any[]) => {
      this.pedidos = data.map(p => ({
        ...p,
        // Corrección del error [object Object]
        clienteNombre: typeof p.cliente === 'object' ? p.cliente.nombre : p.cliente
      }));
      this.filtrarPedidos();
    });
  }

  filtrarPedidos() {
    this.pedidosFiltrados = this.categoriaSeleccionada === 'Todos' 
      ? this.pedidos 
      : this.pedidos.filter(p => p.estado === this.categoriaSeleccionada);
  }

  async cambiarEstado(pedido: any) {
    const nuevoEstado = pedido.estado === 'Nuevo' ? 'Preparando' : 'Listo';
    await updateDoc(doc(this.firestore, 'pedidos', pedido.id), { estado: nuevoEstado });
  }

  getColorBtn(estado: string): string {
    return estado === 'Nuevo' ? 'warning' : 'success';
  }

  getLabelBtn(estado: string): string {
    return estado === 'Nuevo' ? '🔥 Iniciar' : '✅ Marcar Listo';
  }

  salir() {
    console.log('Saliendo...');
  }
}