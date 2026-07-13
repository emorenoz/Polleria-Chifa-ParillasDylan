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
  addDoc,
  updateDoc,
  doc,
  collectionData
} from '@angular/fire/firestore';

import { Subscription } from 'rxjs';

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
export class UsuariosPage implements OnInit, OnDestroy {

  private firestore = inject(Firestore);
  private usuariosSub?: Subscription;

  fechaActual = '';
  mostrarFormulario = false;

  filtroRol = 'Todos';
  opcionesFiltro = ['Todos', 'Admin', 'Mesero', 'Cocina', 'Caja'];

  totalUsuarios = 0;
  totalActivos = 0;
  totalInactivos = 0;

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

  ngOnInit() {
    this.configurarFecha();
    this.escucharUsuariosTiempoReal();
  }

  ngOnDestroy() {
    this.usuariosSub?.unsubscribe();
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
    this.idUsuarioEditando = null;
    this.mostrarFormulario = true;
  }

  cerrarFormulario() {
    this.mostrarFormulario = false;
    this.limpiarFormulario();
    this.editando = false;
    this.idUsuarioEditando = null;
  }

  escucharUsuariosTiempoReal() {
    const usuariosRef = collection(this.firestore, 'usuarios');

    this.usuariosSub = collectionData(usuariosRef, { idField: 'id' }).subscribe({
      next: (usuarios: any[]) => {
        this.listaUsuarios = (usuarios || [])
          .filter(usuario => usuario.activo !== false)
          .map(usuario => ({
            id: usuario.id,
            nombre: this.formatearNombre(usuario.nombre || ''),
            email: this.normalizarEmail(usuario.email || ''),
            password: usuario.password || '',
            rol: this.normalizarRol(usuario.rol || 'mesero'),
            estadoActivo: usuario.estadoActivo !== false,
            activo: usuario.activo !== false,
            createdAt: usuario.createdAt || null,
            updatedAt: usuario.updatedAt || null,
            ultimoAcceso: usuario.ultimoAcceso || null
          }))
          .sort((a, b) => {
            const ordenRol: any = {
              admin: 1,
              mesero: 2,
              caja: 3,
              cocina: 4
            };

            const ordenA = ordenRol[a.rol] || 99;
            const ordenB = ordenRol[b.rol] || 99;

            if (ordenA !== ordenB) return ordenA - ordenB;

            return String(a.nombre || '').localeCompare(String(b.nombre || ''));
          });

        this.calcularKPIs();
        this.buscar();
      },
      error: (error) => {
        console.error('Error escuchando usuarios:', error);
      }
    });
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
    this.totalUsuarios = this.listaUsuarios.length;

    this.totalActivos = this.listaUsuarios.filter(u =>
      u.estadoActivo !== false
    ).length;

    this.totalInactivos = this.listaUsuarios.filter(u =>
      u.estadoActivo === false
    ).length;

    this.totalAdmins = this.listaUsuarios.filter(u => u.rol === 'admin').length;
    this.totalMeseros = this.listaUsuarios.filter(u => u.rol === 'mesero').length;
    this.totalCocinas = this.listaUsuarios.filter(u => u.rol === 'cocina').length;
    this.totalCajas = this.listaUsuarios.filter(u => u.rol === 'caja').length;
  }

  async guardarUsuario() {
    const nombre = this.formatearNombre(this.nuevoUsuario.nombre);
    const email = this.normalizarEmail(this.nuevoUsuario.email);
    const password = String(this.nuevoUsuario.password || '').trim();
    const rol = this.normalizarRol(this.nuevoUsuario.rol);

    if (!nombre || !rol) {
      alert('Completa nombre y rol.');
      return;
    }

    if (rol === 'admin') {
      alert('No se puede crear ni modificar administradores desde este módulo.');
      return;
    }

    if (this.existeNombreDuplicado(nombre)) {
      alert('Ya existe un usuario con ese nombre.');
      return;
    }

    if (rol === 'caja') {
      if (!email) {
        alert('El cajero necesita correo/usuario.');
        return;
      }

      if (!this.validarEmail(email)) {
        alert('Ingresa un correo válido.');
        return;
      }

      if (this.existeEmailDuplicado(email)) {
        alert('Ya existe un usuario con ese correo.');
        return;
      }

      if (!this.editando && password.length < 6) {
        alert('La contraseña debe tener mínimo 6 caracteres.');
        return;
      }

      if (this.editando && password && password.length < 6) {
        alert('La nueva contraseña debe tener mínimo 6 caracteres.');
        return;
      }
    }

    try {
      const dataGuardar: any = {
        nombre,
        rol,
        estadoActivo: this.nuevoUsuario.estadoActivo !== false,
        activo: true,
        updatedAt: new Date()
      };

      if (rol === 'caja') {
        dataGuardar.email = email;

        if (password) {
          dataGuardar.password = password;
        } else if (this.editando && this.idUsuarioEditando) {
          const usuarioActual = this.listaUsuarios.find(u => u.id === this.idUsuarioEditando);
          dataGuardar.password = usuarioActual?.password || '';
        }
      } else {
        dataGuardar.email = '';
        dataGuardar.password = '';
      }

      if (this.editando && this.idUsuarioEditando) {
        const ref = doc(this.firestore, 'usuarios', this.idUsuarioEditando);
        await updateDoc(ref, dataGuardar);

        await this.registrarHistorialUsuario('editó usuario', {
          idUsuario: this.idUsuarioEditando,
          nombre,
          rol
        });

      } else {
        const docRef = await addDoc(collection(this.firestore, 'usuarios'), {
          ...dataGuardar,
          estadoActivo: true,
          activo: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          ultimoAcceso: null
        });

        await this.registrarHistorialUsuario('creó usuario', {
          idUsuario: docRef.id,
          nombre,
          rol
        });
      }

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
      estadoActivo: usuario.estadoActivo !== false
    };

    this.mostrarFormulario = true;
  }

  async eliminarUsuario(id: string) {
    const usuario = this.listaUsuarios.find(u => u.id === id);

    if (usuario?.rol === 'admin') {
      alert('No se puede eliminar al administrador desde este módulo.');
      return;
    }

    try {
      const ref = doc(this.firestore, 'usuarios', id);

      await updateDoc(ref, {
        activo: false,
        estadoActivo: false,
        deletedAt: new Date(),
        updatedAt: new Date()
      });

      await this.registrarHistorialUsuario('desactivó usuario', {
        idUsuario: id,
        nombre: usuario?.nombre || '',
        rol: usuario?.rol || ''
      });

    } catch (error) {
      console.error('Error desactivando usuario:', error);
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

      await this.registrarHistorialUsuario(
        nuevoEstado ? 'activó usuario' : 'desactivó usuario',
        {
          idUsuario: usuario.id,
          nombre: usuario.nombre || '',
          rol: usuario.rol || ''
        }
      );

    } catch (error) {
      usuario.estadoActivo = !nuevoEstado;
      console.error('Error cambiando estado de usuario:', error);
    }
  }

  async restablecerPassword(usuario: any) {
    if (usuario.rol !== 'caja') {
      alert('Solo el usuario de caja maneja contraseña desde este módulo.');
      return;
    }

    if (!usuario.id) return;

    try {
      const nuevaPassword = '123456';
      const ref = doc(this.firestore, 'usuarios', usuario.id);

      await updateDoc(ref, {
        password: nuevaPassword,
        updatedAt: new Date()
      });

      await this.registrarHistorialUsuario('restableció contraseña', {
        idUsuario: usuario.id,
        nombre: usuario.nombre || '',
        rol: usuario.rol || ''
      });

      alert('Contraseña restablecida a: 123456');

    } catch (error) {
      console.error('Error restableciendo contraseña:', error);
    }
  }

  buscar() {
    const q = this.textoBuscar.toLowerCase().trim();

    this.usuariosFiltrados = this.listaUsuarios.filter(usuario => {
      const nombre = String(usuario.nombre || '').toLowerCase();
      const email = String(usuario.email || '').toLowerCase();
      const rol = this.obtenerNombreRol(usuario.rol).toLowerCase();
      const estado = usuario.estadoActivo !== false ? 'activo' : 'inactivo';

      const matchTexto =
        !q ||
        nombre.includes(q) ||
        email.includes(q) ||
        rol.includes(q) ||
        estado.includes(q);

      const rolVisual = this.obtenerNombreRol(usuario.rol);

      const matchRol =
        this.filtroRol === 'Todos' ||
        rolVisual === this.filtroRol;

      return matchTexto && matchRol;
    });
  }

  async registrarHistorialUsuario(accion: string, detalle: any) {
    try {
      await addDoc(collection(this.firestore, 'historial_usuarios'), {
        accion,
        detalle,
        fecha: new Date(),
        usuarioAdmin: 'Admin'
      });
    } catch (error) {
      console.warn('No se pudo registrar historial de usuario:', error);
    }
  }

  existeEmailDuplicado(email: string): boolean {
    if (!email) return false;

    return this.listaUsuarios.some(usuario => {
      const mismoUsuario = this.editando && usuario.id === this.idUsuarioEditando;

      if (mismoUsuario) return false;

      return this.normalizarEmail(usuario.email || '') === email;
    });
  }

  existeNombreDuplicado(nombre: string): boolean {
    if (!nombre) return false;

    return this.listaUsuarios.some(usuario => {
      const mismoUsuario = this.editando && usuario.id === this.idUsuarioEditando;

      if (mismoUsuario) return false;

      return this.formatearNombre(usuario.nombre || '') === nombre;
    });
  }

  validarEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  normalizarEmail(email: any): string {
    return String(email || '').trim().toLowerCase();
  }

  normalizarRol(rol: any): string {
    const r = String(rol || '').trim().toLowerCase();

    if (r === 'administrador') return 'admin';
    if (r === 'admin') return 'admin';
    if (r === 'mesera') return 'mesero';
    if (r === 'mesero') return 'mesero';
    if (r === 'cocinero') return 'cocina';
    if (r === 'cocina') return 'cocina';
    if (r === 'cajero') return 'caja';
    if (r === 'caja') return 'caja';

    return 'mesero';
  }

  formatearNombre(nombre: any): string {
    return String(nombre || '')
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, letra => letra.toUpperCase());
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