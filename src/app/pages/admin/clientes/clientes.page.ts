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
  IonBackButton,
  IonMenuButton
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { 
  create, trash, arrowBack,
  searchOutline, addOutline, closeOutline, pencilOutline, trashOutline, callOutline, mailOutline, cardOutline, cubeOutline, star
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
    IonBackButton,
    IonMenuButton
  ]
})
export class ClientesPage implements OnInit {

  private firestore = inject(Firestore);

  // --- VARIABLES DE INTERFAZ NUEVAS ---
  fechaActual: string = '';
  mostrarFormulario: boolean = false;
  
  // Variables de Filtrado superior
  filtroTipo: string = 'Todos';
  opcionesFiltro = ['Todos', 'Frecuente', 'Regular', 'Nuevo'];

  // Variables KPI
  totalClientes: number = 0;
  totalFrecuentes: number = 0;
  totalNuevos: number = 0;
  gastoPromedio: number = 0;

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
      create, trash, arrowBack,
      searchOutline, addOutline, closeOutline, pencilOutline, trashOutline, callOutline, mailOutline, cardOutline, cubeOutline, star
    });
  }

  async ngOnInit() {
    this.configurarFecha();
    await this.cargarClientesFirebase();
  }

  configurarFecha() {
    const opciones: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    this.fechaActual = new Date().toLocaleDateString('es-PE', opciones);
  }

  // --- CONTROL DE FORMULARIO ---
  abrirFormulario() {
    this.limpiarFormulario();
    this.editando = false;
    this.mostrarFormulario = true;
  }

  cerrarFormulario() {
    this.mostrarFormulario = false;
    this.limpiarFormulario();
    this.editando = false;
    this.idClienteEditando = null;
  }

  // --- LÓGICA VISUAL (AVATARES Y ESTADOS) ---
  obtenerInicial(nombre: string): string {
    return nombre ? nombre.charAt(0).toUpperCase() : '?';
  }

  obtenerColorAvatar(nombre: string): string {
    if (!nombre) return 'bg-gray';
    // Genera un color consistente basado en la longitud o primera letra
    const code = nombre.charCodeAt(0);
    if (code % 5 === 0) return 'bg-purple';
    if (code % 5 === 1) return 'bg-blue';
    if (code % 5 === 2) return 'bg-pink';
    if (code % 5 === 3) return 'bg-green';
    return 'bg-orange';
  }

  obtenerTipoVisual(cliente: any): string {
    // Como tu BD aún no tiene el campo "tipo", usaremos 'Nuevo' por defecto
    // para mantener el diseño igual al prototipo.
    return cliente.tipoMock || 'Nuevo';
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
    // Mock de métricas basándonos en la lista actual
    this.totalNuevos = this.listaClientes.length; // Asumimos que todos son nuevos temporalmente
    this.totalFrecuentes = 0;
    this.gastoPromedio = 0; // Valor por defecto
  }


  // --- LOGICA DE FIREBASE INTACTA ---

  async cargarClientesFirebase() {
    try {
      const querySnapshot = await getDocs(collection(this.firestore, 'clientes'));
      this.listaClientes = [];

      querySnapshot.forEach((documento) => {
        this.listaClientes.push({
          id: documento.id,
          ...documento.data()
        });
      });

      this.calcularKPIs();
      this.buscar();
      console.log('✅ Clientes cargados:', this.listaClientes.length);
    } catch (error) {
      console.error('❌ Error cargando clientes:', error);
    }
  }

  async guardarCliente() {
    if (!this.nuevoCliente.documento.trim() || !this.nuevoCliente.nombre.trim()) return;

    try {
      if (this.editando && this.idClienteEditando !== null) {
        const clienteRef = doc(this.firestore, 'clientes', this.idClienteEditando);
        
        await updateDoc(clienteRef, {
          documento: this.nuevoCliente.documento.trim(),
          nombre: this.nuevoCliente.nombre.trim(),
          telefono: this.nuevoCliente.telefono.trim(),
          direccion: this.nuevoCliente.direccion.trim()
        });

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
      } else {
        const docRef = await addDoc(collection(this.firestore, 'clientes'), {
          documento: this.nuevoCliente.documento.trim(),
          nombre: this.nuevoCliente.nombre.trim(),
          telefono: this.nuevoCliente.telefono.trim(),
          direccion: this.nuevoCliente.direccion.trim()
        });

        this.listaClientes.push({
          id: docRef.id,
          documento: this.nuevoCliente.documento.trim(),
          nombre: this.nuevoCliente.nombre.trim(),
          telefono: this.nuevoCliente.telefono.trim(),
          direccion: this.nuevoCliente.direccion.trim()
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
      documento: cliente.documento,
      nombre: cliente.nombre,
      telefono: cliente.telefono || '',
      direccion: cliente.direccion || ''
    };
    this.mostrarFormulario = true;
  }

  async eliminarCliente(id: string) {
    try {
      await deleteDoc(doc(this.firestore, 'clientes', id));
      this.listaClientes = this.listaClientes.filter(cliente => cliente.id !== id);
      this.calcularKPIs();
      this.buscar();
    } catch (error) {
      console.error('❌ Error eliminando cliente:', error);
    }
  }

  buscar() {
    const q = this.textoBuscar.toLowerCase().trim();

    this.clientesFiltrados = this.listaClientes.filter(cliente => {
      const matchTexto = !q || 
                         cliente.nombre.toLowerCase().includes(q) || 
                         cliente.documento.includes(q) || 
                         (cliente.telefono && cliente.telefono.includes(q));

      const tipoMock = this.obtenerTipoVisual(cliente);
      const matchTipo = this.filtroTipo === 'Todos' || tipoMock === this.filtroTipo;

      return matchTexto && matchTipo;
    });
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