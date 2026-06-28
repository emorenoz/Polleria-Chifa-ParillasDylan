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
  people,
  create,
  trash,
  arrowBack,
  searchOutline,
  addOutline,
  closeOutline,
  pencilOutline,
  trashOutline,
  shieldCheckmarkOutline,
  peopleOutline,
  restaurantOutline,
  cashOutline
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

  fechaActual = '';
  mostrarFormulario = false;

  filtroRol = 'Todos';
  opcionesFiltro = ['Todos', 'Mesero', 'Cocina', 'Caja'];

  totalAdmins = 0;
  totalMeseros = 0;
  totalCocinas = 0;
  totalCajas = 0;

  nuevoUsuario = {
    nombre: '',
    email: '',
    password: '',
    rol: 'mesero',
    estadoActivo: true
  };

  editando = false;
  idUsuarioEditando: string | null = null;
  textoBuscar = '';

  listaUsuarios: any[] = [];
  usuariosFiltrados: any[] = [];

  constructor() {
    addIcons({
      people,
      create,
      trash,
      arrowBack,
      searchOutline,
      addOutline,
      closeOutline,
      pencilOutline,
      trashOutline,
      shieldCheckmarkOutline,
      peopleOutline,
      restaurantOutline,
      cashOutline
    });
  }

  async ngOnInit() {
    this.configurarFecha();
    await this.cargarUsuariosFirebase();
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
    this.mostrarFormulario = true;
  }

  cerrarFormulario() {
    this.mostrarFormulario = false;
    this.limpiarFormulario();
    this.editando = false;
    this.idUsuarioEditando = null;
  }

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
    if (!email) return '@' + this.obtenerInicial('');
    return '@' + email.split('@')[0];
  }

  obtenerNombreRol(rolId: string): string {
    switch (rolId) {
      case 'admin': return 'Admin';
      case 'mesero': return 'Mesero';
      case 'cocina': return 'Cocina';
      case 'caja': return 'Caja';
      default: return 'Usuario';
    }
  }

  obtenerClaseRol(rolId: string): string {
    switch (rolId) {
      case 'admin': return 'badge-admin';
      case 'mesero': return 'badge-mesero';
      case 'cocina': return 'badge-cocina';
      case 'caja': return 'badge-caja';
      default: return '';
    }
  }

  obtenerIconoRol(rolId: string): string {
    switch (rolId) {
      case 'admin': return 'shield-checkmark-outline';
      case 'mesero': return 'people-outline';
      case 'cocina': return 'restaurant-outline';
      case 'caja': return 'cash-outline';
      default: return 'people-outline';
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
          password: data.password || '',
          rol: data.rol || 'mesero',
          estadoActivo: data.estadoActivo !== false
        });
      });

      this.calcularKPIs();
      this.buscar();

    } catch (error) {
      console.error('Error cargando usuarios:', error);
    }
  }

  async guardarUsuario() {
    const nombre = this.nuevoUsuario.nombre.trim();
    const email = this.nuevoUsuario.email.trim().toLowerCase();
    const password = this.nuevoUsuario.password.trim();
    const rol = this.nuevoUsuario.rol;

    if (!nombre || !rol) {
      alert('Completa nombre y rol.');
      return;
    }

    if (rol === 'admin') {
      alert('No se puede crear ni modificar administradores desde este módulo.');
      return;
    }

    if (rol === 'caja') {
      if (!email || !password) {
        alert('El cajero necesita usuario/correo y contraseña.');
        return;
      }

      if (password.length < 6) {
        alert('La contraseña debe tener mínimo 6 caracteres.');
        return;
      }
    }

    try {
      const dataGuardar: any = {
        nombre,
        rol,
        estadoActivo: this.nuevoUsuario.estadoActivo,
        updatedAt: new Date()
      };

      if (rol === 'caja') {
        dataGuardar.email = email;
        dataGuardar.password = password;
      } else {
        dataGuardar.email = '';
        dataGuardar.password = '';
      }

      if (this.editando && this.idUsuarioEditando) {
        const ref = doc(this.firestore, 'usuarios', this.idUsuarioEditando);
        await updateDoc(ref, dataGuardar);
      } else {
        await addDoc(collection(this.firestore, 'usuarios'), {
          ...dataGuardar,
          estadoActivo: true,
          createdAt: new Date()
        });
      }

      await this.cargarUsuariosFirebase();
      this.cerrarFormulario();

    } catch (error) {
      console.error('Error guardando usuario:', error);
    }
  }

  seleccionarUsuario(usuario: any) {
    if (usuario.rol === 'admin') {
      alert('El administrador no se modifica desde este módulo.');
      return;
    }

    this.editando = true;
    this.idUsuarioEditando = usuario.id;

    this.nuevoUsuario = {
      nombre: usuario.nombre,
      email: usuario.email || '',
      password: '',
      rol: usuario.rol,
      estadoActivo: usuario.estadoActivo
    };

    this.mostrarFormulario = true;
  }

  async eliminarUsuario(id: string) {
    const usuario = this.listaUsuarios.find(u => u.id === id);

    if (usuario?.rol === 'admin') {
      alert('No se puede eliminar al administrador desde este módulo.');
      return;
    }

    const confirmar = confirm('¿Seguro que deseas eliminar este usuario?');

    if (!confirmar) return;

    try {
      await deleteDoc(doc(this.firestore, 'usuarios', id));

      this.listaUsuarios = this.listaUsuarios.filter(u => u.id !== id);

      this.calcularKPIs();
      this.buscar();

    } catch (error) {
      console.error('Error eliminando usuario:', error);
    }
  }

  async toggleEstadoUsuario(usuario: any) {
    if (usuario.rol === 'admin') {
      alert('No se puede desactivar al administrador desde este módulo.');
      return;
    }

    const nuevoEstado = !usuario.estadoActivo;
    usuario.estadoActivo = nuevoEstado;

    try {
      const ref = doc(this.firestore, 'usuarios', usuario.id);

      await updateDoc(ref, {
        estadoActivo: nuevoEstado,
        updatedAt: new Date()
      });

    } catch (error) {
      usuario.estadoActivo = !nuevoEstado;
      console.error('Error cambiando estado de usuario:', error);
    }
  }

  buscar() {
    const q = this.textoBuscar.toLowerCase().trim();

    this.usuariosFiltrados = this.listaUsuarios.filter(usuario => {
      const nombre = String(usuario.nombre || '').toLowerCase();
      const email = String(usuario.email || '').toLowerCase();

      const matchTexto =
        !q ||
        nombre.includes(q) ||
        email.includes(q);

      const rolVisual = this.obtenerNombreRol(usuario.rol);

      const matchRol =
        this.filtroRol === 'Todos' ||
        rolVisual === this.filtroRol;

      return matchTexto && matchRol;
    });
  }

  limpiarFormulario() {
    this.nuevoUsuario = {
      nombre: '',
      email: '',
      password: '',
      rol: 'mesero',
      estadoActivo: true
    };
  }
}