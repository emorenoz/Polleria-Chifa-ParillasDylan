import { Component, OnInit } from '@angular/core';
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
  IonItemOption
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { people, create, trash } from 'ionicons/icons';

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
    IonItemOption
  ]
})
export class UsuariosPage implements OnInit {

  // Modelo reactivo conectado con los inputs del HTML
  nuevoUsuario = {
    nombre: '',
    email: '',
    password: '',
    rol: ''
  };

  editando: boolean = false;
  idUsuarioEditando: string | null = null; // String acoplado para mapear los UIDs alfanuméricos de Firebase Auth

  // Datos semilla locales para emular los roles del restaurante
  listaUsuarios: any[] = [
    { id: 'usr_1', nombre: 'Administrador Dylan', email: 'admin@polleriadylan.com', rol: 'admin' },
    { id: 'usr_2', nombre: 'Carlos Mendoza', email: 'carlos.caja@gmail.com', rol: 'cajero' },
    { id: 'usr_3', nombre: 'Ana Flores', email: 'ana.atencion@hotmail.com', rol: 'mesero' }
  ];

  constructor() {
    // Registro de iconos obligatorios en componentes Standalone
    addIcons({ people, create, trash });
  }

  async ngOnInit() {
    await this.cargarUsuariosFirebase();
  }

  // Simulación de lectura asíncrona de colecciones de seguridad
  async cargarUsuariosFirebase() {
    // Cuando integres Firebase: leerás desde la colección 'usuarios' mapeada por UID
  }

  // Crea un usuario en la plataforma o actualiza sus roles y nombres
  async guardarUsuario() {
    if (!this.nuevoUsuario.nombre.trim() || !this.nuevoUsuario.email.trim() || (!this.editando && !this.nuevoUsuario.password) || !this.nuevoUsuario.rol) return;

    if (this.editando && this.idUsuarioEditando !== null) {
      // Simula: db.collection('usuarios').doc(id).update({ nombre, rol })
      const index = this.listaUsuarios.findIndex(u => u.id === this.idUsuarioEditando);
      if (index !== -1) {
        this.listaUsuarios[index].nombre = this.nuevoUsuario.nombre.trim();
        this.listaUsuarios[index].rol = this.nuevoUsuario.rol;
      }
      this.cancelarEdicion();
    } else {
      // Simula el flujo compuesto: 1. Crear en Firebase Auth -> 2. Guardar en Firestore con el UID resultante
      const mockFirebaseUid = 'auth_uid_' + Math.random().toString(36).substr(2, 9);
      this.listaUsuarios.push({
        id: mockFirebaseUid,
        nombre: this.nuevoUsuario.nombre.trim(),
        email: this.nuevoUsuario.email.trim().toLowerCase(),
        rol: this.nuevoUsuario.rol
      });
    }

    this.limpiarFormulario();
  }

  // Carga el registro seleccionado en los campos del formulario superior para editarlo
  seleccionarUsuario(usuario: any) {
    this.editando = true;
    this.idUsuarioEditando = usuario.id;
    this.nuevoUsuario = {
      nombre: usuario.nombre,
      email: usuario.email,
      password: '', // Por seguridad no se extrae la clave
      rol: usuario.rol
    };
  }

  cancelarEdicion() {
    this.editando = false;
    this.idUsuarioEditando = null;
    this.limpiarFormulario();
  }

  // Simula: Inhabilitar o borrar de Auth y de Firestore
  async eliminarUsuario(id: string) {
    this.listaUsuarios = this.listaUsuarios.filter(u => u.id !== id);
  }

  limpiarFormulario() {
    this.nuevoUsuario = {
      nombre: '',
      email: '',
      password: '',
      rol: ''
    };
  }
}