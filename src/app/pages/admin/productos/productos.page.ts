import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
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
  IonNote,
  IonSearchbar,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonButtons,
  IonBackButton,
  IonMenuButton
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  fastFood, create, trash, arrowBack,
  searchOutline, addOutline, closeOutline, pencilOutline, trashOutline
} from 'ionicons/icons';

import {
  Firestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  setDoc
} from '@angular/fire/firestore';

@Component({
  selector: 'app-productos',
  templateUrl: './productos.page.html',
  styleUrls: ['./productos.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DecimalPipe,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
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
    IonNote,
    IonSearchbar,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonButtons,
    IonBackButton,
    IonMenuButton
  ]
})
export class ProductosPage implements OnInit {

  private firestore = inject(Firestore);

  fechaActual: string = '';
  mostrarFormulario: boolean = false;

  filtroCategoria: string = 'Todos';
  categoriasFiltro = ['Todos', 'Pollos', 'Chifa', 'Parrillas', 'Criollos', 'Bebidas', 'Guarniciones'];

  totalProductos: number = 0;
  totalDisponibles: number = 0;
  totalNoDisponibles: number = 0;
  totalStockBajo: number = 0;

  nuevoProducto = {
    nombre: '',
    precio: null as number | null,
    stock: null as number | null,
    categoriaId: ''
  };

  editando: boolean = false;
  idProductoEditando: string | null = null;
  textoBuscar: string = '';

  listaProductos: any[] = [];
  productosFiltrados: any[] = [];

  // Carta oficial completa de Pollería Dylan.
  // Estos son PRODUCTOS de venta, no insumos de inventario.
  private cartaSemilla: any[] = [
  { id: 'sopa-wantan-c-pollo', nombre: 'SOPA WANTAN C/ POLLO', precio: 9.00, stock: null, categoriaId: 'cat_chifa' },
  { id: 'sopa-wantan-especial', nombre: 'SOPA WANTAN ESPECIAL', precio: 14.00, stock: null, categoriaId: 'cat_chifa' },
  { id: 'sopa-de-kion', nombre: 'SOPA DE KION', precio: 10.00, stock: null, categoriaId: 'cat_chifa' },
  { id: 'chaufa-de-pollo', nombre: 'CHAUFA DE POLLO', precio: 11.00, stock: null, categoriaId: 'cat_chifa' },
  { id: 'chaufa-de-carne', nombre: 'CHAUFA DE CARNE', precio: 12.00, stock: null, categoriaId: 'cat_chifa' },
  { id: 'chaufa-de-chancho', nombre: 'CHAUFA DE CHANCHO', precio: 14.00, stock: null, categoriaId: 'cat_chifa' },
  { id: 'chaufa-de-langostinos', nombre: 'CHAUFA DE LANGOSTINOS', precio: 14.00, stock: null, categoriaId: 'cat_chifa' },
  { id: 'chaufa-especial', nombre: 'CHAUFA ESPECIAL', precio: 18.00, stock: null, categoriaId: 'cat_chifa' },
  { id: 'chaufa-c-pollo-en-trozos', nombre: 'CHAUFA C/ POLLO EN TROZOS', precio: 14.00, stock: null, categoriaId: 'cat_chifa' },
  { id: 'chaufa-salvaje-de-pollo', nombre: 'CHAUFA SALVAJE DE POLLO', precio: 13.00, stock: null, categoriaId: 'cat_chifa' },
  { id: 'aeropuerto-de-pollo', nombre: 'AEROPUERTO DE POLLO', precio: 13.00, stock: null, categoriaId: 'cat_chifa' },
  { id: 'aeropuerto-de-carne', nombre: 'AEROPUERTO DE CARNE', precio: 14.00, stock: null, categoriaId: 'cat_chifa' },
  { id: 'aeropuerto-de-chancho', nombre: 'AEROPUERTO DE CHANCHO', precio: 15.00, stock: null, categoriaId: 'cat_chifa' },
  { id: 'aeropuerto-de-langostinos', nombre: 'AEROPUERTO DE LANGOSTINOS', precio: 15.00, stock: null, categoriaId: 'cat_chifa' },
  { id: 'aeropuerto-especial', nombre: 'AEROPUERTO ESPECIAL', precio: 19.00, stock: null, categoriaId: 'cat_chifa' },
  { id: 'aeropuerto-c-pollo-en-trozos', nombre: 'AEROPUERTO C/ POLLO EN TROZOS', precio: 14.00, stock: null, categoriaId: 'cat_chifa' },
  { id: 'tallarin-c-pollo', nombre: 'TALLARIN C/ POLLO', precio: 13.00, stock: null, categoriaId: 'cat_chifa' },
  { id: 'tallarin-de-carne', nombre: 'TALLARIN DE CARNE', precio: 13.00, stock: null, categoriaId: 'cat_chifa' },
  { id: 'tallarin-de-chancho', nombre: 'TALLARIN DE CHANCHO', precio: 14.00, stock: null, categoriaId: 'cat_chifa' },
  { id: 'tallarin-de-langostinos', nombre: 'TALLARIN DE LANGOSTINOS', precio: 15.00, stock: null, categoriaId: 'cat_chifa' },
  { id: 'tallarin-especial', nombre: 'TALLARIN ESPECIAL', precio: 20.00, stock: null, categoriaId: 'cat_chifa' },
  { id: 'tallarin-c-pollo-en-trozos', nombre: 'TALLARIN C/ POLLO EN TROZOS', precio: 14.00, stock: null, categoriaId: 'cat_chifa' },
  { id: 'tortilla-c-pollo', nombre: 'TORTILLA C/ POLLO', precio: 14.00, stock: null, categoriaId: 'cat_chifa' },
  { id: 'tortilla-c-carne', nombre: 'TORTILLA C/ CARNE', precio: 14.00, stock: null, categoriaId: 'cat_chifa' },
  { id: 'tortilla-c-chancho', nombre: 'TORTILLA C/ CHANCHO', precio: 14.00, stock: null, categoriaId: 'cat_chifa' },
  { id: 'tortilla-c-langostinos', nombre: 'TORTILLA C/ LANGOSTINOS', precio: 15.00, stock: null, categoriaId: 'cat_chifa' },
  { id: 'combinado', nombre: 'COMBINADO', precio: 14.00, stock: null, categoriaId: 'cat_chifa' },
  { id: 'combinado-especial', nombre: 'COMBINADO ESPECIAL', precio: 20.00, stock: null, categoriaId: 'cat_chifa' },
  { id: 'combinado-c-pollo-en-trozos', nombre: 'COMBINADO C/ POLLO EN TROZOS', precio: 16.00, stock: null, categoriaId: 'cat_chifa' },
  { id: 'pollo-c-verduras', nombre: 'POLLO C/ VERDURAS', precio: 14.00, stock: null, categoriaId: 'cat_chifa' },
  { id: 'chancho-c-verduras', nombre: 'CHANCHO C/ VERDURAS', precio: 14.00, stock: null, categoriaId: 'cat_chifa' },
  { id: 'pollo-en-trozos-c-verduras', nombre: 'POLLO EN TROZOS C/ VERDURAS', precio: 16.00, stock: null, categoriaId: 'cat_chifa' },
  { id: 'frijolito-c-pollo', nombre: 'FRIJOLITO C/ POLLO', precio: 13.00, stock: null, categoriaId: 'cat_chifa' },
  { id: 'limonkay', nombre: 'LIMONKAY', precio: 15.00, stock: null, categoriaId: 'cat_chifa' },
  { id: 'pollo-chijaukay', nombre: 'POLLO CHIJAUKAY', precio: 15.00, stock: null, categoriaId: 'cat_chifa' },
  { id: 'tipakay', nombre: 'TIPAKAY', precio: 15.00, stock: null, categoriaId: 'cat_chifa' },
  { id: '1-pollo-papas-ensalada-cremas', nombre: '1 POLLO + PAPAS + ENSALADA + CREMAS', precio: 48.00, stock: null, categoriaId: 'cat_pollos' },
  { id: 'medio-pollo-papas-ensalada-cremas', nombre: '1/2 POLLO + PAPAS + ENSALADA + CREMAS', precio: 25.00, stock: null, categoriaId: 'cat_pollos' },
  { id: 'cuarto-pollo-papas-ensalada-cremas', nombre: '1/4 POLLO + PAPAS + ENSALADA + CREMAS', precio: 13.00, stock: null, categoriaId: 'cat_pollos' },
  { id: 'octavo-pollo-papas-ensalada-cremas', nombre: '1/8 POLLO + PAPAS + ENSALADA + CREMAS', precio: 11.00, stock: null, categoriaId: 'cat_pollos' },
  { id: 'cuarto-pollo-light-arroz-blanco-ensalada-fresca-cremas', nombre: '1/4 POLLO LIGHT (Arroz Blanco + Ensalada Fresca + Cremas)', precio: 11.00, stock: null, categoriaId: 'cat_pollos' },
  { id: 'cuarto-pollo-1-anticucho-papas-fritas-ensalada-cremas', nombre: '1/4 POLLO + 1 ANTICUCHO (Papas Fritas + Ensalada + Cremas)', precio: 20.00, stock: null, categoriaId: 'cat_pollos' },
  { id: 'salchibrasa-cuarto-pollo-hot-dog-papas-ensalada-cremas', nombre: 'SALCHIBRASA (1/4 Pollo + Hot Dog + Papas + Ensalada + Cremas)', precio: 14.00, stock: null, categoriaId: 'cat_pollos' },
  { id: '1-pollo-solo', nombre: '1 POLLO SOLO', precio: 35.00, stock: null, categoriaId: 'cat_pollos' },
  { id: 'medio-pollo-solo', nombre: '1/2 POLLO SOLO', precio: 17.00, stock: null, categoriaId: 'cat_pollos' },
  { id: 'cuarto-pollo-solo', nombre: '1/4 POLLO SOLO', precio: 10.00, stock: null, categoriaId: 'cat_pollos' },
  { id: '3-pollos-3-porc-papas-3-porc-ensalada-cremas-gratis-cuarto-pollo-solo', nombre: '3 POLLOS (3 Porc. Papas + 3 Porc. Ensalada + Cremas) + GRATIS 1/4 POLLO SOLO', precio: 150.00, stock: null, categoriaId: 'cat_pollos' },
  { id: '2-pollos-2-porc-papas-2-porc-ensalada-cremas-gratis-cuarto-pollo-solo', nombre: '2 POLLOS (2 Porc. Papas + 2 Porc. Ensalada + Cremas) + GRATIS 1/4 POLLO SOLO', precio: 100.00, stock: null, categoriaId: 'cat_pollos' },
  { id: '2x1-1-pollo-1-porc-papas-ensalada-cremas', nombre: '2X1 (1 Pollo + 1 Porc. Papas + Ensalada + Cremas)', precio: 80.00, stock: null, categoriaId: 'cat_pollos' },
  { id: '1-pollo-medio-pollo-solo-papas-ensalada-cremas', nombre: '1 POLLO + 1/2 POLLO SOLO (Papas + Ensalada + Cremas)', precio: 63.00, stock: null, categoriaId: 'cat_pollos' },
  { id: '1-pollo-cuarto-pollo-solo-papas-ensalada-cremas', nombre: '1 POLLO + 1/4 POLLO SOLO (Papas + Ensalada + Cremas)', precio: 57.00, stock: null, categoriaId: 'cat_pollos' },
  { id: '1-pollo-cuarto-pollo-s-inca-kola-1-5-l-papas-ensalada-cremas', nombre: '1 POLLO + 1/4 POLLO S. + INCA KOLA 1.5 L (Papas + Ensalada + Cremas)', precio: 64.00, stock: null, categoriaId: 'cat_pollos' },
  { id: '1-pollo-inca-kola-1-5-l-papas-ensalada-cremas', nombre: '1 POLLO + INCA KOLA 1.5 L (Papas + Ensalada + Cremas)', precio: 55.00, stock: null, categoriaId: 'cat_pollos' },
  { id: 'mostro-familiar-1-1-pollo-cuarto-solo-chaufa-inca-kola-1-5-l-papas-ensalada-cremas', nombre: 'MOSTRO FAMILIAR 1 (1 Pollo + 1/4 Solo + Chaufa + Inca Kola 1.5 L + Papas + Ensalada + Cremas)', precio: 75.00, stock: null, categoriaId: 'cat_chifa' },
  { id: 'mostro-familiar-2-1-pollo-cuarto-solo-chaufa-papas-ensalada-cremas', nombre: 'MOSTRO FAMILIAR 2 (1 Pollo + 1/4 Solo + Chaufa + Papas + Ensalada + Cremas)', precio: 68.00, stock: null, categoriaId: 'cat_chifa' },
  { id: 'mostro-familiar-3-1-pollo-chaufa-inca-kola-1-5-l-papas-ensalada-cremas', nombre: 'MOSTRO FAMILIAR 3 (1 Pollo + Chaufa + Inca Kola 1.5 L + Papas + Ensalada + Cremas)', precio: 66.00, stock: null, categoriaId: 'cat_chifa' },
  { id: 'mostro-familiar-4-1-pollo-chaufa-papas-ensalada-cremas', nombre: 'MOSTRO FAMILIAR 4 (1 Pollo + Chaufa + Papas + Ensalada + Cremas)', precio: 58.00, stock: null, categoriaId: 'cat_chifa' },
  { id: 'mostro-medio-pollo-chaufa-papas-ensalada-cremas', nombre: 'MOSTRO (1/2 Pollo + Chaufa + Papas + Ensalada + Cremas)', precio: 34.00, stock: null, categoriaId: 'cat_chifa' },
  { id: 'mostro-cuarto-pollo-chaufa-papas-ensalada-cremas', nombre: 'MOSTRO (1/4 Pollo + Chaufa + Papas + Ensalada + Cremas)', precio: 16.00, stock: null, categoriaId: 'cat_chifa' },
  { id: 'mostrito-octavo-pollo-chaufa-papas-ensalada-cremas', nombre: 'MOSTRITO (1/8 Pollo + Chaufa + Papas + Ensalada + Cremas)', precio: 12.00, stock: null, categoriaId: 'cat_chifa' },
  { id: 'sabroso-medio-pollo-hot-dog-chaufa-papas', nombre: 'SABROSO (1/2 Pollo + Hot Dog + Chaufa + Papas)', precio: 17.00, stock: null, categoriaId: 'cat_chifa' },
  { id: 'sabrosito-cuarto-pollo-hot-dog-chaufa-papas', nombre: 'SABROSITO (1/4 Pollo + Hot Dog + Chaufa + Papas)', precio: 13.00, stock: null, categoriaId: 'cat_chifa' },
  { id: 'combo-cuarto-pollo-chaufa-hot-dog-huevo', nombre: 'COMBO (1/4 Pollo + Chaufa + Hot Dog + Huevo)', precio: 18.00, stock: null, categoriaId: 'cat_pollos' },
  { id: 'combito-octavo-pollo-chaufa-hot-dog-huevo', nombre: 'COMBITO (1/8 Pollo + Chaufa + Hot Dog + Huevo)', precio: 14.00, stock: null, categoriaId: 'cat_pollos' },
  { id: 'combo-chorizero-cuarto-pollo-chaufa-chorizo-huevo', nombre: 'COMBO CHORIZERO (1/4 Pollo + Chaufa + Chorizo + Huevo)', precio: 19.00, stock: null, categoriaId: 'cat_pollos' },
  { id: 'salchipapa-clasica', nombre: 'SALCHIPAPA CLÁSICA', precio: 8.00, stock: null, categoriaId: 'cat_pollos' },
  { id: 'salchipapa-montada', nombre: 'SALCHIPAPA MONTADA', precio: 9.00, stock: null, categoriaId: 'cat_pollos' },
  { id: 'salchi-mostro', nombre: 'SALCHI MOSTRO', precio: 11.00, stock: null, categoriaId: 'cat_pollos' },
  { id: 'cuarto-pollo-a-lo-pobre-huevo-platano-papas-ensalada-cremas', nombre: '1/4 POLLO A LO POBRE (Huevo + Plátano + Papas + Ensalada + Cremas)', precio: 15.00, stock: null, categoriaId: 'cat_pollos' },
  { id: 'octavo-pollo-a-lo-pobre-huevo-platano-papas-ensalada-cremas', nombre: '1/8 POLLO A LO POBRE (Huevo + Plátano + Papas + Ensalada + Cremas)', precio: 13.00, stock: null, categoriaId: 'cat_pollos' },
  { id: 'cuarto-salchibrasa-a-lo-pobre-huevo-platano-papas-ensalada-cremas', nombre: '1/4 SALCHIBRASA A LO POBRE (Huevo + Plátano + Papas + Ensalada + Cremas)', precio: 16.00, stock: null, categoriaId: 'cat_pollos' },
  { id: 'octavo-salchibrasa-a-lo-pobre-huevo-platano-papas-ensalada-cremas', nombre: '1/8 SALCHIBRASA A LO POBRE (Huevo + Plátano + Papas + Ensalada + Cremas)', precio: 14.00, stock: null, categoriaId: 'cat_pollos' },
  { id: 'mostro-a-lo-pobre-cuarto-pollo-huevo-platano-chaufa-papas-ensalada-cremas', nombre: 'MOSTRO A LO POBRE (1/4 Pollo + Huevo + Plátano + Chaufa + Papas + Ensalada + Cremas)', precio: 18.00, stock: null, categoriaId: 'cat_pollos' },
  { id: 'mostrito-a-lo-pobre-octavo-pollo-huevo-platano-chaufa-papas-ensalada-cremas', nombre: 'MOSTRITO A LO POBRE (1/8 Pollo + Huevo + Plátano + Chaufa + Papas + Ensalada + Cremas)', precio: 14.00, stock: null, categoriaId: 'cat_pollos' },
  { id: 'salchipapa-a-lo-pobre-huevo-platano-papas-ensalada-cremas', nombre: 'SALCHIPAPA A LO POBRE (Huevo + Plátano + Papas + Ensalada + Cremas)', precio: 10.00, stock: null, categoriaId: 'cat_pollos' },
  { id: 'pechuga-a-la-parrilla', nombre: 'PECHUGA A LA PARRILLA', precio: 17.00, stock: null, categoriaId: 'cat_parrillas' },
  { id: 'pechuga-light-a-la-parrilla', nombre: 'PECHUGA LIGHT A LA PARRILLA', precio: 14.00, stock: null, categoriaId: 'cat_parrillas' },
  { id: 'pierna-deshuesada-a-la-parrilla', nombre: 'PIERNA DESHUESADA A LA PARRILLA', precio: 16.00, stock: null, categoriaId: 'cat_parrillas' },
  { id: 'cuarto-pollo-2-anticuchos', nombre: '1/4 POLLO + 2 ANTICUCHOS', precio: 20.00, stock: null, categoriaId: 'cat_parrillas' },
  { id: '2-brochetas-de-pollo-a-la-parrilla', nombre: '2 BROCHETAS DE POLLO A LA PARRILLA', precio: 20.00, stock: null, categoriaId: 'cat_parrillas' },
  { id: '3-palitos-de-anticuchos', nombre: '3 PALITOS DE ANTICUCHOS', precio: 20.00, stock: null, categoriaId: 'cat_parrillas' },
  { id: 'churrasco-a-la-parrilla', nombre: 'CHURRASCO A LA PARRILLA', precio: 17.00, stock: null, categoriaId: 'cat_parrillas' },
  { id: 'churrasco-a-la-parrilla-a-lo-pobre', nombre: 'CHURRASCO A LA PARRILLA A LO POBRE', precio: 19.00, stock: null, categoriaId: 'cat_parrillas' },
  { id: 'chuleta-a-la-parrilla', nombre: 'CHULETA A LA PARRILLA', precio: 16.00, stock: null, categoriaId: 'cat_parrillas' },
  { id: 'chuleta-a-la-parrilla-a-lo-pobre', nombre: 'CHULETA A LA PARRILLA A LO POBRE', precio: 18.00, stock: null, categoriaId: 'cat_parrillas' },
  { id: 'bistec-a-la-parrilla', nombre: 'BISTEC A LA PARRILLA', precio: 17.00, stock: null, categoriaId: 'cat_parrillas' },
  { id: 'bistec-a-lo-pobre', nombre: 'BISTEC A LO POBRE', precio: 20.00, stock: null, categoriaId: 'cat_parrillas' },
  { id: 'oferta-1-1-chuleta-1-chorizo-1-anticucho-mollejitas', nombre: 'OFERTA 1 (1 Chuleta + 1 Chorizo + 1 Anticucho + Mollejitas)', precio: 34.00, stock: null, categoriaId: 'cat_parrillas' },
  { id: 'oferta-2-1-brocheta-de-pollo-churrasco-250-mg-1-chorizo', nombre: 'OFERTA 2 (1 Brocheta de Pollo + Churrasco 250 mg + 1 Chorizo)', precio: 31.00, stock: null, categoriaId: 'cat_parrillas' },
  { id: 'oferta-3-1-pechuga-1-chuleta-1-chorizo-mollejitas', nombre: 'OFERTA 3 (1 Pechuga + 1 Chuleta + 1 Chorizo + Mollejitas)', precio: 36.00, stock: null, categoriaId: 'cat_parrillas' },
  { id: 'oferta-4-mollejitas-papas-ensalada-y-cremas', nombre: 'OFERTA 4 (Mollejitas + Papas + Ensalada y Cremas)', precio: 14.00, stock: null, categoriaId: 'cat_parrillas' },
  { id: 'parrillas-dylan-1-brocheta-de-pollo-4-palitos-de-anticuchos-2-chorizos-2-chuletas-mollejitas', nombre: 'PARRILLAS DYLAN (1 Brocheta de Pollo + 4 Palitos de Anticuchos + 2 Chorizos + 2 Chuletas + Mollejitas)', precio: 45.00, stock: null, categoriaId: 'cat_parrillas' },
  { id: 'parrilla-familiar-1-bisteck-1-churrasco-1-chuleta-1-pechuga-2-anticuchos-1-chorizo-1-hot-dog', nombre: 'PARRILLA FAMILIAR (1 Bisteck + 1 Churrasco + 1 Chuleta + 1 Pechuga + 2 Anticuchos + 1 Chorizo + 1 Hot Dog)', precio: 68.00, stock: null, categoriaId: 'cat_parrillas' },
  { id: 'chorizo-clasico', nombre: 'CHORIZO CLÁSICO', precio: 9.00, stock: null, categoriaId: 'cat_parrillas' },
  { id: 'lomo-saltado-c-arroz-blanco', nombre: 'LOMO SALTADO C/ ARROZ BLANCO', precio: 14.00, stock: null, categoriaId: 'cat_criollos' },
  { id: 'lomo-saltado-c-chaufa', nombre: 'LOMO SALTADO C/ CHAUFA', precio: 15.00, stock: null, categoriaId: 'cat_criollos' },
  { id: 'lomo-montado', nombre: 'LOMO MONTADO', precio: 16.00, stock: null, categoriaId: 'cat_criollos' },
  { id: 'lomo-a-lo-pobre', nombre: 'LOMO A LO POBRE', precio: 17.00, stock: null, categoriaId: 'cat_criollos' },
  { id: 'pollo-saltado-c-arroz-blanco', nombre: 'POLLO SALTADO C/ ARROZ BLANCO', precio: 13.00, stock: null, categoriaId: 'cat_criollos' },
  { id: 'pollo-saltado-c-chaufa', nombre: 'POLLO SALTADO C/ CHAUFA', precio: 14.00, stock: null, categoriaId: 'cat_criollos' },
  { id: 'pollo-saltado-a-lo-pobre', nombre: 'POLLO SALTADO A LO POBRE', precio: 16.00, stock: null, categoriaId: 'cat_criollos' },
  { id: 'tallarin-verde-c-cuarto-pollo', nombre: 'TALLARÍN VERDE C/ 1/4 POLLO', precio: 16.00, stock: null, categoriaId: 'cat_criollos' },
  { id: 'tallarin-verde-c-bistec', nombre: 'TALLARÍN VERDE C/ BISTEC', precio: 16.00, stock: null, categoriaId: 'cat_criollos' },
  { id: 'tallarin-verde-c-pechuga-a-la-plancha', nombre: 'TALLARÍN VERDE C/ PECHUGA A LA PLANCHA', precio: 16.00, stock: null, categoriaId: 'cat_criollos' },
  { id: 'tallarin-saltado-c-pollo', nombre: 'TALLARÍN SALTADO C/ POLLO', precio: 15.00, stock: null, categoriaId: 'cat_criollos' },
  { id: 'tallarin-saltado-c-carne', nombre: 'TALLARÍN SALTADO C/ CARNE', precio: 15.00, stock: null, categoriaId: 'cat_criollos' },
  { id: 'chicharron-de-pollo-clasico', nombre: 'CHICHARRÓN DE POLLO CLÁSICO', precio: 14.00, stock: null, categoriaId: 'cat_criollos' },
  { id: 'porc-papas-fritas', nombre: 'PORC. PAPAS FRITAS', precio: 14.00, stock: null, categoriaId: 'cat_guarniciones' },
  { id: 'medio-porc-papas-fritas', nombre: '1/2 PORC. PAPAS FRITAS', precio: 8.00, stock: null, categoriaId: 'cat_guarniciones' },
  { id: 'porc-ensalada-mixta', nombre: 'PORC. ENSALADA MIXTA', precio: 6.00, stock: null, categoriaId: 'cat_guarniciones' },
  { id: 'medio-porc-ensalada-mixta', nombre: '1/2 PORC. ENSALADA MIXTA', precio: 3.00, stock: null, categoriaId: 'cat_guarniciones' },
  { id: 'porc-arroz-chaufa', nombre: 'PORC. ARROZ CHAUFA', precio: 5.00, stock: null, categoriaId: 'cat_guarniciones' },
  { id: 'porc-arroz-blanco', nombre: 'PORC. ARROZ BLANCO', precio: 5.00, stock: null, categoriaId: 'cat_guarniciones' },
  { id: 'porc-platano-frito', nombre: 'PORC. PLÁTANO FRITO', precio: 2.00, stock: null, categoriaId: 'cat_guarniciones' },
  { id: 'porc-huevo-frito', nombre: 'PORC. HUEVO FRITO', precio: 2.00, stock: null, categoriaId: 'cat_guarniciones' },
  { id: 'porc-hot-dog', nombre: 'PORC. HOT DOG', precio: 2.00, stock: null, categoriaId: 'cat_guarniciones' },
  { id: 'docena-wantan-frito', nombre: 'DOCENA WANTAN FRITO', precio: 9.00, stock: null, categoriaId: 'cat_guarniciones' },
  { id: 'medio-docena-wantan-frito', nombre: '1/2 DOCENA WANTAN FRITO', precio: 6.00, stock: null, categoriaId: 'cat_guarniciones' },
  { id: 'chicha-morada-jarra-1-l', nombre: 'CHICHA MORADA JARRA 1 L', precio: 10.00, stock: null, categoriaId: 'cat_bebidas' },
  { id: 'chicha-morada-jarra-medio-l', nombre: 'CHICHA MORADA JARRA 1/2 L', precio: 5.00, stock: null, categoriaId: 'cat_bebidas' },
  { id: 'chicha-morada-vaso', nombre: 'CHICHA MORADA VASO', precio: 2.00, stock: null, categoriaId: 'cat_bebidas' },
  { id: 'maracuya-jarra-1-l', nombre: 'MARACUYÁ JARRA 1 L', precio: 10.00, stock: null, categoriaId: 'cat_bebidas' },
  { id: 'maracuya-jarra-medio-l', nombre: 'MARACUYÁ JARRA 1/2 L', precio: 5.00, stock: null, categoriaId: 'cat_bebidas' },
  { id: 'maracuya-vaso', nombre: 'MARACUYÁ VASO', precio: 2.00, stock: null, categoriaId: 'cat_bebidas' },
  { id: 'limonada-frozen-1-l', nombre: 'LIMONADA FROZEN 1 L', precio: 10.00, stock: null, categoriaId: 'cat_bebidas' },
  { id: 'limonada-frozen-medio-l', nombre: 'LIMONADA FROZEN 1/2 L', precio: 5.00, stock: null, categoriaId: 'cat_bebidas' },
  { id: 'limonada-frozen-vaso', nombre: 'LIMONADA FROZEN VASO', precio: 2.00, stock: null, categoriaId: 'cat_bebidas' },
  { id: 'gaseosa-3-l', nombre: 'GASEOSA 3 L', precio: 11.00, stock: null, categoriaId: 'cat_bebidas' },
  { id: 'gaseosa-1-medio-l', nombre: 'GASEOSA 1 1/2 L', precio: 9.00, stock: null, categoriaId: 'cat_bebidas' },
  { id: 'gaseosa-1-l', nombre: 'GASEOSA 1 L', precio: 6.00, stock: null, categoriaId: 'cat_bebidas' },
  { id: 'gordita', nombre: 'GORDITA', precio: 4.00, stock: null, categoriaId: 'cat_bebidas' },
  { id: 'personal', nombre: 'PERSONAL', precio: 3.00, stock: null, categoriaId: 'cat_bebidas' },
  { id: 'agua-mineral', nombre: 'AGUA MINERAL', precio: 2.50, stock: null, categoriaId: 'cat_bebidas' },
  { id: 'te', nombre: 'TÉ', precio: 2.00, stock: null, categoriaId: 'cat_bebidas' },
  { id: 'manzanilla', nombre: 'MANZANILLA', precio: 2.00, stock: null, categoriaId: 'cat_bebidas' },
  { id: 'anis', nombre: 'ANÍS', precio: 2.00, stock: null, categoriaId: 'cat_bebidas' },
  { id: 'cafe', nombre: 'CAFÉ', precio: 3.00, stock: null, categoriaId: 'cat_bebidas' },
  { id: 'santiago-queirolo', nombre: 'SANTIAGO QUEIROLO', precio: 0.00, stock: null, categoriaId: 'cat_bebidas' },
  { id: 'tabernero', nombre: 'TABERNERO', precio: 0.00, stock: null, categoriaId: 'cat_bebidas' },
];

  constructor() {
    addIcons({
      fastFood, create, trash, arrowBack,
      searchOutline, addOutline, closeOutline, pencilOutline, trashOutline
    });
  }

  async ngOnInit() {
    this.configurarFecha();
    await this.cargarProductosFirebase();
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
    this.mostrarFormulario = true;
  }

  cerrarFormulario() {
    this.mostrarFormulario = false;
    this.limpiarFormulario();
    this.editando = false;
    this.idProductoEditando = null;
  }

  seleccionarFiltro(cat: string) {
    this.filtroCategoria = cat;
    this.buscar();
  }

  obtenerNombreCategoria(id: string): string {
    switch (id) {
      case 'cat_pollos': return 'Pollos';
      case 'cat_chifa': return 'Chifa';
      case 'cat_parrillas': return 'Parrillas';
      case 'cat_criollos': return 'Criollos';
      case 'cat_bebidas': return 'Bebidas';
      case 'cat_guarniciones': return 'Guarniciones';
      case 'cat_postres': return 'Postres';
      default: return 'Extras';
    }
  }

  obtenerClaseCategoria(id: string): string {
    switch (id) {
      case 'cat_pollos': return 'badge-pollos';
      case 'cat_chifa': return 'badge-chifa';
      case 'cat_parrillas': return 'badge-parrillas';
      case 'cat_criollos': return 'badge-criollos';
      case 'cat_bebidas': return 'badge-bebidas';
      case 'cat_guarniciones': return 'badge-guarniciones';
      default: return 'badge-extras';
    }
  }

  obtenerIcono(id: string): string {
    switch (id) {
      case 'cat_pollos': return '🍗';
      case 'cat_chifa': return '🥡';
      case 'cat_parrillas': return '🥩';
      case 'cat_criollos': return '🍽️';
      case 'cat_bebidas': return '🥤';
      case 'cat_guarniciones': return '🍟';
      default: return '🍽️';
    }
  }

  calcularKPIs() {
    this.totalProductos = this.listaProductos.length;
    this.totalDisponibles = this.listaProductos.filter(p => p.stock === null || p.stock > 0).length;
    this.totalNoDisponibles = this.listaProductos.filter(p => p.stock === 0).length;
    this.totalStockBajo = this.listaProductos.filter(p => p.stock !== null && p.stock > 0 && p.stock <= 10).length;
  }

  async cargarProductosFirebase() {
    try {
      const snapshot = await getDocs(collection(this.firestore, 'productos'));
      this.listaProductos = [];

      snapshot.forEach(docSnap => {
        this.listaProductos.push({
          id: docSnap.id,
          ...docSnap.data()
        });
      });

      if (this.listaProductos.length < this.cartaSemilla.length) {
        console.log('🚚 Completando productos faltantes de la carta oficial...');

        for (const prod of this.cartaSemilla) {
          const productoRef = doc(this.firestore, 'productos', prod.id);
          const { id, ...dataProducto } = prod;

          await setDoc(productoRef, dataProducto, { merge: true });
        }

        const snapshotActualizado = await getDocs(collection(this.firestore, 'productos'));
        this.listaProductos = [];

        snapshotActualizado.forEach(docSnap => {
          this.listaProductos.push({
            id: docSnap.id,
            ...docSnap.data()
          });
        });
      }

      this.buscar();

    } catch (error) {
      console.error('❌ Error cargando productos:', error);
    }
  }

  async guardarProducto() {
    if (!this.nuevoProducto.nombre.trim() || !this.nuevoProducto.precio || !this.nuevoProducto.categoriaId) return;

    try {
      const dataPayload = {
        nombre: this.nuevoProducto.nombre.trim(),
        precio: Number(this.nuevoProducto.precio),
        stock: (this.nuevoProducto.stock !== null && this.nuevoProducto.stock !== undefined && String(this.nuevoProducto.stock).trim() !== '') ? Number(this.nuevoProducto.stock) : null,
        categoriaId: this.nuevoProducto.categoriaId
      };

      if (this.editando && this.idProductoEditando) {
        const ref = doc(this.firestore, 'productos', this.idProductoEditando);
        await updateDoc(ref, dataPayload);

        const index = this.listaProductos.findIndex(p => p.id === this.idProductoEditando);
        if (index !== -1) {
          this.listaProductos[index] = { id: this.idProductoEditando, ...dataPayload };
        }
      } else {
        const docRef = await addDoc(collection(this.firestore, 'productos'), dataPayload);
        this.listaProductos.unshift({ id: docRef.id, ...dataPayload });
      }

      this.buscar();
      this.cerrarFormulario();

    } catch (error) {
      console.error('❌ Error guardando producto:', error);
    }
  }

  seleccionarProducto(producto: any) {
    this.editando = true;
    this.idProductoEditando = producto.id;
    this.nuevoProducto = {
      nombre: producto.nombre,
      precio: producto.precio,
      stock: producto.stock,
      categoriaId: producto.categoriaId
    };
    this.mostrarFormulario = true;
  }

  async eliminarProducto(id: string) {
    try {
      await deleteDoc(doc(this.firestore, 'productos', id));
      this.listaProductos = this.listaProductos.filter(p => p.id !== id);
      this.buscar();
    } catch (error) {
      console.error('❌ Error eliminando producto:', error);
    }
  }

  buscar() {
    const q = this.textoBuscar.toLowerCase().trim();

    this.productosFiltrados = this.listaProductos.filter(p => {
      const matchText = !q || p.nombre.toLowerCase().includes(q);

      let matchCat = true;
      if (this.filtroCategoria !== 'Todos') {
        const catId = p.categoriaId;
        const nombreBajo = p.nombre.toLowerCase();

        if (this.filtroCategoria === 'Pollos') matchCat = (catId === 'cat_pollos');
        else if (this.filtroCategoria === 'Chifa') matchCat = (catId === 'cat_chifa');
        else if (this.filtroCategoria === 'Bebidas') matchCat = (catId === 'cat_bebidas');
        else if (this.filtroCategoria === 'Guarniciones') matchCat = (catId === 'cat_guarniciones' || nombreBajo.includes('porc') || nombreBajo.includes('porción') || nombreBajo.includes('wantan'));
        else if (this.filtroCategoria === 'Parrillas') matchCat = (catId === 'cat_parrillas' || nombreBajo.includes('parrilla') || nombreBajo.includes('anticucho') || nombreBajo.includes('churrasco') || nombreBajo.includes('chuleta') || nombreBajo.includes('bistec'));
        else if (this.filtroCategoria === 'Criollos') matchCat = (catId === 'cat_criollos' || nombreBajo.includes('lomo') || nombreBajo.includes('saltado') || nombreBajo.includes('tallarín') || nombreBajo.includes('tallarin') || nombreBajo.includes('chicharrón'));
        else if (this.filtroCategoria === 'Postres') matchCat = (catId === 'cat_postres');
      }

      return matchText && matchCat;
    });

    this.calcularKPIs();
  }

  limpiarFormulario() {
    this.nuevoProducto = {
      nombre: '',
      precio: null,
      stock: null,
      categoriaId: ''
    };
  }
}
