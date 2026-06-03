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
  IonBackButton
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { people, create, trash, arrowBack } from 'ionicons/icons';

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
    IonBackButton
  ]
})
export class UsuariosPage implements OnInit {

  private firestore = inject(Firestore);

  nuevoUsuario = {
    nombre: '',
    email: '',
    password: '',
    rol: ''
  };

  editando = false;
  idUsuarioEditando: string | null = null;

  listaUsuarios: any[] = [];

  constructor() {
    addIcons({ people, create, trash, arrowBack });
  }

  async ngOnInit() {
    await this.cargarUsuariosFirebase();
  }

  // 🔥 CARGAR USUARIOS DESDE FIREBASE
  async cargarUsuariosFirebase() {

    try {

      const snapshot = await getDocs(
        collection(this.firestore, 'usuarios')
      );

      this.listaUsuarios = [];

      snapshot.forEach(docSnap => {

        const data: any = docSnap.data();

        this.listaUsuarios.push({
          id: docSnap.id,
          nombre: data.nombre || '',
          email: data.email || '',
          rol: data.rol || ''
        });

      });

    } catch (error) {
      console.error('Error cargando usuarios:', error);
    }

  }

  // 🔥 GUARDAR (CREATE / UPDATE)
  async guardarUsuario() {

    if (
      !this.nuevoUsuario.nombre.trim() ||
      !this.nuevoUsuario.email.trim() ||
      (!this.editando && !this.nuevoUsuario.password) ||
      !this.nuevoUsuario.rol
    ) return;

    try {

      // UPDATE
      if (this.editando && this.idUsuarioEditando) {

        const ref = doc(this.firestore, 'usuarios', this.idUsuarioEditando);

        await updateDoc(ref, {
          nombre: this.nuevoUsuario.nombre.trim(),
          rol: this.nuevoUsuario.rol
        });

        this.cancelarEdicion();

      } else {

        // CREATE
        await addDoc(collection(this.firestore, 'usuarios'), {
          nombre: this.nuevoUsuario.nombre.trim(),
          email: this.nuevoUsuario.email.trim().toLowerCase(),
          rol: this.nuevoUsuario.rol,
          createdAt: new Date()
        });

      }

      await this.cargarUsuariosFirebase();
      this.limpiarFormulario();

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
      rol: usuario.rol
    };
  }

  cancelarEdicion() {
    this.editando = false;
    this.idUsuarioEditando = null;
    this.limpiarFormulario();
  }

  // 🔥 DELETE FIREBASE
  async eliminarUsuario(id: string) {

    try {

      await deleteDoc(
        doc(this.firestore, 'usuarios', id)
      );

      await this.cargarUsuariosFirebase();

    } catch (error) {
      console.error('Error eliminando usuario:', error);
    }

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