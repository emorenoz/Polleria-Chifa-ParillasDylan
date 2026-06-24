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
  IonSelect,
  IonSelectOption,
  IonButton,
  IonIcon,
  IonLabel,
  IonBadge,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonButtons,
  IonBackButton,
  IonMenuButton
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { 
  people, create, trash, arrowBack,
  searchOutline, addOutline, closeOutline, pencilOutline, trashOutline, shieldCheckmarkOutline, peopleOutline, restaurantOutline, cashOutline
} from 'ionicons/icons';

import {
  Firestore,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from '@angular/fire/firestore';

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.page.html',
  styleUrls: ['./usuarios.page.scss'],
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
    IonBadge,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonButtons,
    IonBackButton,
    IonMenuButton
  ]
})
export class UsuariosPage implements OnInit {

  private firestore = inject(Firestore);

  // --- VARIABLES DE INTERFAZ NUEVAS ---
  fechaActual: string = '';
  mostrarFormulario: boolean = false;
  
  // Variables de Filtrado superior
  filtroRol: string = 'Todos';
  opcionesFiltro = ['Todos', 'Admin', 'Mesero', 'Cocina', 'Caja'];

  // Variables KPI
  totalAdmins: number = 0;
  totalMeseros: number = 0;
  totalCocinas: number = 0;
  totalCajas: number = 0;

  nuevoUsuario = {
    nombre: '',
    email: '',
    password: '',
    rol: '',
    estadoActivo: true
  };

  editando = false;
  idUsuarioEditando: string | null = null;
  textoBuscar: string = '';

  listaUsuarios: any[] = [];
  usuariosFiltrados: any[] = [];

  constructor() {
    addIcons({ 
      people, create, trash, arrowBack,
      searchOutline, addOutline, closeOutline, pencilOutline, trashOutline, shieldCheckmarkOutline, peopleOutline, restaurantOutline, cashOutline
    });
  }

  async ngOnInit() {
    this.configurarFecha();
    await this.cargarUsuariosFirebase();
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
    this.idUsuarioEditando = null;
  }

  // --- LÓGICA VISUAL (AVATARES, ROLES Y ESTADOS) ---
  obtenerInicial(nombre: string): string {
    return nombre ? nombre.charAt(0).toUpperCase() : '?';
  }

  obtenerColorAvatar(nombre: string): string {
    if (!nombre) return 'bg-gray';
    const code = nombre.charCodeAt(0);
    if (code % 4 === 0) return 'bg-purple';
    if (code % 4 === 1) return 'bg-blue';
    if (code % 4 === 2) return 'bg-green';
    return 'bg-orange';
  }

  formatUsername(email: string): string {
    if (!email) return '@user';
    return '@' + email.split('@')[0];
  }

  obtenerNombreRol(rolId: string): string {
    switch(rolId) {
      case 'admin': return 'Admin';
      case 'mesero': return 'Mesero';
      case 'cocina': return 'Cocina';
      case 'caja': return 'Caja';
      default: return 'Usuario';
    }
  }

  obtenerClaseRol(rolId: string): string {
    switch(rolId) {
      case 'admin': return 'badge-admin';
      case 'mesero': return 'badge-mesero';
      case 'cocina': return 'badge-cocina';
      case 'caja': return 'badge-caja';
      default: return '';
    }
  }

  obtenerIconoRol(rolId: string): string {
    switch(rolId) {
      case 'admin': return 'shield-checkmark-outline';
      case 'mesero': return 'people-outline';
      case 'cocina': return 'restaurant-outline';
      case 'caja': return 'cash-outline';
      default: return 'person-outline';
    }
  }

  seleccionarFiltro(rolVisual: string) {
    this.filtroRol = rolVisual;
    this.buscar();
  }

  calcularKPIs() {
    this.totalAdmins = this.listaUsuarios.filter(u => u.rol === 'admin').length;
    this.totalMeseros = this.listaUsuarios.filter(u => u.rol === 'mesero').length;
    this.totalCocinas = this.listaUsuarios.filter(u => u.rol === 'cocina').length;
    this.totalCajas = this.listaUsuarios.filter(u => u.rol === 'caja').length;
  }


  // --- LOGICA DE FIREBASE INTACTA Y EXTENDIDA PARA ESTADO ---

  async cargarUsuariosFirebase() {
    try {
      const snapshot = await getDocs(collection(this.firestore, 'usuarios'));
      this.listaUsuarios = [];

      snapshot.forEach(docSnap => {
        const data: any = docSnap.data();
        this.listaUsuarios.push({
          id: docSnap.id,
          nombre: data.nombre || '',
          email: data.email || '',
          rol: data.rol || 'mesero', // fallback
          estadoActivo: data.estadoActivo !== false // Por defecto true
        });
      });

      this.calcularKPIs();
      this.buscar();
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    }
  }

  async guardarUsuario() {
    if (!this.nuevoUsuario.nombre.trim() || !this.nuevoUsuario.email.trim() || (!this.editando && !this.nuevoUsuario.password) || !this.nuevoUsuario.rol) return;

    try {
      if (this.editando && this.idUsuarioEditando) {
        const ref = doc(this.firestore, 'usuarios', this.idUsuarioEditando);
        await updateDoc(ref, {
          nombre: this.nuevoUsuario.nombre.trim(),
          rol: this.nuevoUsuario.rol
        });

        // Actualización local
        const index = this.listaUsuarios.findIndex(u => u.id === this.idUsuarioEditando);
        if (index !== -1) {
          this.listaUsuarios[index].nombre = this.nuevoUsuario.nombre.trim();
          this.listaUsuarios[index].rol = this.nuevoUsuario.rol;
        }

      } else {
        const docRef = await addDoc(collection(this.firestore, 'usuarios'), {
          nombre: this.nuevoUsuario.nombre.trim(),
          email: this.nuevoUsuario.email.trim().toLowerCase(),
          rol: this.nuevoUsuario.rol,
          estadoActivo: true, // Nuevo por defecto activo
          createdAt: new Date()
        });

        this.listaUsuarios.push({
          id: docRef.id,
          nombre: this.nuevoUsuario.nombre.trim(),
          email: this.nuevoUsuario.email.trim().toLowerCase(),
          rol: this.nuevoUsuario.rol,
          estadoActivo: true
        });
      }

      this.calcularKPIs();
      this.buscar();
      this.cerrarFormulario();
    } catch (error) {
      console.error('Error guardando usuario:', error);
    }
  }

  seleccionarUsuario(usuario: any) {
    this.editando = true;
    this.idUsuarioEditando = usuario.id;
    this.nuevoUsuario = {
      nombre: usuario.nombre,
      email: usuario.email,
      password: '',
      rol: usuario.rol,
      estadoActivo: usuario.estadoActivo
    };
    this.mostrarFormulario = true;
  }

  async eliminarUsuario(id: string) {
    try {
      await deleteDoc(doc(this.firestore, 'usuarios', id));
      this.listaUsuarios = this.listaUsuarios.filter(u => u.id !== id);
      this.calcularKPIs();
      this.buscar();
    } catch (error) {
      console.error('Error eliminando usuario:', error);
    }
  }

  // ⭐ NUEVA FUNCIÓN: Actualizar el switch de estado (Habilitar/Deshabilitar)
  async toggleEstadoUsuario(usuario: any) {
    const nuevoEstado = !usuario.estadoActivo;
    usuario.estadoActivo = nuevoEstado; // Actualizamos vista rápido
    
    try {
      const ref = doc(this.firestore, 'usuarios', usuario.id);
      await updateDoc(ref, { estadoActivo: nuevoEstado });
    } catch (error) {
      // Revertir si falla
      usuario.estadoActivo = !nuevoEstado;
      console.error('Error cambiando estado de usuario:', error);
    }
  }

  buscar() {
    const q = this.textoBuscar.toLowerCase().trim();

    this.usuariosFiltrados = this.listaUsuarios.filter(usuario => {
      // Match texto (Nombre o @usuario)
      const matchTexto = !q || 
                         usuario.nombre.toLowerCase().includes(q) || 
                         usuario.email.toLowerCase().includes(q);

      // Match filtro de botones superiores
      const rolVisual = this.obtenerNombreRol(usuario.rol);
      const matchRol = this.filtroRol === 'Todos' || rolVisual === this.filtroRol;

      return matchTexto && matchRol;
    });
  }

  limpiarFormulario() {
    this.nuevoUsuario = {
      nombre: '',
      email: '',
      password: '',
      rol: '',
      estadoActivo: true
    };
  }
}