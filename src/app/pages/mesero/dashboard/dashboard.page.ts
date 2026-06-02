import { Component, OnInit, inject } from '@angular/core';
import { NavController } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Firestore, collection, query, where, onSnapshot, doc, updateDoc } from '@angular/fire/firestore';

import {
  IonContent,
  IonIcon
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { 
  peopleOutline, timeOutline, logOutOutline, cartOutline,
  addOutline, removeOutline, trashOutline, paperPlaneOutline,
  receiptOutline, checkmarkCircleOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-dashboard-mesero',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonIcon
  ]
})
export class DashboardPage implements OnInit {

  mesasDisponibles = 0;
  mesasOcupadas = 0;
  mesasCuenta = 0; 

  mesas: any[] = [];
  mesaSeleccionada: any = null;
  carrito: any[] = [];

  categorias: any[] = [];
  productosBD: any[] = []; 
  productosFiltrados: any[] = []; 
  categoriaActiva: string = '';

  private firestore = inject(Firestore);

  constructor(private navCtrl: NavController) {
    addIcons({
      peopleOutline, timeOutline, logOutOutline, cartOutline, 
      addOutline, removeOutline, trashOutline, paperPlaneOutline,
      receiptOutline, checkmarkCircleOutline
    });
  }

  ngOnInit() {
    this.cargarMesas();
    this.cargarCategorias();
    this.cargarProductos();
  }

  cargarMesas() {
    const mesasRef = collection(this.firestore, 'mesas');
    
    onSnapshot(mesasRef, (snapshot) => {
      // 1. Aquí está la corrección para TypeScript (as any)
      this.mesas = snapshot.docs.map(doc => {
        const data = doc.data() as any;
        return { id: doc.id, ...data };
      });

      // 2. Ordenamos asegurando que a y b sean any
      this.mesas.sort((a: any, b: any) => a.numero - b.numero);
      
      this.calcularEstadisticas();

      if (this.mesaSeleccionada) {
        const mesaActualizada = this.mesas.find(m => m.id === this.mesaSeleccionada.id);
        if (mesaActualizada && mesaActualizada.estado === 'libre' && this.mesaSeleccionada.estado !== 'libre') {
           this.mesaSeleccionada = null;
           this.carrito = [];
        } else {
           this.mesaSeleccionada = mesaActualizada || null;
        }
      }
    });
  }

  calcularEstadisticas() {
    this.mesasDisponibles = this.mesas.filter(m => m.estado === 'libre').length;
    this.mesasOcupadas = this.mesas.filter(m => m.estado === 'activa').length;
    this.mesasCuenta = this.mesas.filter(m => m.estado === 'cuenta').length;
  }

  cargarCategorias() {
    const categoriasRef = collection(this.firestore, 'categorias');
    onSnapshot(categoriasRef, (snapshot) => {
      // Aplicamos la corrección aquí también por seguridad
      this.categorias = snapshot.docs.map(doc => {
        const data = doc.data() as any;
        return { id: doc.id, ...data };
      });

      if (this.categorias.length > 0 && !this.categoriaActiva) {
        this.categoriaActiva = this.categorias[0].id;
        this.filtrarProductos();
      }
    });
  }

  cargarProductos() {
    const q = query(collection(this.firestore, 'productos'), where('estado', '==', true));
    onSnapshot(q, (snapshot) => {
      // Y también corregimos los productos
      this.productosBD = snapshot.docs.map(doc => {
        const data = doc.data() as any;
        return { id: doc.id, ...data };
      });
      this.filtrarProductos();
    });
  }

  cambiarCategoria(categoriaId: string) {
    this.categoriaActiva = categoriaId;
    this.filtrarProductos();
  }

  filtrarProductos() {
    this.productosFiltrados = this.productosBD.filter(prod => prod.categoria_id === this.categoriaActiva);
  }

  seleccionarMesa(mesa: any) {
    this.mesaSeleccionada = mesa;
    this.carrito = mesa.pedido || []; 
  }

  agregarAlCarrito(producto: any) {
    if (!this.mesaSeleccionada) {
      alert('Por favor, selecciona una mesa primero.');
      return;
    }
    const index = this.carrito.findIndex(item => item.producto.id === producto.id);
    if (index > -1) {
      this.carrito[index].cantidad++;
    } else {
      this.carrito.push({ producto: producto, cantidad: 1 });
    }
  }

  aumentarCantidad(index: number) { this.carrito[index].cantidad++; }
  
  disminuirCantidad(index: number) {
    if(this.carrito[index].cantidad > 1) { this.carrito[index].cantidad--; } 
    else { this.eliminarDelCarrito(index); }
  }

  eliminarDelCarrito(index: number) { this.carrito.splice(index, 1); }

  calcularTotal() {
    return this.carrito.reduce((total, item) => total + (item.producto.precio * item.cantidad), 0);
  }
  
  async enviarCocina() {
    if (this.carrito.length === 0) {
      alert('No hay productos en el carrito para enviar.');
      return;
    }
    try {
      const mesaRef = doc(this.firestore, 'mesas', this.mesaSeleccionada.id);
      await updateDoc(mesaRef, {
        estado: 'activa',
        pedido: this.carrito,
        total: this.calcularTotal()
      });
      alert(`Pedido enviado a cocina correctamente.`);
    } catch (error) {
      console.error("Error al enviar a cocina:", error);
    }
  }

  async pedirCuenta() {
    if (!this.mesaSeleccionada || this.mesaSeleccionada.estado === 'libre') {
      alert('La mesa debe tener un pedido activo para pedir la cuenta.');
      return;
    }
    try {
      const mesaRef = doc(this.firestore, 'mesas', this.mesaSeleccionada.id);
      await updateDoc(mesaRef, {
        estado: 'cuenta'
      });
      alert(`Notificando a Caja. En breve el cajero realizará el cobro.`);
    } catch (error) {
      console.error("Error al pedir cuenta:", error);
    }
  }

  async liberarMesa() {
    if (!this.mesaSeleccionada) return;
    const confirmar = confirm(`¿Estás seguro de liberar la Mesa ${this.mesaSeleccionada.numero}? Si el cliente no ha pagado, usa el botón "Cuenta" en su lugar.`);
    
    if (confirmar) {
      try {
        const mesaRef = doc(this.firestore, 'mesas', this.mesaSeleccionada.id);
        await updateDoc(mesaRef, {
          estado: 'libre',
          pedido: [],
          total: 0
        });
      } catch (error) {
        console.error("Error al liberar mesa:", error);
      }
    }
  }

  salir() {
    this.navCtrl.navigateBack('/select-role'); 
  }
}