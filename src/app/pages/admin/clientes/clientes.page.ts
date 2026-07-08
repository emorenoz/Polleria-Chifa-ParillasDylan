import { Component, OnInit, OnDestroy, inject } from '@angular/core';
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
  IonBackButton,
  IonMenuButton
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  create,
  trash,
  arrowBack,
  searchOutline,
  addOutline,
  closeOutline,
  pencilOutline,
  trashOutline,
  callOutline,
  mailOutline,
  cardOutline,
  cubeOutline,
  star,
  refreshOutline
} from 'ionicons/icons';

import {
  Firestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  collectionData
} from '@angular/fire/firestore';

import { Subscription } from 'rxjs';

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
    IonBackButton,
    IonMenuButton
  ]
})
export class ClientesPage implements OnInit, OnDestroy {

  private firestore = inject(Firestore);
  private clientesSub?: Subscription;

  fechaActual = '';
  mostrarFormulario = false;
  actualizando = false;

  filtroTipo = 'Todos';
  opcionesFiltro = ['Todos', 'Frecuente', 'Regular', 'Nuevo'];

  totalClientes = 0;
  totalFrecuentes = 0;
  totalNuevos = 0;
  gastoPromedio = 0;

  nuevoCliente = {
    documento: '',
    nombre: '',
    telefono: '',
    direccion: ''
  };

  editando = false;
  idClienteEditando: string | null = null;
  textoBuscar = '';

  listaClientes: any[] = [];
  clientesFiltrados: any[] = [];

  constructor() {
    addIcons({
      create,
      trash,
      arrowBack,
      searchOutline,
      addOutline,
      closeOutline,
      pencilOutline,
      trashOutline,
      callOutline,
      mailOutline,
      cardOutline,
      cubeOutline,
      star,
      refreshOutline
    });
  }

  ngOnInit() {
    this.configurarFecha();
    this.escucharClientesTiempoReal();
  }

  ngOnDestroy() {
    this.clientesSub?.unsubscribe();
  }

  configurarFecha() {
    const opciones: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };

    this.fechaActual = new Date().toLocaleDateString('es-PE', opciones);
  }

  abrirFormulario() {
    this.limpiarFormulario();
    this.editando = false;
    this.idClienteEditando = null;
    this.mostrarFormulario = true;
  }

  cerrarFormulario() {
    this.mostrarFormulario = false;
    this.limpiarFormulario();
    this.editando = false;
    this.idClienteEditando = null;
  }

  obtenerInicial(nombre: string): string {
    return nombre ? nombre.charAt(0).toUpperCase() : '?';
  }

  obtenerColorAvatar(nombre: string): string {
    if (!nombre) return 'bg-gray';

    const code = nombre.charCodeAt(0);

    if (code % 5 === 0) return 'bg-purple';
    if (code % 5 === 1) return 'bg-blue';
    if (code % 5 === 2) return 'bg-pink';
    if (code % 5 === 3) return 'bg-green';

    return 'bg-orange';
  }

  obtenerTipoVisual(cliente: any): string {
    const tipoManual = String(cliente.tipo || '').trim();

    if (tipoManual === 'Frecuente' || tipoManual === 'Regular' || tipoManual === 'Nuevo') {
      return tipoManual;
    }

    const pedidos = Number(cliente.totalPedidos || 0);

    if (pedidos >= 5) return 'Frecuente';
    if (pedidos >= 2) return 'Regular';

    return 'Nuevo';
  }

  obtenerClaseTipo(cliente: any): string {
    const tipo = this.obtenerTipoVisual(cliente);

    if (tipo === 'Frecuente') return 'badge-frecuente';
    if (tipo === 'Regular') return 'badge-regular';

    return 'badge-nuevo';
  }

  seleccionarFiltro(filtro: string) {
    this.filtroTipo = filtro;
    this.buscar();
  }

  calcularKPIs() {
    this.totalClientes = this.listaClientes.length;

    this.totalFrecuentes = this.listaClientes.filter(c =>
      this.obtenerTipoVisual(c) === 'Frecuente'
    ).length;

    this.totalNuevos = this.listaClientes.filter(c =>
      this.obtenerTipoVisual(c) === 'Nuevo'
    ).length;

    const totalGastado = this.listaClientes.reduce((sum, c) => {
      return sum + Number(c.totalGastado || 0);
    }, 0);

    this.gastoPromedio = this.totalClientes > 0
      ? totalGastado / this.totalClientes
      : 0;
  }

  escucharClientesTiempoReal() {
    const clientesRef = collection(this.firestore, 'clientes');

    this.clientesSub = collectionData(clientesRef, { idField: 'id' }).subscribe({
      next: (clientes: any[]) => {
        this.listaClientes = (clientes || [])
          .filter(cliente => cliente.activo !== false)
          .map(cliente => this.normalizarCliente(cliente))
          .sort((a, b) => String(a.nombre || '').localeCompare(String(b.nombre || '')));

        this.calcularKPIs();
        this.buscar();

        console.log('✅ Clientes en tiempo real:', this.listaClientes.length);
      },
      error: (error) => {
        console.error('❌ Error escuchando clientes:', error);
      }
    });
  }

  async cargarClientesFirebase() {
    try {
      const querySnapshot = await getDocs(collection(this.firestore, 'clientes'));

      this.listaClientes = [];

      querySnapshot.forEach((documento) => {
        const data: any = documento.data();

        if (data.activo === false) return;

        this.listaClientes.push(this.normalizarCliente({
          id: documento.id,
          ...data
        }));
      });

      this.calcularKPIs();
      this.buscar();

      console.log('✅ Clientes cargados:', this.listaClientes.length);

    } catch (error) {
      console.error('❌ Error cargando clientes:', error);
    }
  }

  async actualizarClientes() {
    if (this.actualizando) return;

    this.actualizando = true;

    try {
      await this.cargarClientesFirebase();
    } catch (error) {
      console.error('❌ Error actualizando clientes:', error);
    } finally {
      setTimeout(() => {
        this.actualizando = false;
      }, 500);
    }
  }

  async guardarCliente() {
    const documento = this.normalizarDocumento(this.nuevoCliente.documento);
    const nombre = this.formatearNombre(this.nuevoCliente.nombre);
    const telefono = this.normalizarTelefono(this.nuevoCliente.telefono);
    const direccion = String(this.nuevoCliente.direccion || '').trim();

    if (!nombre) {
      alert('Ingresa el nombre del cliente.');
      return;
    }

    if (documento && documento.length < 8) {
      alert('El documento debe tener al menos 8 dígitos.');
      return;
    }

    if (telefono && telefono.length < 9) {
      alert('El teléfono debe tener al menos 9 dígitos.');
      return;
    }

    const duplicado = this.existeClienteDuplicado(documento, telefono);

    if (duplicado) {
      alert('Ya existe un cliente con el mismo documento o teléfono.');
      return;
    }

    try {
      if (this.editando && this.idClienteEditando !== null) {
        const clienteRef = doc(this.firestore, 'clientes', this.idClienteEditando);

        await updateDoc(clienteRef, {
          documento,
          nombre,
          telefono,
          direccion,
          activo: true,
          actualizadoEn: new Date()
        });

      } else {
        await addDoc(collection(this.firestore, 'clientes'), {
          documento,
          nombre,
          telefono,
          direccion,
          totalPedidos: 0,
          totalGastado: 0,
          tipo: 'Nuevo',
          origen: 'admin',
          ultimaCompra: '',
          ultimaVisita: '',
          fechaRegistro: new Date(),
          actualizadoEn: new Date(),
          activo: true
        });
      }

      this.calcularKPIs();
      this.buscar();
      this.cerrarFormulario();

    } catch (error) {
      console.error('❌ Error guardando cliente:', error);
    }
  }

  seleccionarCliente(cliente: any) {
    this.editando = true;
    this.idClienteEditando = cliente.id;

    this.nuevoCliente = {
      documento: cliente.documento || '',
      nombre: cliente.nombre || '',
      telefono: cliente.telefono || '',
      direccion: cliente.direccion || ''
    };

    this.mostrarFormulario = true;
  }

  async eliminarCliente(id: string) {
    try {
      const clienteRef = doc(this.firestore, 'clientes', id);

      await updateDoc(clienteRef, {
        activo: false,
        eliminadoEn: new Date(),
        actualizadoEn: new Date()
      });

      this.listaClientes = this.listaClientes.filter(cliente => cliente.id !== id);

      this.calcularKPIs();
      this.buscar();

    } catch (error) {
      console.error('❌ Error desactivando cliente:', error);
    }
  }

  async activarCliente(cliente: any) {
    try {
      const clienteRef = doc(this.firestore, 'clientes', cliente.id);

      await updateDoc(clienteRef, {
        activo: true,
        actualizadoEn: new Date()
      });

    } catch (error) {
      console.error('❌ Error activando cliente:', error);
    }
  }

  buscar() {
    const q = this.textoBuscar.toLowerCase().trim();

    this.clientesFiltrados = this.listaClientes.filter(cliente => {
      const nombre = String(cliente.nombre || '').toLowerCase();
      const documento = String(cliente.documento || '').toLowerCase();
      const telefono = String(cliente.telefono || '').toLowerCase();
      const direccion = String(cliente.direccion || '').toLowerCase();
      const origen = String(cliente.origen || '').toLowerCase();

      const matchTexto =
        !q ||
        nombre.includes(q) ||
        documento.includes(q) ||
        telefono.includes(q) ||
        direccion.includes(q) ||
        origen.includes(q);

      const tipo = this.obtenerTipoVisual(cliente);
      const matchTipo = this.filtroTipo === 'Todos' || tipo === this.filtroTipo;

      return matchTexto && matchTipo;
    });
  }

  existeClienteDuplicado(documento: string, telefono: string): boolean {
    return this.listaClientes.some(cliente => {
      const mismoCliente = this.editando && cliente.id === this.idClienteEditando;

      if (mismoCliente) return false;

      const docCliente = this.normalizarDocumento(cliente.documento || '');
      const telCliente = this.normalizarTelefono(cliente.telefono || '');

      const documentoDuplicado =
        !!documento &&
        !!docCliente &&
        documento === docCliente;

      const telefonoDuplicado =
        !!telefono &&
        !!telCliente &&
        telefono === telCliente;

      return documentoDuplicado || telefonoDuplicado;
    });
  }

  normalizarCliente(cliente: any): any {
    return {
      id: cliente.id,
      documento: this.normalizarDocumento(cliente.documento || ''),
      nombre: this.formatearNombre(cliente.nombre || ''),
      telefono: this.normalizarTelefono(cliente.telefono || ''),
      direccion: String(cliente.direccion || '').trim(),
      totalPedidos: Number(cliente.totalPedidos || 0),
      totalGastado: Number(cliente.totalGastado || 0),
      tipo: cliente.tipo || '',
      origen: cliente.origen || '',
      ultimaCompra: cliente.ultimaCompra || '',
      ultimaVisita: cliente.ultimaVisita || cliente.ultimaCompra || '',
      fechaCaja: cliente.fechaCaja || '',
      fechaRegistro: cliente.fechaRegistro || '',
      actualizadoEn: cliente.actualizadoEn || null,
      activo: cliente.activo !== false
    };
  }

  normalizarDocumento(documento: any): string {
    return String(documento || '').replace(/\D/g, '').trim();
  }

  normalizarTelefono(telefono: any): string {
    return String(telefono || '').replace(/\D/g, '').trim();
  }

  formatearNombre(nombre: any): string {
    return String(nombre || '')
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, letra => letra.toUpperCase());
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
