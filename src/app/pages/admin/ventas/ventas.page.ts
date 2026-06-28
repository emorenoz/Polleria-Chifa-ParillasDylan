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

import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  doc,
  updateDoc
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

  private firestore = inject(Firestore);
  private ventasSubscription?: Subscription;

  nuevaVenta = {
    cliente: '',
    total: null as number | null,
    metodoPago: ''
  };

  editando = false;
  idVentaEditando: string | null = null;

  listaVentas: any[] = [];
  totalVentas: number = 0;

  constructor() {
    addIcons({ cash, create, trash, arrowBack });
  }

  ngOnInit() {
    this.cargarVentasFirebase();
  }

  cargarVentasFirebase() {
    const ventasCollection = collection(this.firestore, 'ventas');

    this.ventasSubscription = collectionData(
      ventasCollection,
      { idField: 'id' }
    ).subscribe({
      next: (ventas: any[]) => {
        this.listaVentas = (ventas || [])
          .map(v => ({
            ...v,
            estado: v.estado || 'pagado',
            fechaOrden: this.convertirFecha(v.fecha).getTime(),
            fechaTexto: this.obtenerFechaTexto(v.fecha),
            horaTexto: this.obtenerHoraTexto(v.fecha || v.hora)
          }))
          .sort((a, b) => b.fechaOrden - a.fechaOrden);

        this.totalVentas = this.listaVentas
          .filter(v => v.estado !== 'anulado')
          .reduce((acc, v) => acc + (Number(v.total) || 0), 0);

        console.log('📦 Ventas cargadas:', this.listaVentas);
      },
      error: (error) => {
        console.error('❌ Error Firebase ventas:', error);
      }
    });
  }

  async guardarVenta() {
    if (
      !this.nuevaVenta.cliente ||
      !this.nuevaVenta.total ||
      this.nuevaVenta.total <= 0 ||
      !this.nuevaVenta.metodoPago
    ) {
      alert('Por favor rellena todos los campos correctamente.');
      return;
    }

    const ahora = new Date();

    try {
      if (this.editando && this.idVentaEditando) {
        const ref = doc(this.firestore, 'ventas', this.idVentaEditando);

        await updateDoc(ref, {
          cliente: this.nuevaVenta.cliente,
          total: Number(this.nuevaVenta.total),
          metodoPago: this.nuevaVenta.metodoPago
        });

        this.cancelarEdicion();

      } else {
        await addDoc(collection(this.firestore, 'ventas'), {
          cliente: this.nuevaVenta.cliente,
          total: Number(this.nuevaVenta.total),
          metodoPago: this.nuevaVenta.metodoPago,
          fecha: ahora,
          estado: 'pagado',
          origen: 'admin'
        });
      }

      this.limpiarFormulario();

    } catch (error) {
      console.error('❌ Error Firebase ventas:', error);
    }
  }

  seleccionarVenta(venta: any) {
    if (venta.estado === 'anulado') {
      alert('No puedes editar una venta anulada.');
      return;
    }

    this.editando = true;
    this.idVentaEditando = venta.id;

    this.nuevaVenta = {
      cliente: venta.cliente || '',
      total: Number(venta.total) || 0,
      metodoPago: venta.metodoPago || ''
    };
  }

  cancelarEdicion() {
    this.editando = false;
    this.idVentaEditando = null;
    this.limpiarFormulario();
  }

  async eliminarVenta(id: string) {
    const confirmar = confirm('¿Seguro que deseas anular esta venta?');

    if (!confirmar) return;

    try {
      const ventaRef = doc(this.firestore, 'ventas', id);

      await updateDoc(ventaRef, {
        estado: 'anulado',
        fechaAnulacion: new Date()
      });

    } catch (error) {
      console.error('❌ Error anulando venta:', error);
    }
  }

  limpiarFormulario() {
    this.nuevaVenta = {
      cliente: '',
      total: null,
      metodoPago: ''
    };
  }

  convertirFecha(fecha: any): Date {
    if (!fecha) return new Date(0);

    if (fecha?.seconds) {
      return new Date(fecha.seconds * 1000);
    }

    if (fecha?.toDate) {
      return fecha.toDate();
    }

    return new Date(fecha);
  }

  obtenerFechaTexto(fecha: any): string {
    const date = this.convertirFecha(fecha);

    if (isNaN(date.getTime())) return '--/--/----';

    return date.toLocaleDateString('es-PE');
  }

  obtenerHoraTexto(fecha: any): string {
    const date = this.convertirFecha(fecha);

    if (isNaN(date.getTime())) return '--:--';

    return date.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  ngOnDestroy() {
    this.ventasSubscription?.unsubscribe();
  }
}