import {
  Component,
  OnDestroy,
  OnInit,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonBackButton,
  IonIcon,
  IonCard,
  IonButton,
  IonSpinner
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';

import {
  personOutline,
  restaurantOutline,
  arrowForwardOutline,
  refreshOutline,
  arrowBackOutline
} from 'ionicons/icons';

import {
  Firestore,
  collection,
  collectionData
} from '@angular/fire/firestore';

import { Subscription } from 'rxjs';

interface UsuarioMesero {
  id: string;
  nombre: string;
  rol: 'mesero';
  estadoActivo: boolean;
  activo: boolean;
}

@Component({
  selector: 'app-seleccionar-mesero',
  templateUrl: './seleccionar-mesero.page.html',
  styleUrls: ['./seleccionar-mesero.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonBackButton,
    IonIcon,
    IonCard,
    IonButton,
    IonSpinner
  ]
})
export class SeleccionarMeseroPage implements OnInit, OnDestroy {

  private firestore = inject(Firestore);
  private router = inject(Router);

  private usuariosSub?: Subscription;

  listaMeseros: UsuarioMesero[] = [];
  meseroSeleccionado: UsuarioMesero | null = null;

  cargando = true;
  ingresando = false;
  mensajeError = '';

  constructor() {
    addIcons({
      personOutline,
      restaurantOutline,
      arrowForwardOutline,
      refreshOutline,
      arrowBackOutline
    });
  }

  ngOnInit(): void {
    this.cargarMeseros();
  }

  ngOnDestroy(): void {
    this.usuariosSub?.unsubscribe();
  }

  volver(): void {
    this.router.navigate(['/select-role']);
  }

  cargarMeseros(): void {
    this.cargando = true;
    this.mensajeError = '';

    this.usuariosSub?.unsubscribe();

    const usuariosRef = collection(
      this.firestore,
      'usuarios'
    );

    this.usuariosSub = collectionData(
      usuariosRef,
      { idField: 'id' }
    ).subscribe({
      next: (usuarios: any[]) => {
        this.listaMeseros = (usuarios || [])
          .filter(usuario =>
            this.normalizarRol(usuario.rol) === 'mesero' &&
            usuario.estadoActivo !== false &&
            usuario.activo !== false
          )
          .map(usuario => ({
            id: String(usuario.id || '').trim(),
            nombre: this.formatearNombre(usuario.nombre),
            rol: 'mesero' as const,
            estadoActivo: usuario.estadoActivo !== false,
            activo: usuario.activo !== false
          }))
          .filter(mesero =>
            mesero.id &&
            mesero.nombre !== 'Sin Nombre'
          )
          .sort((a, b) =>
            a.nombre.localeCompare(
              b.nombre,
              'es',
              { sensitivity: 'base' }
            )
          );

        if (
          this.meseroSeleccionado &&
          !this.listaMeseros.some(
            mesero =>
              mesero.id === this.meseroSeleccionado?.id
          )
        ) {
          this.meseroSeleccionado = null;
        }

        this.cargando = false;

        console.log(
          '✅ Meseros disponibles:',
          this.listaMeseros.length
        );
      },

      error: error => {
        console.error(
          '❌ Error cargando meseros:',
          error
        );

        this.listaMeseros = [];
        this.meseroSeleccionado = null;
        this.mensajeError =
          'No se pudo cargar la lista de meseros.';
        this.cargando = false;
      }
    });
  }

  seleccionarMesero(mesero: UsuarioMesero): void {
    if (this.ingresando) return;

    this.meseroSeleccionado = mesero;
    this.mensajeError = '';
  }

  async ingresarComoMesero(): Promise<void> {
    if (
      !this.meseroSeleccionado ||
      this.ingresando
    ) {
      return;
    }

    this.ingresando = true;
    this.mensajeError = '';

    try {
      localStorage.setItem(
        'usuarioId',
        this.meseroSeleccionado.id
      );

      localStorage.setItem(
        'usuarioNombre',
        this.meseroSeleccionado.nombre
      );

      localStorage.setItem(
        'usuarioRol',
        'mesero'
      );

      localStorage.setItem(
        'sesionOperativa',
        JSON.stringify({
          id: this.meseroSeleccionado.id,
          nombre: this.meseroSeleccionado.nombre,
          rol: 'mesero',
          fechaIngreso: new Date().toISOString()
        })
      );

      const navegacionCorrecta =
        await this.router.navigate(
          ['/mesero-dashboard'],
          {
            replaceUrl: true
          }
        );

      if (!navegacionCorrecta) {
        throw new Error(
          'La navegación al dashboard del mesero fue rechazada.'
        );
      }

    } catch (error) {
      console.error(
        '❌ Error ingresando como mesero:',
        error
      );

      this.mensajeError =
        'No se pudo iniciar la sesión del mesero.';

      this.ingresando = false;
    }
  }

  trackByMesero(
    index: number,
    mesero: UsuarioMesero
  ): string {
    return mesero.id;
  }

  obtenerInicial(nombre: string): string {
    const nombreLimpio = String(nombre || '').trim();

    return nombreLimpio
      ? nombreLimpio.charAt(0).toUpperCase()
      : '?';
  }

  private formatearNombre(nombre: any): string {
    const nombreLimpio = String(nombre || '')
      .trim()
      .replace(/\s+/g, ' ');

    if (!nombreLimpio) {
      return 'Sin Nombre';
    }

    return nombreLimpio
      .toLowerCase()
      .replace(
        /\b\p{L}/gu,
        letra => letra.toUpperCase()
      );
  }

  private normalizarRol(rol: any): string {
    const valor = String(rol || '')
      .trim()
      .toLowerCase();

    if (
      valor === 'mesera' ||
      valor === 'mozo' ||
      valor === 'moza'
    ) {
      return 'mesero';
    }

    return valor;
  }
}