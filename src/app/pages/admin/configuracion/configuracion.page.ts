import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonIcon,
  IonButtons,
  IonMenuButton
} from '@ionic/angular/standalone';

import {
  AlertController,
  ToastController
} from '@ionic/angular';

import { addIcons } from 'ionicons';

import {
  saveOutline,
  storefrontOutline,
  timeOutline,
  printOutline,
  notificationsOutline,
  cardOutline,
  shieldOutline
} from 'ionicons/icons';

import {
  Firestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from '@angular/fire/firestore';

/* =========================================================
   TIPOS
========================================================= */

type TabConfiguracion =
  | 'general'
  | 'horarios'
  | 'impresion'
  | 'notificaciones'
  | 'pagos'
  | 'seguridad';

type DiaSemana = 'L' | 'M' | 'X' | 'J' | 'V' | 'S' | 'D';

interface ConfiguracionEmpresa {
  nombreEmpresa: string;
  ruc: string;
  direccion: string;
  telefono: string;
  email: string;
  moneda: string;
  igv: number;

  horaApertura: string;
  horaCierre: string;
  atencionDomingos: boolean;
  diasDescanso: DiaSemana[];

  impresionAutomatica: boolean;
  copiasPedido: number;
  impresoraCocina: boolean;
  modeloImpresora: string;

  alertaPedidos: boolean;
  alertaStock: boolean;
  resumenCaja: boolean;
  correoAlertas: string;

  pagoEfectivo: boolean;
  pagoTarjeta: boolean;
  pagoYape: boolean;
  numeroYape: string;

  tiempoSesion: number;
  dobleFactor: boolean;
  historialAccesos: boolean;
}

/* =========================================================
   CONFIGURACIÓN INICIAL
========================================================= */

const CONFIGURACION_INICIAL: ConfiguracionEmpresa = {
  nombreEmpresa: 'Pollería Dylan',
  ruc: '20123456789',
  direccion: 'Av. Los Ángeles 320, Comas 15314',
  telefono: '982061791',
  email: 'contacto@polleriadylan.pe',
  moneda: 'S/',
  igv: 18,

  horaApertura: '11:00',
  horaCierre: '22:00',
  atencionDomingos: true,
  diasDescanso: [],

  impresionAutomatica: true,
  copiasPedido: 2,
  impresoraCocina: true,
  modeloImpresora: 'Epson TM-T20X',

  alertaPedidos: true,
  alertaStock: true,
  resumenCaja: false,
  correoAlertas: 'contacto@polleriadylan.pe',

  pagoEfectivo: true,
  pagoTarjeta: true,
  pagoYape: true,
  numeroYape: '',

  tiempoSesion: 60,
  dobleFactor: false,
  historialAccesos: true
};

@Component({
  selector: 'app-configuracion',
  templateUrl: './configuracion.page.html',
  styleUrls: ['./configuracion.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonIcon,
    IonButtons,
    IonMenuButton
  ]
})
export class ConfiguracionPage implements OnInit {

  /* =========================================================
     SERVICIOS
  ========================================================= */

  private readonly firestore = inject(Firestore);
  private readonly toastController = inject(ToastController);
  private readonly alertController = inject(AlertController);

  /* =========================================================
     VARIABLES DE INTERFAZ
  ========================================================= */

  fechaActual = '';
  guardando = false;
  cargando = false;

  tabActual: TabConfiguracion = 'general';

  readonly diasSemana: DiaSemana[] = [
    'L',
    'M',
    'X',
    'J',
    'V',
    'S',
    'D'
  ];

  config: ConfiguracionEmpresa = {
    ...CONFIGURACION_INICIAL,
    diasDescanso: [...CONFIGURACION_INICIAL.diasDescanso]
  };

  /* =========================================================
     CONSTRUCTOR
  ========================================================= */

  constructor() {
    addIcons({
      saveOutline,
      storefrontOutline,
      timeOutline,
      printOutline,
      notificationsOutline,
      cardOutline,
      shieldOutline
    });
  }

  /* =========================================================
     CICLO DE VIDA
  ========================================================= */

  ngOnInit(): void {
    this.configurarFecha();
    void this.cargarConfiguracionFirebase();
  }

  /* =========================================================
     FECHA
  ========================================================= */

  private configurarFecha(): void {
    const opciones: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };

    const fecha = new Date().toLocaleDateString('es-PE', opciones);

    this.fechaActual =
      fecha.charAt(0).toUpperCase() + fecha.slice(1);
  }

  /* =========================================================
     PESTAÑAS
  ========================================================= */

  cambiarTab(tab: TabConfiguracion): void {
    this.tabActual = tab;
  }

  /* =========================================================
     CARGAR CONFIGURACIÓN
  ========================================================= */

  async cargarConfiguracionFirebase(): Promise<void> {
    if (this.cargando) {
      return;
    }

    this.cargando = true;

    try {
      const referencia = doc(
        this.firestore,
        'configuracion',
        'empresa'
      );

      const documento = await getDoc(referencia);

      if (!documento.exists()) {
        this.config = this.crearConfiguracionInicial();
        return;
      }

      const datosFirebase =
        documento.data() as Partial<ConfiguracionEmpresa>;

      this.config = this.normalizarConfiguracion({
        ...this.crearConfiguracionInicial(),
        ...datosFirebase
      });

    } catch (error) {
      console.error(
        'Error al cargar la configuración:',
        error
      );

      await this.mostrarToast(
        'No se pudo cargar la configuración. Se usarán los valores predeterminados.',
        'danger'
      );

    } finally {
      this.cargando = false;
    }
  }

  /* =========================================================
     GUARDAR CONFIGURACIÓN
  ========================================================= */

  async guardarConfiguracion(): Promise<void> {
    if (this.guardando || this.cargando) {
      return;
    }

    this.sincronizarConfiguracionDomingo();

    const mensajeValidacion =
      this.validarConfiguracion();

    if (mensajeValidacion) {
      await this.mostrarToast(
        mensajeValidacion,
        'warning'
      );

      return;
    }

    this.guardando = true;

    try {
      this.config = this.normalizarConfiguracion(
        this.config
      );

      const referencia = doc(
        this.firestore,
        'configuracion',
        'empresa'
      );

      await setDoc(
        referencia,
        {
          ...this.config,
          fechaActualizacion: serverTimestamp()
        },
        {
          merge: true
        }
      );

      await this.mostrarToast(
        'Configuración guardada correctamente.',
        'success'
      );

    } catch (error) {
      console.error(
        'Error al guardar la configuración:',
        error
      );

      await this.mostrarToast(
        'No se pudo guardar la configuración. Verifica tu conexión.',
        'danger'
      );

    } finally {
      this.guardando = false;
    }
  }

  /* =========================================================
     DÍAS DE DESCANSO
  ========================================================= */

  toggleDiaDescanso(dia: string): void {
    if (!this.esDiaSemana(dia)) {
      return;
    }

    const diasActuales = Array.isArray(
      this.config.diasDescanso
    )
      ? [...this.config.diasDescanso]
      : [];

    const estaSeleccionado =
      diasActuales.includes(dia);

    if (estaSeleccionado) {
      this.config.diasDescanso =
        diasActuales.filter(
          diaGuardado => diaGuardado !== dia
        );
    } else {
      this.config.diasDescanso = [
        ...diasActuales,
        dia
      ];
    }

    /*
     * Si se selecciona domingo como descanso,
     * se desactiva la atención los domingos.
     */
    if (dia === 'D') {
      this.config.atencionDomingos =
        !this.config.diasDescanso.includes('D');
    }
  }

  private sincronizarConfiguracionDomingo(): void {
    const dias = Array.isArray(
      this.config.diasDescanso
    )
      ? [...this.config.diasDescanso]
      : [];

    if (this.config.atencionDomingos) {
      this.config.diasDescanso =
        dias.filter(dia => dia !== 'D');
    } else if (!dias.includes('D')) {
      this.config.diasDescanso = [
        ...dias,
        'D'
      ];
    }
  }

  /* =========================================================
     VALIDACIONES
  ========================================================= */

  private validarConfiguracion(): string | null {
    const nombreEmpresa =
      this.config.nombreEmpresa.trim();

    const ruc =
      this.config.ruc.replace(/\D/g, '');

    const email =
      this.config.email.trim();

    const correoAlertas =
      this.config.correoAlertas.trim();

    const numeroYape =
      this.config.numeroYape.replace(/\D/g, '');

    if (!nombreEmpresa) {
      return 'Ingresa el nombre del negocio.';
    }

    if (ruc.length !== 11) {
      return 'El RUC debe contener exactamente 11 dígitos.';
    }

    if (!this.validarCorreo(email)) {
      return 'Ingresa un correo electrónico válido.';
    }

    if (!this.config.direccion.trim()) {
      return 'Ingresa la dirección del restaurante.';
    }

    if (!this.config.telefono.trim()) {
      return 'Ingresa el teléfono del restaurante.';
    }

    if (!this.config.moneda.trim()) {
      return 'Ingresa el símbolo de la moneda.';
    }

    if (
      !Number.isFinite(Number(this.config.igv)) ||
      Number(this.config.igv) < 0 ||
      Number(this.config.igv) > 100
    ) {
      return 'El IGV debe estar entre 0 y 100.';
    }

    if (!this.config.horaApertura) {
      return 'Selecciona la hora de apertura.';
    }

    if (!this.config.horaCierre) {
      return 'Selecciona la hora de cierre.';
    }

    if (
      this.config.horaApertura ===
      this.config.horaCierre
    ) {
      return 'La hora de apertura y cierre no pueden ser iguales.';
    }

    if (
      !Number.isInteger(
        Number(this.config.copiasPedido)
      ) ||
      Number(this.config.copiasPedido) < 1 ||
      Number(this.config.copiasPedido) > 10
    ) {
      return 'Las copias por pedido deben estar entre 1 y 10.';
    }

    if (
      this.config.resumenCaja &&
      !this.validarCorreo(correoAlertas)
    ) {
      return 'Ingresa un correo válido para recibir el resumen de caja.';
    }

    if (
      !this.config.pagoEfectivo &&
      !this.config.pagoTarjeta &&
      !this.config.pagoYape
    ) {
      return 'Debes habilitar al menos un método de pago.';
    }

    if (
      this.config.pagoYape &&
      numeroYape.length !== 9
    ) {
      return 'Ingresa un número de Yape válido de 9 dígitos.';
    }

    if (
      !Number.isInteger(
        Number(this.config.tiempoSesion)
      ) ||
      Number(this.config.tiempoSesion) < 5 ||
      Number(this.config.tiempoSesion) > 1440
    ) {
      return 'El tiempo de sesión debe estar entre 5 y 1440 minutos.';
    }

    return null;
  }

  private validarCorreo(correo: string): boolean {
    if (!correo) {
      return false;
    }

    const expresionCorreo =
      /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    return expresionCorreo.test(correo);
  }

  /* =========================================================
     NORMALIZACIÓN DE DATOS
  ========================================================= */

  private normalizarConfiguracion(
    datos: Partial<ConfiguracionEmpresa>
  ): ConfiguracionEmpresa {
    const diasDescanso =
      Array.isArray(datos.diasDescanso)
        ? datos.diasDescanso.filter(
            (dia): dia is DiaSemana =>
              this.esDiaSemana(dia)
          )
        : [];

    return {
      nombreEmpresa:
        String(
          datos.nombreEmpresa ??
          CONFIGURACION_INICIAL.nombreEmpresa
        ).trim(),

      ruc:
        String(
          datos.ruc ??
          CONFIGURACION_INICIAL.ruc
        ).replace(/\D/g, '').slice(0, 11),

      direccion:
        String(
          datos.direccion ??
          CONFIGURACION_INICIAL.direccion
        ).trim(),

      telefono:
        String(
          datos.telefono ??
          CONFIGURACION_INICIAL.telefono
        ).trim(),

      email:
        String(
          datos.email ??
          CONFIGURACION_INICIAL.email
        ).trim(),

      moneda:
        String(
          datos.moneda ??
          CONFIGURACION_INICIAL.moneda
        ).trim(),

      igv: this.normalizarNumero(
        datos.igv,
        CONFIGURACION_INICIAL.igv,
        0,
        100
      ),

      horaApertura:
        String(
          datos.horaApertura ??
          CONFIGURACION_INICIAL.horaApertura
        ),

      horaCierre:
        String(
          datos.horaCierre ??
          CONFIGURACION_INICIAL.horaCierre
        ),

      atencionDomingos:
        this.normalizarBooleano(
          datos.atencionDomingos,
          CONFIGURACION_INICIAL.atencionDomingos
        ),

      diasDescanso,

      impresionAutomatica:
        this.normalizarBooleano(
          datos.impresionAutomatica,
          CONFIGURACION_INICIAL.impresionAutomatica
        ),

      copiasPedido: Math.round(
        this.normalizarNumero(
          datos.copiasPedido,
          CONFIGURACION_INICIAL.copiasPedido,
          1,
          10
        )
      ),

      impresoraCocina:
        this.normalizarBooleano(
          datos.impresoraCocina,
          CONFIGURACION_INICIAL.impresoraCocina
        ),

      modeloImpresora:
        String(
          datos.modeloImpresora ??
          CONFIGURACION_INICIAL.modeloImpresora
        ).trim(),

      alertaPedidos:
        this.normalizarBooleano(
          datos.alertaPedidos,
          CONFIGURACION_INICIAL.alertaPedidos
        ),

      alertaStock:
        this.normalizarBooleano(
          datos.alertaStock,
          CONFIGURACION_INICIAL.alertaStock
        ),

      resumenCaja:
        this.normalizarBooleano(
          datos.resumenCaja,
          CONFIGURACION_INICIAL.resumenCaja
        ),

      correoAlertas:
        String(
          datos.correoAlertas ??
          CONFIGURACION_INICIAL.correoAlertas
        ).trim(),

      pagoEfectivo:
        this.normalizarBooleano(
          datos.pagoEfectivo,
          CONFIGURACION_INICIAL.pagoEfectivo
        ),

      pagoTarjeta:
        this.normalizarBooleano(
          datos.pagoTarjeta,
          CONFIGURACION_INICIAL.pagoTarjeta
        ),

      pagoYape:
        this.normalizarBooleano(
          datos.pagoYape,
          CONFIGURACION_INICIAL.pagoYape
        ),

      numeroYape:
        String(
          datos.numeroYape ??
          CONFIGURACION_INICIAL.numeroYape
        ).trim(),

      tiempoSesion: Math.round(
        this.normalizarNumero(
          datos.tiempoSesion,
          CONFIGURACION_INICIAL.tiempoSesion,
          5,
          1440
        )
      ),

      dobleFactor:
        this.normalizarBooleano(
          datos.dobleFactor,
          CONFIGURACION_INICIAL.dobleFactor
        ),

      historialAccesos:
        this.normalizarBooleano(
          datos.historialAccesos,
          CONFIGURACION_INICIAL.historialAccesos
        )
    };
  }

  private normalizarNumero(
    valor: unknown,
    valorPredeterminado: number,
    minimo: number,
    maximo: number
  ): number {
    const numero = Number(valor);

    if (!Number.isFinite(numero)) {
      return valorPredeterminado;
    }

    return Math.min(
      Math.max(numero, minimo),
      maximo
    );
  }

  private normalizarBooleano(
    valor: unknown,
    valorPredeterminado: boolean
  ): boolean {
    return typeof valor === 'boolean'
      ? valor
      : valorPredeterminado;
  }

  private esDiaSemana(
    dia: unknown
  ): dia is DiaSemana {
    return (
      typeof dia === 'string' &&
      this.diasSemana.includes(
        dia as DiaSemana
      )
    );
  }

  private crearConfiguracionInicial():
    ConfiguracionEmpresa {
    return {
      ...CONFIGURACION_INICIAL,
      diasDescanso: [
        ...CONFIGURACION_INICIAL.diasDescanso
      ]
    };
  }

  /* =========================================================
     SEGURIDAD
  ========================================================= */

  async cambiarPasswordAdmin(): Promise<void> {
    const alerta = await this.alertController.create({
      header: 'Cambiar contraseña',
      message:
        'El cambio de contraseña debe realizarse mediante Firebase Authentication. Esta función se conectará posteriormente con la cuenta del administrador.',
      buttons: [
        {
          text: 'Entendido',
          role: 'cancel'
        }
      ]
    });

    await alerta.present();
  }

  /* =========================================================
     MENSAJES
  ========================================================= */

  private async mostrarToast(
    mensaje: string,
    color:
      | 'success'
      | 'danger'
      | 'warning'
      | 'primary'
  ): Promise<void> {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2800,
      position: 'bottom',
      color,
      buttons: [
        {
          text: 'Cerrar',
          role: 'cancel'
        }
      ]
    });

    await toast.present();
  }
}