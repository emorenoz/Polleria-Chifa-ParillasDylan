import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonList, IonItem, IonInput, IonButton,
  IonSearchbar, IonItemSliding, IonItemOptions, IonItemOption, IonIcon,
  IonLabel, IonNote
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { create, trash } from 'ionicons/icons';

@Component({
  selector: 'app-clientes',
  templateUrl: './clientes.page.html',
  styleUrls: ['./clientes.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonContent, IonHeader, IonTitle, IonToolbar,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonList, IonItem,
    IonInput, IonButton, IonSearchbar, IonItemSliding, IonItemOptions,
    IonItemOption, IonIcon, IonLabel, IonNote
  ]
})
export class ClientesPage implements OnInit {

  nuevoCliente = {
    documento: '',
    nombre: '',
    telefono: '',
    direccion: ''
  };

  editando: boolean = false;
  idClienteEditando: string | null = null; // ID Alfanumérico tipo Firebase
  textoBuscar: string = '';

  listaClientes: any[] = [
    { id: 'cli_1', documento: '10748596', nombre: 'Juan Pérez Alva', telefono: '987654321', direccion: 'Av. Larco 456' }
  ];
  clientesFiltrados: any[] = [];

  constructor() {
    addIcons({ create, trash });
  }

  async ngOnInit() {
    await this.cargarClientesFirebase();
  }

  async cargarClientesFirebase() {
    this.clientesFiltrados = [...this.listaClientes];
  }

  // Preparado para interactuar con colecciones de Cloud Firestore
  async guardarCliente() {
    if (!this.nuevoCliente.documento.trim() || !this.nuevoCliente.nombre.trim()) return;

    if (this.editando && this.idClienteEditando !== null) {
      // Firestore: db.collection('clientes').doc(id).update(...)
      const index = this.listaClientes.findIndex(c => c.id === this.idClienteEditando);
      if (index !== -1) {
        this.listaClientes[index] = {
          id: this.idClienteEditando,
          documento: this.nuevoCliente.documento.trim(),
          nombre: this.nuevoCliente.nombre.trim(),
          telefono: this.nuevoCliente.telefono.trim(),
          direccion: this.nuevoCliente.direccion.trim()
        };
      }
      this.cancelarEdicion();
    } else {
      // Firestore: db.collection('clientes').add(...)
      const mockFirebaseId = 'fs_' + Math.random().toString(36).substr(2, 9);
      this.listaClientes.push({
        id: mockFirebaseId,
        documento: this.nuevoCliente.documento.trim(),
        nombre: this.nuevoCliente.nombre.trim(),
        telefono: this.nuevoCliente.telefono.trim(),
        direccion: this.nuevoCliente.direccion.trim()
      });
    }

    this.buscar();
    this.limpiarFormulario();
  }

  seleccionarCliente(cliente: any) {
    this.editando = true;
    this.idClienteEditando = cliente.id;
    this.nuevoCliente = {
      documento: cliente.documento,
      nombre: cliente.nombre,
      telefono: cliente.telefono,
      direccion: cliente.direccion
    };
  }

  cancelarEdicion() {
    this.editando = false;
    this.idClienteEditando = null;
    this.limpiarFormulario();
  }

  async eliminarCliente(id: string) {
    // Firestore: db.collection('clientes').doc(id).delete()
    this.listaClientes = this.listaClientes.filter(c => c.id !== id);
    this.buscar();
  }

  buscar() {
    const q = this.textoBuscar.toLowerCase().trim();
    if (!q) {
      this.clientesFiltrados = [...this.listaClientes];
    } else {
      this.clientesFiltrados = this.listaClientes.filter(c => 
        c.nombre.toLowerCase().includes(q) || c.documento.includes(q)
      );
    }
  }

  limpiarFormulario() {
    this.nuevoCliente = { documento: '', nombre: '', telefono: '', direccion: '' };
  }
}