import {
  Component,
  OnInit,
  OnDestroy,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonIcon,
  IonCard,
  IonButton
} from '@ionic/angular/standalone';

import {
  Firestore,
  collection,
  collectionData
} from '@angular/fire/firestore';

import { Subscription } from 'rxjs';

import { addIcons } from 'ionicons';

import {
  restaurantOutline,
  flameOutline,
  chevronForwardOutline,
  arrowBackOutline
} from 'ionicons/icons';

interface Cocinero {
  id: string;
  nombre: string;
  rol: 'cocina';
  estadoActivo: boolean;
  activo: boolean;
}

@Component({
  selector: 'app-seleccionar-cocina',
  templateUrl: './seleccionar-cocina.page.html',
  styleUrls: ['./seleccionar-cocina.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonIcon,
    IonCard,
    IonButton
  ]
})
export class SeleccionarCocinaPage implements OnInit, OnDestroy {

  private firestore = inject(Firestore);
  private router = inject(Router);

  private cocinerosSub?: Subscription;

  cocineros: Cocinero[] = [];
  cocineroSeleccionado: Cocinero | null = null;

  cargando = true;
  ingresando = false;
  mensajeError = '';

  constructor() {
    addIcons({
      restaurantOutline,
      flameOutline,
      chevronForwardOutline,
      arrowBackOutline
    });
  }

  ngOnInit(): void {
    this.cargarCocineros();
  }

  ngOnDestroy(): void {
    this.cocinerosSub?.unsubscribe();
  }

  volver(): void {
    this.router.navigate(['/select-role']);
  }

  cargarCocineros(): void {
    this.cargando = true;
    this.mensajeError = '';

    this.cocinerosSub?.unsubscribe();

    const usuariosRef = collection(
      this.firestore,
      'usuarios'
    );

    this.cocinerosSub = collectionData(
      usuariosRef,
      { idField: 'id' }
    ).subscribe({
      next: (usuarios: any[]) => {
        this.cocineros = (usuarios || [])
          .filter(usuario =>
            this.normalizarRol(usuario.rol) === 'cocina' &&
            usuario.estadoActivo !== false &&
            usuario.activo !== false
          )
          .map(usuario => ({
            id: String(usuario.id || ''),
            nombre: this.formatearNombre(usuario.nombre),
            rol: 'cocina' as const,
            estadoActivo: usuario.estadoActivo !== false,
            activo: usuario.activo !== false
          }))
          .filter(cocinero =>
            cocinero.id &&
            cocinero.nombre !== 'Sin Nombre'
          )
          .sort((a, b) =>
            a.nombre.localeCompare(
              b.nombre,
              'es',
              { sensitivity: 'base' }
            )
          );

        if (
          this.cocineroSeleccionado &&
          !this.cocineros.some(
            cocinero =>
              cocinero.id === this.cocineroSeleccionado?.id
          )
        ) {
          this.cocineroSeleccionado = null;
        }

        this.cargando = false;

        console.log(
          '✅ Cocineros disponibles:',
          this.cocineros.length
        );
      },

      error: (error) => {
        console.error(
          '❌ Error cargando cocineros:',
          error
        );

        this.cocineros = [];
        this.cocineroSeleccionado = null;
        this.mensajeError =
          'No se pudo cargar el personal de cocina.';
        this.cargando = false;
      }
    });
  }

  seleccionarCocinero(cocinero: Cocinero): void {
    if (this.ingresando) return;

    this.cocineroSeleccionado = cocinero;
    this.mensajeError = '';
  }

  async ingresarComoCocinero(): Promise<void> {
    if (
      !this.cocineroSeleccionado ||
      this.ingresando
    ) {
      return;
    }

    this.ingresando = true;
    this.mensajeError = '';

    try {
      localStorage.setItem(
        'usuarioId',
        this.cocineroSeleccionado.id
      );

      localStorage.setItem(
        'usuarioNombre',
        this.cocineroSeleccionado.nombre
      );

      localStorage.setItem(
        'usuarioRol',
        'cocina'
      );

      localStorage.setItem(
        'sesionOperativa',
        JSON.stringify({
          id: this.cocineroSeleccionado.id,
          nombre: this.cocineroSeleccionado.nombre,
          rol: 'cocina',
          fechaIngreso: new Date().toISOString()
        })
      );

      const navegacionCorrecta = await this.router.navigate(
        ['/cocina-dashboard'],
        {
          replaceUrl: true
        }
      );

      if (!navegacionCorrecta) {
        throw new Error(
          'La navegación al dashboard de cocina fue rechazada.'
        );
      }

    } catch (error) {
      console.error(
        '❌ Error ingresando a cocina:',
        error
      );

      this.mensajeError =
        'No se pudo iniciar la sesión de cocina.';

      this.ingresando = false;
    }
  }

  obtenerInicial(nombre: string): string {
    const nombreLimpio = String(nombre || '').trim();

    return nombreLimpio
      ? nombreLimpio.charAt(0).toUpperCase()
      : '?';
  }

  trackByCocinero(
    index: number,
    cocinero: Cocinero
  ): string {
    return cocinero.id;
  }

  private normalizarRol(rol: any): string {
    const valor = String(rol || '')
      .trim()
      .toLowerCase();

    if (
      valor === 'cocinero' ||
      valor === 'cocinera' ||
      valor === 'chef'
    ) {
      return 'cocina';
    }

    return valor;
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
      .replace(/\b\p{L}/gu, letra =>
        letra.toUpperCase()
      );
  }
}