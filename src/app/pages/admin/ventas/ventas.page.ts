import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonIcon,
  IonLabel,
  IonNote,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonButtons,
  IonBackButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cash, create, trash, arrowBack } from 'ionicons/icons';

// 🔥 Importaciones nativas de Angular Fire para Firestore
import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  doc,
  updateDoc,
  deleteDoc
} from '@angular/fire/firestore';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-ventas',
  templateUrl: './ventas.page.html',
  styleUrls: ['./ventas.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonIcon,
    IonLabel,
    IonNote,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonButtons,
    IonBackButton
  ]
})
export class VentasPage implements OnInit, OnDestroy {

  // Modelo reactivo para capturar las entradas del flujo de caja
  nuevaVenta = {
    cliente: '',
    total: null as number | null,
    metodoPago: ''
  };

  editando: boolean = false;
  idVentaEditando: string | null = null;

  // Lista dinámica vinculada directamente con Firestore
  listaVentas: any[] = [];

  // 🔥 Inyectamos la base de datos idéntico a como lo hiciste en tu Login
  private firestore = inject(Firestore);
  private ventasSubscription!: Subscription;

  constructor() {
    addIcons({ cash, create, trash, arrowBack });
  }

  async ngOnInit() {
    await this.cargarVentasFirebase();
  }

  // 🔥 Escucha asíncrona sin filtros para evitar bloqueos de índices
  async cargarVentasFirebase() {
    try {
      const ventasCollection = collection(this.firestore, 'ventas');

      this.ventasSubscription = collectionData(ventasCollection, { idField: 'id' }).subscribe({
        next: (ventas) => {
          console.log("📦 Datos recibidos en tiempo real de Firestore:", ventas);
          this.listaVentas = ventas;
        },
        error: (error) => {
          console.error("❌ Error en lectura de Firebase:", error);
        }
      });
    } catch (err: any) {
      console.error("❌ Error al inicializar la colección:", err);
    }
  }

  // Registra una nueva transacción monetaria o actualiza un comprobante auditado
  async guardarVenta() {
    // Validación de seguridad antes de proceder
    if (!this.nuevaVenta.cliente || !this.nuevaVenta.total || !this.nuevaVenta.metodoPago) {
      alert("Por favor rellena todos los campos.");
      return;
    }

    const ahora = new Date();
    const horaFormateada = `${ahora.getHours().toString().padStart(2, '0')}:${ahora.getMinutes().toString().padStart(2, '0')}`;

    try {
      if (this.editando && this.idVentaEditando !== null) {
        // 🔥 Actualización física del documento existente
        const ventaDocRef = doc(this.firestore, 'ventas', this.idVentaEditando);

        await updateDoc(ventaDocRef, {
          cliente: this.nuevaVenta.cliente,
          total: this.nuevaVenta.total,
          metodoPago: this.nuevaVenta.metodoPago
        });

        console.log('🔥 Venta modificada');
        this.cancelarEdicion();
      } else {
        // 🔥 Estructura de guardado directo en la colección 'ventas', igual que tu login
        const docRef = await addDoc(
          collection(this.firestore, 'ventas'),
          {
            cliente: this.nuevaVenta.cliente,
            total: this.nuevaVenta.total,
            metodoPago: this.nuevaVenta.metodoPago,
            hora: horaFormateada,
            fecha: ahora
          }
        );

        console.log('🔥 Venta registrada');
        console.log('ID Documento:', docRef.id);
      }

      this.limpiarFormulario();

    } catch (error: any) {
      console.error('❌ Error Firebase:', error);
      alert('Error Firebase:\n\n' + JSON.stringify(error, null, 2));
    }
  }

  // Pasa los datos de la boleta seleccionada al formulario para re-auditar el cobro
  seleccionarVenta(venta: any) {
    this.editando = true;
    this.idVentaEditando = venta.id;
    this.nuevaVenta = {
      cliente: venta.cliente,
      total: venta.total,
      metodoPago: venta.metodoPago
    };
  }

  cancelarEdicion() {
    this.editando = false;
    this.idVentaEditando = null;
    this.limpiarFormulario();
  }

  // 🔥 Eliminación de registros por ID único de Firebase
  async eliminarVenta(id: string) {
    try {
      const ventaDocRef = doc(this.firestore, 'ventas', id);
      await deleteDoc(ventaDocRef);
      console.log('🔥 Venta eliminada con ID:', id);
    } catch (error: any) {
      console.error('❌ Error al eliminar en Firebase:', error);
    }
  }

  limpiarFormulario() {
    this.nuevaVenta = {
      cliente: '',
      total: null,
      metodoPago: ''
    };
  }

  // Liberación obligatoria de memoria para componentes Standalone
  ngOnDestroy() {
    if (this.ventasSubscription) {
      this.ventasSubscription.unsubscribe();
    }
  }
}