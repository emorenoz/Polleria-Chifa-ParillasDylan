import {
  Component,
  OnInit,
  OnDestroy,
  inject
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IonicModule, ViewWillEnter } from '@ionic/angular'; // <-- AÑADIDO ViewWillEnter
import { Router } from '@angular/router';

import {
  Firestore,
  collection,
  collectionData,
  doc,
  updateDoc,
  serverTimestamp
} from '@angular/fire/firestore';

import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ]
})
export class DashboardPage implements OnInit, OnDestroy, ViewWillEnter { // <-- AÑADIDO ViewWillEnter

  // =====================================================
  // SERVICIOS
  // =====================================================

  private firestore = inject(Firestore);
  private router = inject(Router);

  // =====================================================
  // DATOS DEL COCINERO
  // =====================================================

  // 👇 VARIABLE INICIALIZADA VACÍA PARA QUE SE LLENE AL ENTRAR A LA VISTA
  nombreCocinero: string = '';

  // =====================================================
  // VARIABLES GENERALES
  // =====================================================

  mensajeNotificacion: string = '';

  pedidos: any[] = [];
  pedidosFiltrados: any[] = [];
  pedidosRecientes: any[] = [];

  categoriaSeleccionada: string = 'todos';

  horaActual: string = this.obtenerHoraActual();

  // Evita hacer doble clic mientras se actualiza un pedido
  pedidosProcesando = new Set<string>();

  // =====================================================
  // SUSCRIPCIONES E INTERVALOS
  // =====================================================

  private relojInterval: ReturnType<typeof setInterval> | null = null;

  private notificacionTimeout:
    ReturnType<typeof setTimeout> | null = null;

  private pedidosSubscription?: Subscription;

  // =====================================================
  // CICLO DE VIDA
  // =====================================================

  ngOnInit(): void {
    this.cargarDatos();
    this.iniciarReloj();
  }

  // 👇 NUEVO MÉTODO: SE EJECUTA CADA VEZ QUE SE ENTRA A ESTA PANTALLA
  ionViewWillEnter(): void {
    const nombreGuardado =
      localStorage.getItem('usuarioNombre') ||
      localStorage.getItem('nombreCocinero');

    if (nombreGuardado) {
      this.nombreCocinero = nombreGuardado;
    } else {
      this.nombreCocinero = 'Personal de Cocina';
    }
  }

  ngOnDestroy(): void {
    if (this.relojInterval) {
      clearInterval(this.relojInterval);
      this.relojInterval = null;
    }

    if (this.notificacionTimeout) {
      clearTimeout(this.notificacionTimeout);
      this.notificacionTimeout = null;
    }

    if (this.pedidosSubscription) {
      this.pedidosSubscription.unsubscribe();
    }
  }

  // =====================================================
  // RELOJ
  // =====================================================

  obtenerHoraActual(): string {
    return new Date().toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  iniciarReloj(): void {
    this.relojInterval = setInterval(() => {
      this.horaActual = this.obtenerHoraActual();
    }, 1000);
  }

  // =====================================================
  // CARGAR PEDIDOS DE FIRESTORE
  // =====================================================

  cargarDatos(): void {
    const pedidosRef = collection(this.firestore, 'pedidos');

    this.pedidosSubscription = collectionData(
      pedidosRef,
      { idField: 'id' }
    ).subscribe({
      next: (data: any[]) => {

        const estadosOcultos = [
          'pagado',
          'anulado',
          'cancelado',
          'entregado_mesa',
          'cuenta',
          'liberado_sin_pagar',
          'liberado sin pagar'
        ];

        this.pedidos = (data || [])
          .filter(pedido => {
            const estado = this.normalizarTexto(pedido.estado);
            return !estadosOcultos.includes(estado);
          })
          .map(pedido => ({
            ...pedido,

            // Usa el número guardado. Si no existe, crea uno estable
            // utilizando parte del ID del documento.
            numeroVisual: this.obtenerNumeroPedido(pedido)
          }))
          .sort(
            (a, b) =>
              this.obtenerTime(b.fecha) -
              this.obtenerTime(a.fecha)
          );

        this.actualizarPedidosRecientes();
        this.filtrarPedidos();
      },

      error: error => {
        console.error('Error cargando pedidos:', error);

        this.mostrarNotificacion(
          '❌ No se pudieron cargar los pedidos.'
        );
      }
    });
  }

  // =====================================================
  // NUMERACIÓN DEL PEDIDO
  // =====================================================

  /**
   * Obtiene un número estable.
   *
   * Prioridad:
   * 1. numeroPedido almacenado en Firestore.
   * 2. numeroVisual ya existente.
   * 3. Últimos caracteres del ID del documento.
   *
   * Lo recomendable es generar numeroPedido desde el
   * momento en que el mesero crea el pedido.
   */
  obtenerNumeroPedido(pedido: any): string {
    if (pedido?.numeroPedido !== undefined &&
        pedido?.numeroPedido !== null &&
        pedido?.numeroPedido !== '') {

      return String(pedido.numeroPedido).padStart(2, '0');
    }

    if (pedido?.numeroVisual !== undefined &&
        pedido?.numeroVisual !== null &&
        pedido?.numeroVisual !== '') {

      return String(pedido.numeroVisual).padStart(2, '0');
    }

    if (pedido?.id) {
      return String(pedido.id)
        .slice(-6)
        .toUpperCase();
    }

    return 'SIN-ID';
  }

  /**
   * Se conserva para no generar errores si tu HTML
   * o algún otro método todavía lo utiliza.
   *
   * Ya no cambia la numeración según la posición.
   */
  asignarNumerosPedidos(): void {
    this.pedidos = this.pedidos.map(pedido => ({
      ...pedido,
      numeroVisual: this.obtenerNumeroPedido(pedido)
    }));
  }

  // =====================================================
  // FILTROS
  // =====================================================

  aplicarFiltro(tipo: string): void {
    this.categoriaSeleccionada = tipo;
    this.filtrarPedidos();
  }

  filtrarPedidos(): void {
    if (this.categoriaSeleccionada === 'todos') {
      this.pedidosFiltrados = [...this.pedidos];
      return;
    }

    const estadoSeleccionado = this.normalizarTexto(
      this.categoriaSeleccionada
    );

    this.pedidosFiltrados = this.pedidos.filter(
      pedido =>
        this.normalizarTexto(pedido.estado) === estadoSeleccionado
    );
  }

  // =====================================================
  // PEDIDOS RECIENTES
  // =====================================================

  actualizarPedidosRecientes(): void {
    this.pedidosRecientes = this.pedidos
      .filter(
        pedido =>
          this.normalizarTexto(pedido.estado) === 'listo'
      )
      .sort(
        (a, b) =>
          this.obtenerTime(
            b.fechaListo ||
            b.fechaActualizacion ||
            b.fecha
          ) -
          this.obtenerTime(
            a.fechaListo ||
            a.fechaActualizacion ||
            a.fecha
          )
      )
      .slice(0, 5);
  }

  /**
   * Se conserva por compatibilidad, aunque Firestore
   * actualizará pedidosRecientes automáticamente.
   */
  agregarPedidoReciente(pedido: any): void {
    this.pedidosRecientes = [
      pedido,
      ...this.pedidosRecientes.filter(
        item => item.id !== pedido.id
      )
    ].slice(0, 5);
  }

  // =====================================================
  // NOTIFICACIONES
  // =====================================================

  mostrarNotificacion(mensaje: string): void {
    this.mensajeNotificacion = mensaje;

    if (this.notificacionTimeout) {
      clearTimeout(this.notificacionTimeout);
    }

    this.notificacionTimeout = setTimeout(() => {
      this.mensajeNotificacion = '';
      this.notificacionTimeout = null;
    }, 5000);
  }

  // =====================================================
  // CONTADORES
  // =====================================================

  get totalNuevos(): number {
    return this.pedidos.filter(
      pedido =>
        this.normalizarTexto(pedido.estado) ===
        'pendiente_cocina'
    ).length;
  }

  get totalEnCocina(): number {
    return this.pedidos.filter(
      pedido =>
        this.normalizarTexto(pedido.estado) ===
        'preparando'
    ).length;
  }

  get totalListos(): number {
    return this.pedidos.filter(
      pedido =>
        this.normalizarTexto(pedido.estado) ===
        'listo'
    ).length;
  }

  // =====================================================
  // CAMBIAR ESTADO
  // =====================================================

  async cambiarEstado(pedido: any): Promise<void> {

    if (!pedido?.id) {
      this.mostrarNotificacion(
        '❌ El pedido no tiene un ID válido.'
      );
      return;
    }

    if (this.pedidosProcesando.has(pedido.id)) {
      return;
    }

    const estadoActual = this.normalizarTexto(pedido.estado);

    const estadosPermitidos = [
      'pendiente_cocina',
      'preparando',
      'listo'
    ];

    if (!estadosPermitidos.includes(estadoActual)) {
      this.mostrarNotificacion(
        '⚠️ Este pedido ya no puede procesarse desde cocina.'
      );
      return;
    }

    this.pedidosProcesando.add(pedido.id);

    const numeroPedido = this.obtenerNumeroPedido(pedido);
    const esParaLlevar = this.esPedidoParaLlevar(pedido);
    const destinoPedido = this.obtenerDestinoPedido(pedido);

    const pedidoRef = doc(
      this.firestore,
      'pedidos',
      pedido.id
    );

    try {

      // =================================================
      // PENDIENTE → PREPARANDO
      // =================================================

      if (estadoActual === 'pendiente_cocina') {

        await updateDoc(pedidoRef, {
          estado: 'preparando',
          numeroPedido,
          cocinero: this.nombreCocinero,
          fechaInicioPreparacion: serverTimestamp(),
          fechaActualizacion: serverTimestamp()
        });

        this.mostrarNotificacion(
          `🔥 Pedido #${numeroPedido} en preparación - ${destinoPedido}`
        );

        return;
      }

      // =================================================
      // PREPARANDO → LISTO
      // =================================================

      if (estadoActual === 'preparando') {

        await updateDoc(pedidoRef, {
          estado: 'listo',
          numeroPedido,
          cocinero: this.nombreCocinero,
          pedidoListo: true,
          notificacionMesero: !esParaLlevar,
          notificacionCajero: esParaLlevar,
          fechaListo: serverTimestamp(),
          fechaActualizacion: serverTimestamp()
        });

        // Actualizar mesa solamente cuando sea consumo en mesa
        if (!esParaLlevar && pedido.idMesa) {

          const mesaRef = doc(
            this.firestore,
            'mesas',
            pedido.idMesa
          );

          await updateDoc(mesaRef, {
            estado: 'listo',
            mesero: pedido.mesero || 'Mesero',
            cocinero: this.nombreCocinero,
            numeroPedido,
            pedidoListo: true,
            notificacionMesero: true,
            mensajeCocina:
              `Pedido #${numeroPedido} listo para recoger en Mesa ${pedido.mesa || 'sin número'}`,
            fechaPedidoListo: serverTimestamp()
          });
        }

        this.mostrarNotificacion(
          `✅ Pedido #${numeroPedido} listo - ${destinoPedido}`
        );

        return;
      }

      // =================================================
      // LISTO → CUENTA / CAJA
      // =================================================

      if (estadoActual === 'listo') {

        const datosPedido: any = {
          estado: 'cuenta',
          numeroPedido,
          cocinero: this.nombreCocinero,
          pedidoListo: false,
          listoParaCobrar: true,
          enviadoCaja: true,
          notificacionCajero: true,
          notificacionMesero: false,
          fechaEnviadoCaja: serverTimestamp(),
          fechaActualizacion: serverTimestamp()
        };

        if (esParaLlevar) {
          datosPedido.fechaEntregadoCliente = serverTimestamp();
          datosPedido.tipoDestino = 'para_llevar';
        } else {
          datosPedido.fechaEntregadoMesa = serverTimestamp();
          datosPedido.tipoDestino = 'mesa';
        }

        // Una sola actualización definitiva del pedido
        await updateDoc(pedidoRef, datosPedido);

        // Actualizar mesa solamente si existe
        if (!esParaLlevar && pedido.idMesa) {

          const mesaRef = doc(
            this.firestore,
            'mesas',
            pedido.idMesa
          );

          await updateDoc(mesaRef, {
            estado: 'cuenta',
            mesero: pedido.mesero || 'Mesero',
            cocinero: this.nombreCocinero,
            numeroPedido,
            pedidoListo: false,
            notificacionMesero: false,
            listoParaCobrar: true,
            fechaEntregadoMesa: serverTimestamp(),
            fechaActualizacion: serverTimestamp()
          });
        }

        this.mostrarNotificacion(
          `💵 Pedido #${numeroPedido} enviado a caja - ${destinoPedido}`
        );
      }

    } catch (error) {
      console.error(
        'Error cambiando estado del pedido:',
        error
      );

      this.mostrarNotificacion(
        '❌ No se pudo actualizar el pedido. Intenta nuevamente.'
      );

    } finally {
      this.pedidosProcesando.delete(pedido.id);
    }
  }

  // =====================================================
  // IDENTIFICAR TIPO DE PEDIDO
  // =====================================================

  esPedidoParaLlevar(pedido: any): boolean {
    const valores = [
      pedido?.tipoPedido,
      pedido?.tipo,
      pedido?.origen,
      pedido?.modalidad,
      pedido?.mesa
    ]
      .filter(valor => valor !== undefined && valor !== null)
      .map(valor => this.normalizarTexto(valor));

    const esParaLlevarPorCampo = valores.some(valor =>
      valor === 'para_llevar' ||
      valor === 'para llevar' ||
      valor.includes('llevar')
    );

    /*
     * No se considera automáticamente "para llevar"
     * solo porque idMesa esté vacío, porque algunos pedidos
     * antiguos podrían no tener dicho campo.
     */
    return esParaLlevarPorCampo;
  }

  obtenerDestinoPedido(pedido: any): string {
    if (this.esPedidoParaLlevar(pedido)) {

      const nombreCliente =
        pedido?.cliente ||
        pedido?.nombreCliente ||
        pedido?.clienteNombre ||
        pedido?.datosCliente?.nombre ||
        'Cliente';

      return `Para llevar - ${nombreCliente}`;
    }

    const numeroMesa =
      pedido?.mesa ||
      pedido?.numeroMesa ||
      pedido?.nombreMesa ||
      'sin número';

    return `Mesa ${numeroMesa}`;
  }

  // =====================================================
  // CLASES Y ETIQUETAS
  // =====================================================

  getCardClass(estado: string): string {
    const estadoNormalizado = this.normalizarTexto(estado);

    if (estadoNormalizado === 'pendiente_cocina') {
      return 'borde-nuevo';
    }

    if (estadoNormalizado === 'preparando') {
      return 'borde-preparando';
    }

    if (estadoNormalizado === 'listo') {
      return 'borde-listo';
    }

    return '';
  }

  getBadgeLabel(estado: string): string {
    const estadoNormalizado = this.normalizarTexto(estado);

    if (estadoNormalizado === 'pendiente_cocina') {
      return '🔥 Nuevo';
    }

    if (estadoNormalizado === 'preparando') {
      return '⏳ Preparando';
    }

    if (estadoNormalizado === 'listo') {
      return '✅ Listo';
    }

    if (estadoNormalizado === 'entregado_mesa') {
      return '🍽️ Entregado';
    }

    if (estadoNormalizado === 'cuenta') {
      return '💵 En cuenta';
    }

    return '📌 Pedido';
  }

  getLabelBtn(estado: string): string {
    const estadoNormalizado = this.normalizarTexto(estado);

    if (estadoNormalizado === 'pendiente_cocina') {
      return '🔥 Iniciar';
    }

    if (estadoNormalizado === 'preparando') {
      return '✔ Marcar listo';
    }

    if (estadoNormalizado === 'listo') {
      return '💵 Enviar a caja';
    }

    return 'Procesar';
  }

  getColorBtn(estado: string): string {
    const estadoNormalizado = this.normalizarTexto(estado);

    if (estadoNormalizado === 'pendiente_cocina') {
      return 'iniciar';
    }

    if (estadoNormalizado === 'preparando') {
      return 'listo';
    }

    return 'entregado';
  }

  estaProcesando(pedido: any): boolean {
    return pedido?.id
      ? this.pedidosProcesando.has(pedido.id)
      : false;
  }

  // =====================================================
  // FECHAS
  // =====================================================

  obtenerTime(fecha: any): number {
    if (!fecha) {
      return 0;
    }

    if (typeof fecha.toMillis === 'function') {
      return fecha.toMillis();
    }

    if (typeof fecha.toDate === 'function') {
      return fecha.toDate().getTime();
    }

    if (typeof fecha.seconds === 'number') {
      return fecha.seconds * 1000;
    }

    if (typeof fecha._seconds === 'number') {
      return fecha._seconds * 1000;
    }

    const tiempo = new Date(fecha).getTime();

    return Number.isNaN(tiempo)
      ? 0
      : tiempo;
  }

  obtenerMinutosTranscurridos(fecha: any): string {
    const creacion = this.obtenerTime(fecha);

    if (!creacion) {
      return '0 min';
    }

    const ahora = Date.now();

    const diferenciaMinutos = Math.floor(
      (ahora - creacion) / 60000
    );

    if (diferenciaMinutos < 1) {
      return 'Ahora';
    }

    if (diferenciaMinutos === 1) {
      return '1 min';
    }

    if (diferenciaMinutos < 60) {
      return `${diferenciaMinutos} min`;
    }

    const horas = Math.floor(diferenciaMinutos / 60);
    const minutos = diferenciaMinutos % 60;

    if (minutos === 0) {
      return `${horas} h`;
    }

    return `${horas} h ${minutos} min`;
  }

  // =====================================================
  // UTILIDADES
  // =====================================================

  normalizarTexto(valor: any): string {
    return String(valor || '')
      .trim()
      .toLowerCase();
  }

  trackByPedidoId(index: number, pedido: any): string | number {
    return pedido?.id || index;
  }

  // =====================================================
  // SALIR
  // =====================================================

  salir(): void {
    console.log('Saliendo del Panel de Cocina...');
    this.router.navigate(['/select-role']);
  }
}