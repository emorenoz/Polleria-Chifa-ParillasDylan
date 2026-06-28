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
  IonButton,
  IonSearchbar,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonIcon,
  IonLabel,
  IonBadge,
  IonButtons,
  IonBackButton,
  IonMenuButton
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  create,
  trash,
  cube,
  arrowBack,
  warningOutline,
  searchOutline,
  alertCircleOutline,
  addOutline,
  syncOutline,
  closeOutline,
  pencilOutline,
  trashOutline
} from 'ionicons/icons';

import {
  Firestore,
  collection,
  collectionData,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  setDoc
} from '@angular/fire/firestore';

import { Subscription } from 'rxjs';

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-stock',
  templateUrl: './stock.page.html',
  styleUrls: ['./stock.page.scss'],
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
    IonButton,
    IonSearchbar,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonIcon,
    IonLabel,
    IonBadge,
    IonButtons,
    IonBackButton,
    IonMenuButton
  ]
})
export class StockPage implements OnInit, OnDestroy {

  private firestore = inject(Firestore);
  private inventarioSub?: Subscription;

  readonly usuarioActual = 'admin';

  fechaActual: string = '';
  mostrarFormulario: boolean = false;
  soloAlertas: boolean = false;

  totalInsumos: number = 0;
  totalOk: number = 0;
  totalBajo: number = 0;
  totalCritico: number = 0;
  valorInventario: number = 0;
  productosSinStock: number = 0;
  productosValorizados: number = 0;

  nuevoInsumo = {
    nombre: '',
    categoria: '',
    cantidad: null as number | null,
    stockMinimo: null as number | null,
    stockMaximo: null as number | null,
    unidad: '',
    precio: null as number | null
  };

  editando = false;
  idInsumoEditando: string | null = null;
  textoBuscar = '';

  listaInsumos: any[] = [];
  insumosFiltrados: any[] = [];

  inventarioCarta: any[] = [
    { id: 'pollo-entero', nombre: 'Pollo entero', categoria: 'Carnes y Pollo', cantidad: 100, stockMinimo: 10, stockMaximo: 200, unidad: 'und', precio: 18 },
    { id: 'pechuga-de-pollo', nombre: 'Pechuga de pollo', categoria: 'Carnes y Pollo', cantidad: 100, stockMinimo: 10, stockMaximo: 200, unidad: 'kg', precio: 16 },
    { id: 'pierna-de-pollo', nombre: 'Pierna de pollo', categoria: 'Carnes y Pollo', cantidad: 100, stockMinimo: 10, stockMaximo: 200, unidad: 'kg', precio: 14 },
    { id: 'alita-de-pollo', nombre: 'Alita de pollo', categoria: 'Carnes y Pollo', cantidad: 100, stockMinimo: 10, stockMaximo: 200, unidad: 'kg', precio: 12 },
    { id: 'menudencia-de-pollo', nombre: 'Menudencia de pollo', categoria: 'Carnes y Pollo', cantidad: 100, stockMinimo: 10, stockMaximo: 200, unidad: 'kg', precio: 8 },
    { id: 'chuleta-de-cerdo', nombre: 'Chuleta de cerdo', categoria: 'Carnes y Pollo', cantidad: 100, stockMinimo: 10, stockMaximo: 200, unidad: 'kg', precio: 18 },
    { id: 'bistec-de-res', nombre: 'Bistec de res', categoria: 'Carnes y Pollo', cantidad: 100, stockMinimo: 10, stockMaximo: 200, unidad: 'kg', precio: 22 },
    { id: 'carne-para-lomo', nombre: 'Carne para lomo saltado', categoria: 'Carnes y Pollo', cantidad: 100, stockMinimo: 10, stockMaximo: 200, unidad: 'kg', precio: 24 },
    { id: 'carne-de-chancho', nombre: 'Carne de chancho', categoria: 'Carnes y Pollo', cantidad: 100, stockMinimo: 10, stockMaximo: 200, unidad: 'kg', precio: 18 },
    { id: 'langostinos', nombre: 'Langostinos', categoria: 'Carnes y Pollo', cantidad: 100, stockMinimo: 10, stockMaximo: 200, unidad: 'kg', precio: 35 },
    { id: 'anticucho', nombre: 'Anticucho', categoria: 'Carnes y Pollo', cantidad: 100, stockMinimo: 10, stockMaximo: 200, unidad: 'und', precio: 3 },
    { id: 'mollejitas', nombre: 'Mollejitas', categoria: 'Carnes y Pollo', cantidad: 100, stockMinimo: 10, stockMaximo: 200, unidad: 'kg', precio: 12 },
    { id: 'chorizo', nombre: 'Chorizo', categoria: 'Carnes y Pollo', cantidad: 100, stockMinimo: 10, stockMaximo: 200, unidad: 'und', precio: 3 },
    { id: 'hot-dog', nombre: 'Hot Dog', categoria: 'Carnes y Pollo', cantidad: 100, stockMinimo: 10, stockMaximo: 200, unidad: 'und', precio: 1.2 },
    { id: 'brocheta-de-pollo', nombre: 'Brocheta de pollo', categoria: 'Carnes y Pollo', cantidad: 100, stockMinimo: 10, stockMaximo: 200, unidad: 'und', precio: 5 }
  ];

  constructor() {
    addIcons({
      create,
      trash,
      cube,
      arrowBack,
      warningOutline,
      searchOutline,
      alertCircleOutline,
      addOutline,
      syncOutline,
      closeOutline,
      pencilOutline,
      trashOutline
    });
  }

  async ngOnInit() {
    this.configurarFecha();
    await this.verificarInventarioInicial();
    this.cargarInventarioFirebase();
  }

  ngOnDestroy() {
    this.inventarioSub?.unsubscribe();
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

  async verificarInventarioInicial() {
    try {
      const snapshot = await getDocs(collection(this.firestore, 'inventario'));

      if (snapshot.empty) {
        await this.crearInventarioAutomatico();
      }
    } catch (error) {
      console.error('Error verificando inventario inicial:', error);
    }
  }

  cargarInventarioFirebase() {
    const inventarioRef = collection(this.firestore, 'inventario');

    this.inventarioSub = collectionData(
      inventarioRef,
      { idField: 'id' }
    ).subscribe({
      next: (data: any[]) => {
        this.listaInsumos = (data || [])
          .filter(i => i.activo !== false)
          .map(i => ({
            id: i.id,
            nombre: i.nombre || '',
            categoria: i.categoria || '',
            cantidad: Number(i.cantidad) || 0,
            stockMinimo: Number(i.stockMinimo) || 0,
            stockMaximo: Number(i.stockMaximo) || 0,
            unidad: i.unidad || '',
            precio: Number(i.precio) || 0,
            activo: i.activo !== false,
            fechaCreacion: i.fechaCreacion || null,
            fechaActualizacion: i.fechaActualizacion || null
          }))
          .sort((a, b) =>
            String(a.nombre || '').localeCompare(String(b.nombre || ''))
          );

        this.calcularKPIs();
        this.buscar();
      },
      error: (error) => {
        console.error('Error cargando inventario:', error);
      }
    });
  }

  async crearInventarioAutomatico() {
    try {
      const promesas = this.inventarioCarta.map(insumo => {
        const ref = doc(this.firestore, 'inventario', insumo.id);

        return setDoc(ref, {
          ...insumo,
          activo: true,
          fechaCreacion: new Date(),
          fechaActualizacion: new Date()
        }, { merge: true });
      });

      await Promise.all(promesas);

      console.log('✅ Inventario inicial creado correctamente.');

    } catch (error) {
      console.error('Error creando inventario automático:', error);
    }
  }

  async actualizarInventario() {
    this.calcularKPIs();
    this.buscar();
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
    this.idInsumoEditando = null;
  }

  toggleAlertas() {
    this.soloAlertas = !this.soloAlertas;
    this.buscar();
  }

  obtenerEmoji(cat: string): string {
    if (!cat) return '📦';

    const c = cat.toLowerCase();

    if (c.includes('carne') || c.includes('pollo') || c.includes('brasa') || c.includes('parrilla')) return '🍗';
    if (c.includes('verdura') || c.includes('guarniciones')) return '🥬';
    if (c.includes('bebida') || c.includes('gaseosa') || c.includes('vino')) return '🥤';
    if (c.includes('chifa')) return '🥡';
    if (c.includes('sopa')) return '🍜';
    if (c.includes('condimento')) return '🧂';
    if (c.includes('descartable')) return '🥡';

    return '📦';
  }

  obtenerColorEstado(insumo: any, esFondo: boolean = false): string {
    const cantidad = Number(insumo.cantidad) || 0;
    const stockMinimo = Number(insumo.stockMinimo) || 0;

    if (cantidad <= 0) return esFondo ? 'bg-red' : 'text-red';
    if (cantidad <= stockMinimo) return esFondo ? 'bg-yellow' : 'text-yellow';

    return esFondo ? 'bg-green' : 'text-green';
  }

  obtenerTextoEstado(insumo: any): string {
    const cantidad = Number(insumo.cantidad) || 0;
    const stockMinimo = Number(insumo.stockMinimo) || 0;

    if (cantidad <= 0) return 'Crítico';
    if (cantidad <= stockMinimo) return 'Bajo stock';

    return 'OK';
  }

  calcularPorcentaje(insumo: any): number {
    const cantidad = Number(insumo.cantidad) || 0;
    const stockMinimo = Number(insumo.stockMinimo) || 0;
    const stockMaximo = Number(insumo.stockMaximo) || 0;

    if (cantidad <= 0) return 0;

    if (stockMaximo > 0) {
      const porcentaje = (cantidad / stockMaximo) * 100;
      return Math.min(100, Math.max(0, porcentaje));
    }

    if (stockMinimo <= 0) return 100;

    if (cantidad >= stockMinimo * 2) return 100;

    const porcentaje = (cantidad / (stockMinimo * 2)) * 100;
    return Math.min(100, Math.max(0, porcentaje));
  }

  calcularKPIs() {
    this.totalInsumos = this.listaInsumos.length;

    this.totalCritico = this.listaInsumos.filter(
      i => Number(i.cantidad) <= 0
    ).length;

    this.totalBajo = this.listaInsumos.filter(
      i =>
        Number(i.cantidad) > 0 &&
        Number(i.cantidad) <= Number(i.stockMinimo)
    ).length;

    this.totalOk = this.listaInsumos.filter(
      i => Number(i.cantidad) > Number(i.stockMinimo)
    ).length;

    this.valorInventario = this.listaInsumos.reduce(
      (acc, i) =>
        acc + ((Number(i.cantidad) || 0) * (Number(i.precio) || 0)),
      0
    );

    this.productosSinStock = this.listaInsumos.filter(
      i => Number(i.cantidad) <= 0
    ).length;

    this.productosValorizados = this.listaInsumos.filter(
      i => Number(i.precio) > 0
    ).length;
  }

  async guardarInsumo() {
    const nombre = this.nuevoInsumo.nombre.trim();
    const cantidad = Number(this.nuevoInsumo.cantidad);
    const stockMinimo = Number(this.nuevoInsumo.stockMinimo);
    const stockMaximo = Number(this.nuevoInsumo.stockMaximo || 0);
    const precio = Number(this.nuevoInsumo.precio || 0);

    if (!nombre || this.nuevoInsumo.cantidad === null || this.nuevoInsumo.stockMinimo === null) {
      alert('Completa nombre, cantidad y stock mínimo.');
      return;
    }

    if (cantidad < 0) {
      alert('La cantidad no puede ser negativa.');
      return;
    }

    if (stockMinimo < 0) {
      alert('El stock mínimo no puede ser negativo.');
      return;
    }

    if (stockMaximo < 0) {
      alert('El stock máximo no puede ser negativo.');
      return;
    }

    if (precio < 0) {
      alert('El precio no puede ser negativo.');
      return;
    }

    try {
      const dataToSave = {
        nombre,
        categoria: this.nuevoInsumo.categoria || '',
        cantidad,
        stockMinimo,
        stockMaximo,
        unidad: this.nuevoInsumo.unidad || 'und',
        precio,
        activo: true,
        fechaActualizacion: new Date()
      };

      if (this.editando && this.idInsumoEditando) {
        const ref = doc(this.firestore, 'inventario', this.idInsumoEditando);

        await updateDoc(ref, dataToSave);

        await this.registrarMovimientoInventario(
          { id: this.idInsumoEditando, nombre },
          'ajuste',
          cantidad
        );

      } else {
        await addDoc(collection(this.firestore, 'inventario'), {
          ...dataToSave,
          fechaCreacion: new Date()
        });
      }

      this.cerrarFormulario();

    } catch (error) {
      console.error('Error guardando insumo:', error);
    }
  }

  async ajustarStockRapido(insumo: any, variacion: number) {
    const cantidadActual = Number(insumo.cantidad) || 0;
    const nuevaCantidad = cantidadActual + variacion;

    if (nuevaCantidad < 0) {
      alert('El stock no puede quedar en negativo.');
      return;
    }

    try {
      const ref = doc(this.firestore, 'inventario', insumo.id);

      await updateDoc(ref, {
        cantidad: nuevaCantidad,
        fechaActualizacion: new Date()
      });

      try {
        await this.registrarMovimientoInventario(
          insumo,
          variacion > 0 ? 'entrada' : 'salida',
          Math.abs(variacion)
        );
      } catch (error) {
        console.warn('Stock actualizado, pero no se registró el movimiento:', error);
      }

    } catch (error) {
      console.error('Error ajustando stock rápido:', error);
    }
  }

  async registrarMovimientoInventario(
    insumo: any,
    tipo: 'entrada' | 'salida' | 'ajuste',
    cantidad: number
  ) {
    await addDoc(collection(this.firestore, 'movimientos_inventario'), {
      idInsumo: insumo.id,
      nombre: insumo.nombre || '',
      tipo,
      cantidad: Number(cantidad) || 0,
      fecha: new Date(),
      usuario: this.usuarioActual
    });
  }

  seleccionarInsumo(insumo: any) {
    this.editando = true;
    this.idInsumoEditando = insumo.id;

    this.nuevoInsumo = {
      nombre: insumo.nombre,
      categoria: insumo.categoria,
      cantidad: insumo.cantidad,
      stockMinimo: insumo.stockMinimo,
      stockMaximo: insumo.stockMaximo || null,
      unidad: insumo.unidad,
      precio: insumo.precio
    };

    this.mostrarFormulario = true;
  }

  async eliminarInsumo(id: string) {
    const confirmar = confirm('¿Seguro que deseas desactivar este insumo?');

    if (!confirmar) return;

    try {
      const ref = doc(this.firestore, 'inventario', id);

      await updateDoc(ref, {
        activo: false,
        fechaEliminacion: new Date(),
        fechaActualizacion: new Date()
      });

      this.cerrarFormulario();

    } catch (error) {
      console.error('Error desactivando insumo:', error);
    }
  }

  buscar() {
    const q = this.textoBuscar.toLowerCase().trim();

    this.insumosFiltrados = this.listaInsumos.filter(i => {
      const nombre = String(i.nombre || '').toLowerCase();
      const categoria = String(i.categoria || '').toLowerCase();

      const matchTexto =
        !q ||
        nombre.includes(q) ||
        categoria.includes(q);

      const matchAlerta =
        !this.soloAlertas ||
        Number(i.cantidad) <= Number(i.stockMinimo);

      return matchTexto && matchAlerta;
    });
  }

  generarOrdenCompra() {
    const faltantes = this.listaInsumos.filter(
      i => Number(i.cantidad) <= Number(i.stockMinimo)
    );

    console.log('Orden de compra sugerida:', faltantes);

    if (faltantes.length === 0) {
      alert('No hay insumos bajos o críticos.');
      return;
    }

    alert(`Se detectaron ${faltantes.length} insumos para reponer.`);
  }

  exportarInventario() {
    this.exportarInventarioExcel();
  }

  exportarInventarioExcel() {
    const datos = this.insumosFiltrados.map(i => ({
      Nombre: i.nombre,
      Categoría: i.categoria,
      Cantidad: Number(i.cantidad) || 0,
      'Stock mínimo': Number(i.stockMinimo) || 0,
      'Stock máximo': Number(i.stockMaximo) || 0,
      Unidad: i.unidad,
      Precio: Number(i.precio) || 0,
      Valor: (Number(i.cantidad) || 0) * (Number(i.precio) || 0),
      Estado: this.obtenerTextoEstado(i)
    }));

    const worksheet = XLSX.utils.json_to_sheet(datos);

    worksheet['!cols'] = [
      { wch: 28 },
      { wch: 22 },
      { wch: 12 },
      { wch: 15 },
      { wch: 15 },
      { wch: 10 },
      { wch: 12 },
      { wch: 14 },
      { wch: 15 }
    ];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario');

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    });

    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    saveAs(
      blob,
      `inventario_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  }

  exportarInventarioPDF() {
    const docPdf = new jsPDF('landscape', 'mm', 'a4');

    docPdf.setFontSize(16);
    docPdf.text('Reporte de Inventario - Pollería Dylan', 14, 15);

    docPdf.setFontSize(10);
    docPdf.text(`Fecha: ${this.fechaActual}`, 14, 23);
    docPdf.text(`Total insumos: ${this.totalInsumos}`, 14, 30);
    docPdf.text(`Stock OK: ${this.totalOk}`, 14, 36);
    docPdf.text(`Bajo stock: ${this.totalBajo}`, 14, 42);
    docPdf.text(`Crítico: ${this.totalCritico}`, 14, 48);
    docPdf.text(`Valor inventario: S/ ${this.valorInventario.toFixed(2)}`, 14, 54);

    const filas = this.insumosFiltrados.map(i => [
      i.nombre,
      i.categoria,
      Number(i.cantidad) || 0,
      Number(i.stockMinimo) || 0,
      Number(i.stockMaximo) || 0,
      i.unidad,
      `S/ ${(Number(i.precio) || 0).toFixed(2)}`,
      `S/ ${((Number(i.cantidad) || 0) * (Number(i.precio) || 0)).toFixed(2)}`,
      this.obtenerTextoEstado(i)
    ]);

    autoTable(docPdf, {
      startY: 62,
      head: [[
        'Nombre',
        'Categoría',
        'Cantidad',
        'Mínimo',
        'Máximo',
        'Unidad',
        'Precio',
        'Valor',
        'Estado'
      ]],
      body: filas,
      styles: {
        fontSize: 8
      },
      headStyles: {
        fillColor: [126, 58, 242],
        textColor: [255, 255, 255]
      }
    });

    docPdf.save(
      `inventario_${new Date().toISOString().slice(0, 10)}.pdf`
    );
  }

  limpiarFormulario() {
    this.nuevoInsumo = {
      nombre: '',
      categoria: '',
      cantidad: null,
      stockMinimo: null,
      stockMaximo: null,
      unidad: '',
      precio: null
    };
  }
}