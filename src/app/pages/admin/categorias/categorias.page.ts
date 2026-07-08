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
  IonNote,
  IonButtons,
  IonBackButton,
  IonMenuButton
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  create,
  trash,
  arrowBack,
  addOutline,
  closeOutline,
  pencilOutline,
  trashOutline,
  ellipsisVertical,
  folderOpenOutline
} from 'ionicons/icons';

import {
  Firestore,
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  collectionData
} from '@angular/fire/firestore';

import { Subscription } from 'rxjs';

@Component({
  selector: 'app-categorias',
  templateUrl: './categorias.page.html',
  styleUrls: ['./categorias.page.scss'],
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
    IonNote,
    IonButtons,
    IonBackButton,
    IonMenuButton
  ]
})
export class CategoriasPage implements OnInit, OnDestroy {

  private firestore = inject(Firestore);

  private categoriasSub?: Subscription;
  private productosSub?: Subscription;

  fechaActual = '';
  mostrarFormulario = false;

  nuevaCategoria = {
    nombre: '',
    emoji: '',
    activo: true
  };

  editando = false;
  idCategoriaEditando: string | null = null;
  textoBuscar = '';

  listaCategorias: any[] = [];
  categoriasFiltradas: any[] = [];
  listaProductos: any[] = [];

  totalCategorias = 0;
  totalActivas = 0;
  totalInactivas = 0;
  totalProductosCarta = 0;

  categoriasPermitidas = [
    'cat_chifa',
    'cat_pollos',
    'cat_parrillas',
    'cat_criollos',
    'cat_guarniciones',
    'cat_bebidas'
  ];

  categoriasCarta: any[] = [
    { id: 'cat_chifa', nombre: 'Chifa', emoji: '🥡', cantidadProductos: 0, activo: true, orden: 1 },
    { id: 'cat_pollos', nombre: 'Pollos', emoji: '🍗', cantidadProductos: 0, activo: true, orden: 2 },
    { id: 'cat_parrillas', nombre: 'Parrillas', emoji: '🥩', cantidadProductos: 0, activo: true, orden: 3 },
    { id: 'cat_criollos', nombre: 'Criollos', emoji: '🍽️', cantidadProductos: 0, activo: true, orden: 4 },
    { id: 'cat_guarniciones', nombre: 'Guarniciones', emoji: '🍟', cantidadProductos: 0, activo: true, orden: 5 },
    { id: 'cat_bebidas', nombre: 'Bebidas', emoji: '🥤', cantidadProductos: 0, activo: true, orden: 6 }
  ];

  constructor() {
    addIcons({
      create,
      trash,
      arrowBack,
      addOutline,
      closeOutline,
      pencilOutline,
      trashOutline,
      ellipsisVertical,
      folderOpenOutline
    });
  }

  async ngOnInit() {
    this.configurarFecha();

    await this.cargarCategoriasFirebase();
    await this.migrarProductosCategoriasAntiguas();
    await this.limpiarCategoriasObsoletas();
    await this.actualizarCantidadProductos();

    this.escucharCategoriasTiempoReal();
    this.escucharProductosTiempoReal();
  }

  ngOnDestroy() {
    this.categoriasSub?.unsubscribe();
    this.productosSub?.unsubscribe();
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
    alert('En producción solo se editan las categorías principales. No se pueden crear categorías nuevas.');
  }

  cerrarFormulario() {
    this.mostrarFormulario = false;
    this.limpiarFormulario();
    this.editando = false;
    this.idCategoriaEditando = null;
  }

  async cargarCategoriasFirebase() {
    try {
      const querySnapshot = await getDocs(collection(this.firestore, 'categorias'));

      this.listaCategorias = [];

      querySnapshot.forEach((documento) => {
        this.listaCategorias.push({
          id: documento.id,
          ...documento.data()
        });
      });

      await this.sincronizarCategoriasBase();

      this.listaCategorias = this.listaCategorias.filter(categoria =>
        this.categoriasPermitidas.includes(categoria.id)
      );

      this.ordenarCategorias();
      this.buscar();
      this.calcularKPIs();

      console.log('✅ Categorías cargadas:', this.listaCategorias.length);

    } catch (error) {
      console.error('❌ Error cargando categorías:', error);
    }
  }

  escucharCategoriasTiempoReal() {
    const categoriasRef = collection(this.firestore, 'categorias');

    this.categoriasSub = collectionData(categoriasRef, { idField: 'id' }).subscribe({
      next: (categorias: any[]) => {
        this.listaCategorias = categorias
          .filter(categoria => this.categoriasPermitidas.includes(categoria.id))
          .map(categoria => ({
            ...categoria,
            nombre: categoria.nombre || 'Sin nombre',
            emoji: categoria.emoji || '📁',
            cantidadProductos: Number(categoria.cantidadProductos || 0),
            activo: categoria.activo !== false,
            orden: Number(categoria.orden || this.obtenerOrdenCategoria(categoria.id))
          }));

        this.actualizarCantidadProductosLocal();
        this.ordenarCategorias();
        this.buscar();
        this.calcularKPIs();
      },
      error: (error) => {
        console.error('❌ Error escuchando categorías:', error);
      }
    });
  }

  escucharProductosTiempoReal() {
    const productosRef = collection(this.firestore, 'productos');

    this.productosSub = collectionData(productosRef, { idField: 'id' }).subscribe({
      next: async (productos: any[]) => {
        this.listaProductos = productos.map(producto => ({
          ...producto,
          categoriaId: this.normalizarCategoriaProducto(producto.categoriaId),
          activo: producto.activo !== false
        }));

        this.actualizarCantidadProductosLocal();
        this.ordenarCategorias();
        this.buscar();
        this.calcularKPIs();

        await this.actualizarCantidadProductosFirebase();
      },
      error: (error) => {
        console.error('❌ Error escuchando productos:', error);
      }
    });
  }

  async sincronizarCategoriasBase() {
    try {
      for (const categoria of this.categoriasCarta) {
        const existe = this.listaCategorias.some(c => c.id === categoria.id);
        const categoriaRef = doc(this.firestore, 'categorias', categoria.id);

        if (!existe) {
          await setDoc(categoriaRef, {
            nombre: categoria.nombre,
            emoji: categoria.emoji,
            cantidadProductos: 0,
            activo: true,
            orden: categoria.orden,
            creadoEn: new Date(),
            actualizadoEn: new Date()
          });

          this.listaCategorias.push({ ...categoria });
        } else {
          await setDoc(categoriaRef, {
            nombre: categoria.nombre,
            emoji: categoria.emoji,
            orden: categoria.orden,
            actualizadoEn: new Date()
          }, { merge: true });
        }
      }

      console.log('✅ Categorías base sincronizadas.');

    } catch (error) {
      console.error('❌ Error sincronizando categorías base:', error);
    }
  }

  async migrarProductosCategoriasAntiguas() {
    try {
      const productosSnapshot = await getDocs(collection(this.firestore, 'productos'));

      for (const documento of productosSnapshot.docs) {
        const producto: any = documento.data();
        const categoriaActual = producto.categoriaId;
        const nuevaCategoriaId = this.normalizarCategoriaProducto(categoriaActual);

        if (categoriaActual !== nuevaCategoriaId) {
          await updateDoc(doc(this.firestore, 'productos', documento.id), {
            categoriaId: nuevaCategoriaId,
            categoria: this.obtenerNombreCategoria(nuevaCategoriaId),
            actualizadoEn: new Date()
          });

          console.log(`🔁 Producto migrado: ${producto.nombre || documento.id} → ${nuevaCategoriaId}`);
        }
      }

      console.log('✅ Migración de productos finalizada.');

    } catch (error) {
      console.error('❌ Error migrando productos antiguos:', error);
    }
  }

  async limpiarCategoriasObsoletas() {
    try {
      const snapshot = await getDocs(collection(this.firestore, 'categorias'));

      for (const documento of snapshot.docs) {
        if (!this.categoriasPermitidas.includes(documento.id)) {
          await deleteDoc(doc(this.firestore, 'categorias', documento.id));
          console.log('🗑 Categoría antigua eliminada:', documento.id);
        }
      }

      this.listaCategorias = this.listaCategorias.filter(categoria =>
        this.categoriasPermitidas.includes(categoria.id)
      );

      this.buscar();
      this.calcularKPIs();

    } catch (error) {
      console.error('❌ Error limpiando categorías obsoletas:', error);
    }
  }

  async crearCategoriasAutomaticas() {
    try {
      for (const categoria of this.categoriasCarta) {
        const categoriaRef = doc(this.firestore, 'categorias', categoria.id);

        await setDoc(categoriaRef, {
          nombre: categoria.nombre,
          emoji: categoria.emoji,
          cantidadProductos: 0,
          activo: true,
          orden: categoria.orden,
          creadoEn: new Date(),
          actualizadoEn: new Date()
        }, { merge: true });
      }

      this.listaCategorias = [...this.categoriasCarta];
      this.actualizarCantidadProductosLocal();
      this.ordenarCategorias();
      this.buscar();
      this.calcularKPIs();

      console.log('✅ Categorías automáticas creadas:', this.listaCategorias.length);

    } catch (error) {
      console.error('❌ Error creando categorías automáticas:', error);
    }
  }

  actualizarCantidadProductosLocal() {
    this.listaCategorias = this.listaCategorias.map(categoria => {
      const cantidad = this.listaProductos.filter(producto =>
        this.normalizarCategoriaProducto(producto.categoriaId) === categoria.id &&
        producto.activo !== false
      ).length;

      return {
        ...categoria,
        cantidadProductos: cantidad
      };
    });

    this.totalProductosCarta = this.listaProductos.filter(producto =>
      producto.activo !== false
    ).length;
  }

  async actualizarCantidadProductos() {
    try {
      const productosSnapshot = await getDocs(collection(this.firestore, 'productos'));

      this.listaProductos = [];

      productosSnapshot.forEach((documento) => {
        const producto: any = documento.data();

        this.listaProductos.push({
          id: documento.id,
          ...producto,
          categoriaId: this.normalizarCategoriaProducto(producto.categoriaId),
          activo: producto.activo !== false
        });
      });

      this.actualizarCantidadProductosLocal();
      await this.actualizarCantidadProductosFirebase();

      console.log('✅ Cantidad de productos actualizada.');

    } catch (error) {
      console.error('❌ Error actualizando cantidad de productos:', error);
    }
  }

  async actualizarCantidadProductosFirebase() {
    try {
      for (const categoria of this.listaCategorias) {
        if (!this.categoriasPermitidas.includes(categoria.id)) continue;

        const categoriaRef = doc(this.firestore, 'categorias', categoria.id);

        await updateDoc(categoriaRef, {
          cantidadProductos: Number(categoria.cantidadProductos || 0),
          actualizadoEn: new Date()
        });
      }
    } catch (error) {
      console.error('❌ Error guardando cantidad de productos en categorías:', error);
    }
  }

  calcularKPIs() {
    const categoriasBase = this.listaCategorias.filter(categoria =>
      this.categoriasPermitidas.includes(categoria.id)
    );

    this.totalCategorias = categoriasBase.length;
    this.totalActivas = categoriasBase.filter(categoria => categoria.activo !== false).length;
    this.totalInactivas = categoriasBase.filter(categoria => categoria.activo === false).length;
    this.totalProductosCarta = this.listaProductos.filter(producto => producto.activo !== false).length;
  }

  async guardarCategoria() {
    if (!this.editando || this.idCategoriaEditando === null) {
      alert('En producción solo se editan las categorías principales. No se pueden crear categorías nuevas.');
      return;
    }

    if (!this.nuevaCategoria.nombre.trim() || !this.nuevaCategoria.emoji.trim()) return;

    if (!this.categoriasPermitidas.includes(this.idCategoriaEditando)) {
      alert('Esta categoría no pertenece a las categorías principales del sistema.');
      return;
    }

    try {
      const dataCategoria = {
        nombre: this.nuevaCategoria.nombre.trim(),
        emoji: this.nuevaCategoria.emoji.trim(),
        activo: this.nuevaCategoria.activo !== false,
        actualizadoEn: new Date()
      };

      const categoriaRef = doc(this.firestore, 'categorias', this.idCategoriaEditando);
      await updateDoc(categoriaRef, dataCategoria);

      this.ordenarCategorias();
      this.buscar();
      this.calcularKPIs();
      this.cerrarFormulario();

    } catch (error) {
      console.error('❌ Error guardando categoría:', error);
    }
  }

  seleccionarCategoria(categoria: any) {
    if (!this.categoriasPermitidas.includes(categoria.id)) {
      alert('Esta categoría no pertenece a las categorías principales.');
      return;
    }

    this.editando = true;
    this.idCategoriaEditando = categoria.id;

    this.nuevaCategoria = {
      nombre: categoria.nombre,
      emoji: categoria.emoji,
      activo: categoria.activo !== false
    };

    this.mostrarFormulario = true;
  }

  cancelarEdicion() {
    this.editando = false;
    this.idCategoriaEditando = null;
    this.limpiarFormulario();
  }

  async eliminarCategoria(id: string) {
    if (!this.categoriasPermitidas.includes(id)) return;

    const confirmar = confirm('¿Deseas desactivar esta categoría? No se eliminará definitivamente.');

    if (!confirmar) return;

    try {
      const categoriaRef = doc(this.firestore, 'categorias', id);

      await updateDoc(categoriaRef, {
        activo: false,
        actualizadoEn: new Date()
      });

    } catch (error) {
      console.error('❌ Error desactivando categoría:', error);
    }
  }

  async activarCategoria(categoria: any) {
    if (!this.categoriasPermitidas.includes(categoria.id)) return;

    try {
      const categoriaRef = doc(this.firestore, 'categorias', categoria.id);

      await updateDoc(categoriaRef, {
        activo: true,
        actualizadoEn: new Date()
      });

    } catch (error) {
      console.error('❌ Error activando categoría:', error);
    }
  }

  async cambiarEstadoCategoria(categoria: any) {
    if (!this.categoriasPermitidas.includes(categoria.id)) return;

    try {
      const nuevoEstado = categoria.activo === false;
      const categoriaRef = doc(this.firestore, 'categorias', categoria.id);

      await updateDoc(categoriaRef, {
        activo: nuevoEstado,
        actualizadoEn: new Date()
      });

    } catch (error) {
      console.error('❌ Error cambiando estado de categoría:', error);
    }
  }

  buscar() {
    const q = this.textoBuscar.toLowerCase().trim();

    const categoriasBase = this.listaCategorias.filter(categoria =>
      this.categoriasPermitidas.includes(categoria.id)
    );

    if (!q) {
      this.categoriasFiltradas = [...categoriasBase];
      return;
    }

    this.categoriasFiltradas = categoriasBase.filter(categoria =>
      String(categoria.nombre || '').toLowerCase().includes(q) ||
      String(categoria.id || '').toLowerCase().includes(q)
    );
  }

  ordenarCategorias() {
    this.listaCategorias.sort((a, b) => {
      const indexA = this.categoriasPermitidas.indexOf(a.id);
      const indexB = this.categoriasPermitidas.indexOf(b.id);

      if (indexA === -1 && indexB === -1) {
        return String(a.nombre || '').localeCompare(String(b.nombre || ''));
      }

      if (indexA === -1) return 1;
      if (indexB === -1) return -1;

      return indexA - indexB;
    });
  }

  obtenerOrdenCategoria(id: string): number {
    const index = this.categoriasPermitidas.indexOf(id);
    return index === -1 ? 999 : index + 1;
  }

  obtenerNombreCategoria(id: string): string {
    switch (id) {
      case 'cat_chifa': return 'Chifa';
      case 'cat_pollos': return 'Pollos';
      case 'cat_parrillas': return 'Parrillas';
      case 'cat_criollos': return 'Criollos';
      case 'cat_guarniciones': return 'Guarniciones';
      case 'cat_bebidas': return 'Bebidas';
      default: return 'Extras';
    }
  }

  normalizarCategoriaProducto(categoriaId: any): string {
    const id = String(categoriaId || '').trim();

    const mapaCategoriasAntiguas: any = {
      'sopas-chifa': 'cat_chifa',
      'chifa-a-la-carta': 'cat_chifa',
      'mostros-brasa': 'cat_chifa',

      'pollo-a-la-brasa': 'cat_pollos',
      'ofertas-familiares': 'cat_pollos',
      'mas-ofertas': 'cat_pollos',
      'brasa-a-lo-pobre': 'cat_pollos',

      'parrillas': 'cat_parrillas',
      'ofertas-parrilleras': 'cat_parrillas',

      'platos-criollos': 'cat_criollos',

      'guarniciones': 'cat_guarniciones',

      'bebidas-frias': 'cat_bebidas',
      'bebidas-calientes': 'cat_bebidas',
      'vinos': 'cat_bebidas'
    };

    if (this.categoriasPermitidas.includes(id)) {
      return id;
    }

    return mapaCategoriasAntiguas[id] || 'cat_chifa';
  }

  limpiarFormulario() {
    this.nuevaCategoria = {
      nombre: '',
      emoji: '',
      activo: true
    };
  }
}