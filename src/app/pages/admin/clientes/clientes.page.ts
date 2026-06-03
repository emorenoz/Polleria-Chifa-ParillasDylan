import { Component, OnInit, inject } from '@angular/core';
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
  IonButton,
  IonSearchbar,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonIcon,
  IonLabel,
  IonNote,
  IonButtons,
  IonBackButton
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  create,
  trash,
  arrowBack
} from 'ionicons/icons';

import {
  Firestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc
} from '@angular/fire/firestore';

@Component({
  selector: 'app-clientes',
  templateUrl: './clientes.page.html',
  styleUrls: ['./clientes.page.scss'],
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
    IonButton,
    IonSearchbar,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonIcon,
    IonLabel,
    IonNote,
    IonButtons,
    IonBackButton
  ]
})
export class ClientesPage implements OnInit {

  private firestore = inject(Firestore);

  nuevoCliente = {
    documento: '',
    nombre: '',
    telefono: '',
    direccion: ''
  };

  editando: boolean = false;
  idClienteEditando: string | null = null;
  textoBuscar: string = '';

  listaClientes: any[] = [];

  clientesFiltrados: any[] = [];

  constructor() {

    addIcons({
      create,
      trash,
      arrowBack
    });

  }

  async ngOnInit() {

    await this.cargarClientesFirebase();

  }

  async cargarClientesFirebase() {

    try {

      const querySnapshot = await getDocs(
        collection(this.firestore, 'clientes')
      );

      this.listaClientes = [];

      querySnapshot.forEach((documento) => {

        this.listaClientes.push({
          id: documento.id,
          ...documento.data()
        });

      });

      this.clientesFiltrados = [
        ...this.listaClientes
      ];

      console.log(
        '✅ Clientes cargados:',
        this.listaClientes.length
      );

    } catch (error) {

      console.error(
        '❌ Error cargando clientes:',
        error
      );

    }

  }

  async guardarCliente() {

    if (
      !this.nuevoCliente.documento.trim() ||
      !this.nuevoCliente.nombre.trim()
    ) return;

    try {

      if (
        this.editando &&
        this.idClienteEditando !== null
      ) {

        const clienteRef = doc(
          this.firestore,
          'clientes',
          this.idClienteEditando
        );

        await updateDoc(clienteRef, {
          documento: this.nuevoCliente.documento.trim(),
          nombre: this.nuevoCliente.nombre.trim(),
          telefono: this.nuevoCliente.telefono.trim(),
          direccion: this.nuevoCliente.direccion.trim()
        });

        const index =
          this.listaClientes.findIndex(
            c => c.id === this.idClienteEditando
          );

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

        const docRef = await addDoc(
          collection(this.firestore, 'clientes'),
          {
            documento: this.nuevoCliente.documento.trim(),
            nombre: this.nuevoCliente.nombre.trim(),
            telefono: this.nuevoCliente.telefono.trim(),
            direccion: this.nuevoCliente.direccion.trim()
          }
        );

        this.listaClientes.push({
          id: docRef.id,
          documento: this.nuevoCliente.documento.trim(),
          nombre: this.nuevoCliente.nombre.trim(),
          telefono: this.nuevoCliente.telefono.trim(),
          direccion: this.nuevoCliente.direccion.trim()
        });

      }

      this.buscar();

      this.limpiarFormulario();

    } catch (error) {

      console.error(
        '❌ Error guardando cliente:',
        error
      );

    }

  }

  seleccionarCliente(cliente: any) {

    this.editando = true;

    this.idClienteEditando = cliente.id;

    this.nuevoCliente = {
      documento: cliente.documento,
      nombre: cliente.nombre,
      telefono: cliente.telefono || '',
      direccion: cliente.direccion || ''
    };

  }

  cancelarEdicion() {

    this.editando = false;

    this.idClienteEditando = null;

    this.limpiarFormulario();

  }

  async eliminarCliente(id: string) {

    try {

      await deleteDoc(
        doc(this.firestore, 'clientes', id)
      );

      this.listaClientes =
        this.listaClientes.filter(
          cliente => cliente.id !== id
        );

      this.buscar();

    } catch (error) {

      console.error(
        '❌ Error eliminando cliente:',
        error
      );

    }

  }

  buscar() {

    const q =
      this.textoBuscar
        .toLowerCase()
        .trim();

    if (!q) {

      this.clientesFiltrados = [
        ...this.listaClientes
      ];

    } else {

      this.clientesFiltrados =
        this.listaClientes.filter(
          cliente =>
            cliente.nombre
              .toLowerCase()
              .includes(q)
            ||
            cliente.documento.includes(q)
        );

    }

  }

  limpiarFormulario() {

    this.nuevoCliente = {
      documento: '',
      nombre: '',
      telefono: '',
      direccion: ''
    };

  }

}