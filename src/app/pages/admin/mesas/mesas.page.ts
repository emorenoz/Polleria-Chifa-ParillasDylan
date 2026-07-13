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
  IonMenuButton,
  AlertController,
  ToastController
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';

import {
  create,
  trash,
  arrowBack,
  addOutline,
  closeOutline,
  peopleOutline,
  timeOutline,
  personOutline,
  documentTextOutline,
  restaurantOutline
} from 'ionicons/icons';

import {
  Firestore,
  collection,
  collectionData,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where
} from '@angular/fire/firestore';

import { Subscription } from 'rxjs';

type EstadoMesa =
  | 'libre'
  | 'activa'
  | 'preparando'
  | 'listo'
  | 'entregado_mesa'
  | 'cuenta'
  | 'pagado'
  | 'reservada';

type EstadoPedido =
  | 'pendiente_cocina'
  | 'preparando'
  | 'listo'
  | 'entregado_mesa'
  | 'cuenta'
  | 'pagado'
  | 'anulado';

@Component({
  selector: 'app-mesas',
  templateUrl: './mesas.page.html',
  styleUrls: ['./mesas.page.scss'],
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
export class MesasPage implements OnInit, OnDestroy {

  private firestore = inject(Firestore);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);

  private mesasSub?: Subscription;
  private pedidosSub?: Subscription;

  fechaActual = '';

  mesaSeleccionada: any = null;
  mostrarFormulario = false;

  totalLibres = 0;
  totalActivas = 0;
  totalReservadas = 0;
  totalListas = 0;
  totalEnCuenta = 0;

  nuevaMesa = {
    numero: '',
    capacidad: null as number | null,
    estado: 'libre' as EstadoMesa
  };

  editando = false;
  idMesaEditando: string | null = null;

  listaMesas: any[] = [];

  /*
   * Los pedidos activos se mantienen en memoria.
   * De esta manera no se consulta Firestore cada vez
   * que se abre el detalle de una mesa.
   */
  listaPedidosActivos: any[] = [];
  pedidosActivosCargados = false;

  mostrarPedidoMesa = false;
  pedidoMesaActual: any[] = [];
  totalPedidoMesa = 0;
  horaInicioMesa = '';
  estadoPedidoMesa = '';
  meseroPedidoMesa = '';
  clientePedidoMesa = '';

  constructor() {
    addIcons({
      create,
      trash,
      arrowBack,
      addOutline,
      closeOutline,
      peopleOutline,
      timeOutline,
      personOutline,
      documentTextOutline,
      restaurantOutline
    });
  }

  ngOnInit(): void {
    this.configurarFecha();
    this.cargarMesasFirebase();
    this.cargarPedidosActivosFirebase();
  }

  ngOnDestroy(): void {
    this.mesasSub?.unsubscribe();
    this.pedidosSub?.unsubscribe();
  }

  configurarFecha(): void {
    const opciones: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };

    this.fechaActual = new Date().toLocaleDateString(
      'es-PE',
      opciones
    );
  }

  // =========================================================
  // MESAS EN TIEMPO REAL
  // =========================================================

  cargarMesasFirebase(): void {
    this.mesasSub?.unsubscribe();

    const mesasRef = collection(this.firestore, 'mesas');

    this.mesasSub = collectionData(
      mesasRef,
      { idField: 'id' }
    ).subscribe({
      next: (mesas: any[]) => {
        this.listaMesas = mesas
          .map((mesa: any) => ({
            ...mesa,
            estado: this.normalizarEstadoMesa(mesa.estado),
            pedido: Array.isArray(mesa.pedido)
              ? mesa.pedido
              : [],
            capacidad: Number(mesa.capacidad || 0),
            numero: String(mesa.numero || '')
          }))
          .sort((a: any, b: any) =>
            this.compararNumeroMesas(a.numero, b.numero)
          );

        if (this.mesaSeleccionada?.id) {
          const mesaActualizada = this.listaMesas.find(
            mesa => mesa.id === this.mesaSeleccionada.id
          );

          if (mesaActualizada) {
            this.mesaSeleccionada = mesaActualizada;
          } else {
            this.mesaSeleccionada = null;
            this.mostrarPedidoMesa = false;
            this.limpiarPedidoMesa();
          }
        }

        this.calcularMetricas();
      },
      error: async (error) => {
        console.error(
          '❌ Error cargando mesas en tiempo real:',
          error
        );

        await this.mostrarToast(
          'No se pudieron cargar las mesas.',
          'danger'
        );
      }
    });
  }

  // =========================================================
  // PEDIDOS ACTIVOS EN TIEMPO REAL
  // =========================================================

  cargarPedidosActivosFirebase(): void {
    this.pedidosSub?.unsubscribe();

    const pedidosActivosQuery = query(
      collection(this.firestore, 'pedidos'),
      where('estado', 'in', [
        'pendiente_cocina',
        'preparando',
        'listo',
        'entregado_mesa',
        'cuenta'
      ])
    );

    this.pedidosSub = collectionData(
      pedidosActivosQuery,
      { idField: 'id' }
    ).subscribe({
      next: (pedidos: any[]) => {
        this.listaPedidosActivos = pedidos.map(
          (pedido: any) => ({
            ...pedido,
            estado: this.normalizarEstadoPedido(
              pedido.estado
            )
          })
        );

        this.pedidosActivosCargados = true;

        /*
         * Si el detalle de una mesa está abierto,
         * se actualiza automáticamente cuando cambia
         * el pedido en Firestore.
         */
        if (
          this.mostrarPedidoMesa &&
          this.mesaSeleccionada?.id
        ) {
          this.cargarPedidoDesdeMemoria(
            this.mesaSeleccionada
          );
        }
      },
      error: async (error) => {
        this.pedidosActivosCargados = true;

        console.error(
          '❌ Error cargando pedidos activos:',
          error
        );

        await this.mostrarToast(
          'No se pudieron cargar los pedidos activos.',
          'danger'
        );
      }
    });
  }

  // =========================================================
  // SELECCIÓN Y FORMULARIO
  // =========================================================

  seleccionarMesaVisual(mesa: any): void {
    this.mesaSeleccionada = {
      ...mesa,
      estado: this.normalizarEstadoMesa(mesa.estado),
      pedido: Array.isArray(mesa.pedido)
        ? mesa.pedido
        : []
    };

    this.mostrarFormulario = false;
    this.editando = false;
    this.idMesaEditando = null;
    this.mostrarPedidoMesa = false;

    this.limpiarPedidoMesa();
  }

  abrirFormularioNuevaMesa(): void {
    this.limpiarFormulario();

    this.editando = false;
    this.idMesaEditando = null;
    this.mostrarFormulario = true;
    this.mesaSeleccionada = null;
    this.mostrarPedidoMesa = false;

    this.limpiarPedidoMesa();
  }

  iniciarEdicion(): void {
    if (!this.mesaSeleccionada) {
      return;
    }

    this.editando = true;
    this.mostrarFormulario = true;
    this.idMesaEditando = this.mesaSeleccionada.id;

    this.nuevaMesa = {
      numero: String(
        this.mesaSeleccionada.numero || ''
      ),
      capacidad: Number(
        this.mesaSeleccionada.capacidad || 0
      ),
      estado: this.normalizarEstadoMesa(
        this.mesaSeleccionada.estado
      )
    };
  }

  cerrarPanel(): void {
    this.mostrarFormulario = false;
    this.editando = false;
    this.idMesaEditando = null;

    this.limpiarFormulario();
  }

  // =========================================================
  // MÉTRICAS
  // =========================================================

  calcularMetricas(): void {
    this.totalLibres = this.listaMesas.filter(
      mesa => mesa.estado === 'libre'
    ).length;

    this.totalActivas = this.listaMesas.filter(
      mesa =>
        [
          'activa',
          'preparando',
          'entregado_mesa'
        ].includes(mesa.estado)
    ).length;

    this.totalReservadas = this.listaMesas.filter(
      mesa => mesa.estado === 'reservada'
    ).length;

    this.totalListas = this.listaMesas.filter(
      mesa => mesa.estado === 'listo'
    ).length;

    this.totalEnCuenta = this.listaMesas.filter(
      mesa => mesa.estado === 'cuenta'
    ).length;
  }

  // =========================================================
  // DETALLE DEL PEDIDO
  // =========================================================

  async verPedidoCompleto(mesa: any): Promise<void> {
    if (!mesa?.id) {
      return;
    }

    /*
     * Si se pulsa una mesa diferente mientras el detalle
     * está abierto, se abre directamente la nueva mesa.
     */
    const esLaMismaMesa =
      this.mesaSeleccionada?.id === mesa.id;

    if (this.mostrarPedidoMesa && esLaMismaMesa) {
      this.mostrarPedidoMesa = false;
      this.limpiarPedidoMesa();
      return;
    }

    this.mesaSeleccionada = {
      ...mesa,
      estado: this.normalizarEstadoMesa(mesa.estado),
      pedido: Array.isArray(mesa.pedido)
        ? mesa.pedido
        : []
    };

    this.mostrarPedidoMesa = true;
    this.limpiarPedidoMesa();

    if (!this.pedidosActivosCargados) {
      this.horaInicioMesa = 'Cargando pedido...';
      return;
    }

    this.cargarPedidoDesdeMemoria(mesa);
  }

  private cargarPedidoDesdeMemoria(mesa: any): void {
    if (!mesa?.id) {
      return;
    }

    this.limpiarPedidoMesa();

    const pedidosDeLaMesa = this.listaPedidosActivos.filter(
      pedido => this.pedidoPerteneceAMesa(pedido, mesa)
    );

    if (pedidosDeLaMesa.length === 0) {
      this.horaInicioMesa = 'Sin pedido activo';
      return;
    }

    const pedidoEncontrado = pedidosDeLaMesa.reduce(
      (pedidoMasReciente: any, pedidoActual: any) => {
        const fechaActual = this.obtenerFechaPedido(
          pedidoActual
        ).getTime();

        const fechaAnterior = this.obtenerFechaPedido(
          pedidoMasReciente
        ).getTime();

        return fechaActual > fechaAnterior
          ? pedidoActual
          : pedidoMasReciente;
      }
    );

    this.horaInicioMesa = this.convertirHora(
      pedidoEncontrado.fecha ||
      pedidoEncontrado.fechaPedido ||
      pedidoEncontrado.creadoEn
    );

    this.estadoPedidoMesa = this.obtenerEstadoTextoPedido(
      pedidoEncontrado.estado
    );

    this.meseroPedidoMesa =
      pedidoEncontrado.mesero ||
      pedidoEncontrado.nombreMesero ||
      'No asignado';

    this.clientePedidoMesa =
      pedidoEncontrado.clienteNombre ||
      pedidoEncontrado.nombreCliente ||
      pedidoEncontrado.cliente?.nombre ||
      'Cliente general';

    const productos =
      pedidoEncontrado.productos ||
      pedidoEncontrado.items ||
      pedidoEncontrado.detalle ||
      [];

    this.pedidoMesaActual = Array.isArray(productos)
      ? productos.map((item: any, index: number) => {
          const cantidad = Number(
            item.cantidad || 1
          );

          const precio = Number(
            item.precio ??
            item.precioUnitario ??
            0
          );

          const subtotalGuardado = Number(
            item.subtotal
          );

          const subtotal = Number.isFinite(
            subtotalGuardado
          )
            ? subtotalGuardado
            : cantidad * precio;

          return {
            id:
              item.id ||
              item.idProducto ||
              `${pedidoEncontrado.id}-${index}`,
            nombre:
              item.nombre ||
              item.producto ||
              item.nombreProducto ||
              'Producto',
            cantidad,
            precio,
            subtotal
          };
        })
      : [];

    const totalCalculado = this.pedidoMesaActual.reduce(
      (total: number, item: any) =>
        total + Number(item.subtotal || 0),
      0
    );

    /*
     * Se usa el total almacenado solamente cuando existe
     * y es válido. De lo contrario, se calcula con los productos.
     */
    const totalGuardado = Number(
      pedidoEncontrado.total
    );

    this.totalPedidoMesa =
      Number.isFinite(totalGuardado) &&
      totalGuardado >= 0
        ? totalGuardado
        : totalCalculado;
  }

  private pedidoPerteneceAMesa(
    pedido: any,
    mesa: any
  ): boolean {
    if (!pedido || !mesa) {
      return false;
    }

    /*
     * Forma principal usada por tu sistema:
     * pedido.idMesa === mesa.id
     */
    if (
      pedido.idMesa &&
      String(pedido.idMesa) === String(mesa.id)
    ) {
      return true;
    }

    /*
     * Compatibilidad con posibles documentos antiguos.
     */
    if (
      pedido.mesaId &&
      String(pedido.mesaId) === String(mesa.id)
    ) {
      return true;
    }

    const numeroPedido =
      pedido.numeroMesa ??
      pedido.mesaNumero ??
      pedido.mesa;

    if (
      numeroPedido !== undefined &&
      numeroPedido !== null
    ) {
      return (
        this.normalizarNumeroMesaComparacion(
          numeroPedido
        ) ===
        this.normalizarNumeroMesaComparacion(
          mesa.numero
        )
      );
    }

    return false;
  }

  private obtenerFechaPedido(pedido: any): Date {
    return this.convertirFecha(
      pedido?.fecha ||
      pedido?.fechaPedido ||
      pedido?.creadoEn ||
      pedido?.fechaCreacion
    );
  }

  // =========================================================
  // LIBERAR MESA
  // =========================================================

  async liberarMesaRapida(mesa: any): Promise<void> {
    if (!mesa?.id) {
      return;
    }

    const confirmar = await this.confirmarAccion(
      'Liberar mesa',
      '¿Deseas liberar esta mesa desde administración? ' +
      'Si tiene un pedido activo, será marcado como anulado.',
      'Liberar mesa'
    );

    if (!confirmar) {
      return;
    }

    try {
      /*
       * Los pedidos se obtienen desde la lista en memoria.
       * Ya no se ejecuta getDocs() cada vez que se libera.
       */
      const pedidosDeLaMesa =
        this.listaPedidosActivos.filter(
          pedido => this.pedidoPerteneceAMesa(
            pedido,
            mesa
          )
        );

      for (const pedido of pedidosDeLaMesa) {
        if (!pedido.id) {
          continue;
        }

        const pedidoRef = doc(
          this.firestore,
          'pedidos',
          pedido.id
        );

        await updateDoc(pedidoRef, {
          estado: 'anulado',
          motivoAnulacion:
            'Mesa liberada desde administración',
          fechaActualizacion: new Date()
        });
      }

      const mesaRef = doc(
        this.firestore,
        'mesas',
        mesa.id
      );

      await updateDoc(mesaRef, {
        estado: 'libre',
        pedido: [],
        mesero: '',
        pedidoEnCocina: false,
        pedidoListo: false,
        pedidoEntregadoMesa: false,
        notificacionMesero: false,
        fechaPedido: null,
        fechaPedidoCocina: null,
        fechaEntregadoMesa: null,
        fechaCuenta: null
      });

      this.mesaSeleccionada = {
        ...mesa,
        estado: 'libre',
        pedido: []
      };

      this.mostrarPedidoMesa = false;
      this.limpiarPedidoMesa();

      await this.mostrarToast(
        `Mesa ${mesa.numero} liberada correctamente.`,
        'success'
      );

    } catch (error) {
      console.error(
        '❌ Error en flujo de liberación rápida:',
        error
      );

      await this.mostrarAlerta(
        'Error',
        'No se pudo liberar la mesa. Revisa tu conexión e inténtalo nuevamente.'
      );
    }
  }

  // =========================================================
  // GUARDAR MESA
  // =========================================================

  async guardarMesa(): Promise<void> {
    const numeroMesa = String(
      this.nuevaMesa.numero || ''
    ).trim();

    const capacidad = Number(
      this.nuevaMesa.capacidad
    );

    if (!numeroMesa) {
      await this.mostrarAlerta(
        'Número requerido',
        'Debes ingresar el número de la mesa.'
      );
      return;
    }

    if (
      !Number.isFinite(capacidad) ||
      capacidad <= 0
    ) {
      await this.mostrarAlerta(
        'Capacidad incorrecta',
        'La capacidad debe ser mayor que cero.'
      );
      return;
    }

    /*
     * Validación para impedir mesas repetidas.
     * Cuando se está editando, se excluye la mesa actual.
     */
    const numeroNormalizado =
      this.normalizarNumeroMesaComparacion(
        numeroMesa
      );

    const mesaDuplicada = this.listaMesas.some(
      mesa => {
        const esLaMesaEditada =
          this.editando &&
          mesa.id === this.idMesaEditando;

        if (esLaMesaEditada) {
          return false;
        }

        return (
          this.normalizarNumeroMesaComparacion(
            mesa.numero
          ) === numeroNormalizado
        );
      }
    );

    if (mesaDuplicada) {
      await this.mostrarAlerta(
        'Mesa duplicada',
        `Ya existe una mesa registrada con el número ${numeroMesa}.`
      );
      return;
    }

    const mesaData = {
      numero: numeroMesa,
      capacidad,
      estado: this.normalizarEstadoMesa(
        this.nuevaMesa.estado
      ),
      pedido: []
    };

    try {
      if (
        this.editando &&
        this.idMesaEditando
      ) {
        const mesaRef = doc(
          this.firestore,
          'mesas',
          this.idMesaEditando
        );

        await updateDoc(mesaRef, {
          numero: mesaData.numero,
          capacidad: mesaData.capacidad,
          estado: mesaData.estado
        });

        await this.mostrarToast(
          `Mesa ${numeroMesa} actualizada correctamente.`,
          'success'
        );

      } else {
        await addDoc(
          collection(this.firestore, 'mesas'),
          mesaData
        );

        await this.mostrarToast(
          `Mesa ${numeroMesa} registrada correctamente.`,
          'success'
        );
      }

      this.mostrarFormulario = false;
      this.editando = false;
      this.idMesaEditando = null;

      this.limpiarFormulario();

    } catch (error) {
      console.error(
        '❌ Error guardando mesa:',
        error
      );

      await this.mostrarAlerta(
        'Error al guardar',
        'No se pudo guardar la mesa. Revisa tu conexión e inténtalo nuevamente.'
      );
    }
  }

  // =========================================================
  // ELIMINAR MESA
  // =========================================================

  async confirmarEliminacion(
    id: string
  ): Promise<void> {
    const idFinal =
      id || this.mesaSeleccionada?.id;

    if (!idFinal) {
      await this.mostrarAlerta(
        'Error',
        'No se pudo identificar la mesa seleccionada.'
      );
      return;
    }

    const mesa = this.listaMesas.find(
      item => item.id === idFinal
    );

    if (!mesa) {
      await this.mostrarAlerta(
        'Mesa no encontrada',
        'La mesa seleccionada ya no existe o fue eliminada.'
      );
      return;
    }

    if (mesa.estado !== 'libre') {
      await this.mostrarAlerta(
        'No se puede eliminar',
        'No puedes eliminar una mesa ocupada, activa, lista, reservada o en cuenta. Primero debes liberarla.'
      );
      return;
    }

    const confirmar = await this.confirmarAccion(
      'Eliminar mesa',
      `¿Estás seguro de que deseas eliminar permanentemente la mesa ${mesa.numero}?`,
      'Eliminar'
    );

    if (confirmar) {
      await this.eliminarMesa(idFinal);
    }
  }

  async eliminarMesa(id: string): Promise<void> {
    try {
      const mesa = this.listaMesas.find(
        item => item.id === id
      );

      await deleteDoc(
        doc(this.firestore, 'mesas', id)
      );

      if (this.mesaSeleccionada?.id === id) {
        this.mesaSeleccionada = null;
      }

      this.mostrarPedidoMesa = false;
      this.limpiarPedidoMesa();
      this.cerrarPanel();

      await this.mostrarToast(
        mesa
          ? `Mesa ${mesa.numero} eliminada correctamente.`
          : 'Mesa eliminada correctamente.',
        'success'
      );

    } catch (error) {
      console.error(
        '❌ Error eliminando mesa desde Firestore:',
        error
      );

      await this.mostrarAlerta(
        'Error al eliminar',
        'No se pudo eliminar la mesa. Revisa tu conexión e inténtalo nuevamente.'
      );
    }
  }

  // =========================================================
  // ALERTAS Y MENSAJES IONIC
  // =========================================================

  private async mostrarAlerta(
    titulo: string,
    mensaje: string
  ): Promise<void> {
    const alerta = await this.alertController.create({
      header: titulo,
      message: mensaje,
      buttons: ['Aceptar']
    });

    await alerta.present();
  }

  private async confirmarAccion(
    titulo: string,
    mensaje: string,
    textoConfirmar: string = 'Confirmar'
  ): Promise<boolean> {
    const alerta = await this.alertController.create({
      header: titulo,
      message: mensaje,
      backdropDismiss: false,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: textoConfirmar,
          role: 'confirm'
        }
      ]
    });

    await alerta.present();

    const resultado = await alerta.onDidDismiss();

    return resultado.role === 'confirm';
  }

  private async mostrarToast(
    mensaje: string,
    color:
      | 'success'
      | 'danger'
      | 'warning'
      | 'primary' = 'primary'
  ): Promise<void> {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2200,
      position: 'bottom',
      color
    });

    await toast.present();
  }

  // =========================================================
  // ESTADOS
  // =========================================================

  normalizarEstadoMesa(
    estado: any
  ): EstadoMesa {
    const e = String(
      estado || 'libre'
    ).toLowerCase().trim();

    if (e === 'disponible') {
      return 'libre';
    }

    if (e === 'ocupada') {
      return 'activa';
    }

    if (e === 'pendiente_cocina') {
      return 'activa';
    }

    if (
      e === 'recogido' ||
      e === 'entregado'
    ) {
      return 'entregado_mesa';
    }

    if (
      e === 'libre' ||
      e === 'activa' ||
      e === 'preparando' ||
      e === 'listo' ||
      e === 'entregado_mesa' ||
      e === 'cuenta' ||
      e === 'pagado' ||
      e === 'reservada'
    ) {
      return e;
    }

    return 'libre';
  }

  obtenerEstadoTextoMesa(
    estado: any
  ): string {
    const e = this.normalizarEstadoMesa(
      estado
    );

    switch (e) {
      case 'libre':
        return 'Libre';

      case 'activa':
        return 'Activa';

      case 'preparando':
        return 'Preparando';

      case 'listo':
        return 'Listo';

      case 'entregado_mesa':
        return 'Entregado';

      case 'cuenta':
        return 'En cuenta';

      case 'pagado':
        return 'Pagado';

      case 'reservada':
        return 'Reservada';

      default:
        return e;
    }
  }

  obtenerEstadoTextoPedido(
    estado: any
  ): string {
    const e = this.normalizarEstadoPedido(
      estado
    );

    switch (e) {
      case 'pendiente_cocina':
        return 'Pendiente cocina';

      case 'preparando':
        return 'Preparando';

      case 'listo':
        return 'Listo';

      case 'entregado_mesa':
        return 'Entregado mesa';

      case 'cuenta':
        return 'En cuenta';

      case 'pagado':
        return 'Pagado';

      case 'anulado':
        return 'Anulado';

      default:
        return e;
    }
  }

  normalizarEstadoPedido(
    estado: any
  ): EstadoPedido {
    const e = String(
      estado || 'pendiente_cocina'
    ).toLowerCase().trim();

    if (e === 'cocina') {
      return 'preparando';
    }

    if (
      e === 'entregado' ||
      e === 'recogido'
    ) {
      return 'entregado_mesa';
    }

    if (
      e === 'cancelado' ||
      e === 'liberado sin pagar'
    ) {
      return 'anulado';
    }

    if (
      e === 'pendiente_cocina' ||
      e === 'preparando' ||
      e === 'listo' ||
      e === 'entregado_mesa' ||
      e === 'cuenta' ||
      e === 'pagado' ||
      e === 'anulado'
    ) {
      return e;
    }

    return 'pendiente_cocina';
  }

  // =========================================================
  // FECHAS
  // =========================================================

  convertirFecha(fecha: any): Date {
    if (!fecha) {
      return new Date(0);
    }

    if (
      typeof fecha?.toDate === 'function'
    ) {
      return fecha.toDate();
    }

    if (fecha?.seconds !== undefined) {
      return new Date(
        Number(fecha.seconds) * 1000
      );
    }

    const fechaConvertida = new Date(fecha);

    return Number.isNaN(
      fechaConvertida.getTime()
    )
      ? new Date(0)
      : fechaConvertida;
  }

  convertirHora(fecha: any): string {
    const date = this.convertirFecha(fecha);

    if (
      date.getTime() === 0 ||
      Number.isNaN(date.getTime())
    ) {
      return '--:--';
    }

    return date.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // =========================================================
  // ORDENAMIENTO Y VALIDACIÓN DE NÚMEROS
  // =========================================================

  private normalizarNumeroMesaComparacion(
    numero: any
  ): string {
    const valor = String(
      numero ?? ''
    ).trim().toLowerCase();

    if (!valor) {
      return '';
    }

    const valorNumerico = Number(valor);

    /*
     * Hace que "01", "1" y "001" sean considerados
     * como el mismo número de mesa.
     */
    if (
      Number.isFinite(valorNumerico) &&
      valor !== ''
    ) {
      return String(valorNumerico);
    }

    return valor;
  }

  private compararNumeroMesas(
    numeroA: any,
    numeroB: any
  ): number {
    const textoA = String(
      numeroA ?? ''
    ).trim();

    const textoB = String(
      numeroB ?? ''
    ).trim();

    const valorA = Number(textoA);
    const valorB = Number(textoB);

    const aEsNumero = Number.isFinite(valorA);
    const bEsNumero = Number.isFinite(valorB);

    if (aEsNumero && bEsNumero) {
      return valorA - valorB;
    }

    return textoA.localeCompare(
      textoB,
      'es',
      {
        numeric: true,
        sensitivity: 'base'
      }
    );
  }

  // =========================================================
  // TRACK BY
  // =========================================================

  trackByMesa(
    index: number,
    mesa: any
  ): string | number {
    return mesa?.id || index;
  }

  trackByProductoPedido(
    index: number,
    producto: any
  ): string | number {
    return producto?.id || index;
  }

  // =========================================================
  // LIMPIEZA
  // =========================================================

  limpiarFormulario(): void {
    this.nuevaMesa = {
      numero: '',
      capacidad: null,
      estado: 'libre'
    };
  }

  limpiarPedidoMesa(): void {
    this.pedidoMesaActual = [];
    this.totalPedidoMesa = 0;
    this.horaInicioMesa = '';
    this.estadoPedidoMesa = '';
    this.meseroPedidoMesa = '';
    this.clientePedidoMesa = '';
  }
}