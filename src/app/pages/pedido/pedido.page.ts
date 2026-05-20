import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router'; // 1. Importamos el Router para la navegación
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-pedido',
  templateUrl: './pedido.page.html',
  styleUrls: ['./pedido.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ]
})
export class PedidoPage implements OnInit {

  categoriaSeleccionada: string = 'Pollos';

  // Inicialización adaptada con el campo dirección en el cliente
  pedido: any = {
    cliente: {
      nombre: '',
      telefono: '',
      direccion: '' // Añadido para soportar la opción de Delivery
    },
    tipoEntrega: 'Recojo',
    estado: 'Activo' // Marcamos por defecto que nace como Activo
  };

  productosBase = [
    // --- POLLOS ---
    { id: 1, categoria: 'Pollos', nombre: 'Pollo a la Brasa 1/4', precio: 18.00 },
    { id: 2, categoria: 'Pollos', nombre: 'Pollo a la Brasa 1/2', precio: 32.00 },

    // --- BEBIDAS ---
    { id: 10, categoria: 'Bebidas', nombre: 'Gaseosa 3 Lts.', precio: 14.00 },
    { id: 11, categoria: 'Bebidas', nombre: 'Gaseosa 1 ½ Lt.', precio: 10.00 },
    { id: 12, categoria: 'Bebidas', nombre: 'Gaseosa 1 Lt.', precio: 7.00 },
    { id: 13, categoria: 'Bebidas', nombre: 'Gaseosa Gordita', precio: 5.00 },
    { id: 14, categoria: 'Bebidas', nombre: 'Gaseosa Personal', precio: 2.50 },
    { id: 15, categoria: 'Bebidas', nombre: 'Pepsi desc. 3 Lts.', precio: 10.00 },
    { id: 16, categoria: 'Bebidas', nombre: 'Pepsi desc. 2 Lts.', precio: 8.00 },
    { id: 17, categoria: 'Bebidas', nombre: 'Pepsi desc. 1.5 Lts.', precio: 5.50 },
    { id: 18, categoria: 'Bebidas', nombre: 'Pepsi desc. 1 Lt.', precio: 4.00 },
    { id: 19, categoria: 'Bebidas', nombre: 'Pepsi personal', precio: 1.50 },
    { id: 20, categoria: 'Bebidas', nombre: 'Concordia Personal', precio: 1.50 },
    { id: 21, categoria: 'Bebidas', nombre: 'Chicha Morada Jarra 1Lt', precio: 10.00 },
    { id: 22, categoria: 'Bebidas', nombre: 'Chicha Morada ½ Lt', precio: 5.00 },
    { id: 23, categoria: 'Bebidas', nombre: 'Chicha Morada Vaso', precio: 2.00 },
    { id: 24, categoria: 'Bebidas', nombre: 'Maracuyá Jarra 1 Lt.', precio: 10.00 },
    { id: 25, categoria: 'Bebidas', nombre: 'Maracuyá Jarra ½ Lt.', precio: 5.00 },
    { id: 26, categoria: 'Bebidas', nombre: 'Maracuyá Vaso', precio: 2.00 },
    { id: 27, categoria: 'Bebidas', nombre: 'Limonada Frozen 1 Lt.', precio: 10.00 },
    { id: 28, categoria: 'Bebidas', nombre: 'Limonada Frozen ½ Lt.', precio: 5.00 },
    { id: 29, categoria: 'Bebidas', nombre: 'Limonada Frozen Vaso', precio: 2.00 },
    { id: 30, categoria: 'Bebidas', nombre: 'Agua Mineral', precio: 3.00 },
    { id: 31, categoria: 'Bebidas', nombre: 'Té caliente', precio: 2.00 },
    { id: 32, categoria: 'Bebidas', nombre: 'Anís caliente', precio: 2.00 },
    { id: 33, categoria: 'Bebidas', nombre: 'Manzanilla caliente', precio: 2.00 },
    { id: 34, categoria: 'Bebidas', nombre: 'Café caliente', precio: 3.00 },

    // --- CRIOLLOS ---
    { id: 40, categoria: 'Criollos', nombre: 'Tallarín Saltado c/ carne', precio: 16.00 },
    { id: 41, categoria: 'Criollos', nombre: 'Tallarín Saltado c/ chancho', precio: 15.00 },
    { id: 42, categoria: 'Criollos', nombre: 'Chicharrón Clásico', precio: 14.00 },
    { id: 43, categoria: 'Criollos', nombre: 'Chicharrón a lo Monstruo', precio: 16.00 },
    { id: 44, categoria: 'Criollos', nombre: 'Lomo Saltado c/ arroz', precio: 14.00 },
    { id: 45, categoria: 'Criollos', nombre: 'Lomo Saltado c/ chaufa', precio: 15.00 },
    { id: 46, fontSize: '12px', categoria: 'Criollos', nombre: 'Lomo Montado', precio: 16.00 },
    { id: 47, categoria: 'Criollos', nombre: 'Lomo a lo Pobre', precio: 17.00 },
    { id: 48, categoria: 'Criollos', nombre: 'Pollo Saltado c/ arroz', precio: 13.00 },
    { id: 49, categoria: 'Criollos', nombre: 'Pollo Saltado c/ chaufa', precio: 14.00 },
    { id: 50, categoria: 'Criollos', nombre: 'Pollo Saltado a lo Pobre', precio: 16.00 },
    { id: 51, categoria: 'Criollos', nombre: 'Pollo a la Plancha a lo Pobre', precio: 19.00 },
    { id: 52, categoria: 'Criollos', nombre: 'Bistec a lo Pobre', precio: 15.00 },
    { id: 53, categoria: 'Criollos', nombre: 'Tallarín Verde + ¼ Pollo', precio: 16.00 },
    { id: 54, categoria: 'Criollos', nombre: 'Tallarín Verde c/ Bistec', precio: 15.00 },
    { id: 55, categoria: 'Criollos', nombre: 'Tallarín Verde c/ Pechuga', precio: 19.00 },
    { id: 56, categoria: 'Criollos', nombre: 'Tallarín Saltado c/ pollo', precio: 15.00 },
    { id: 57, categoria: 'Criollos', nombre: 'Caldo Gallina Presa Grande', precio: 12.00 },

    // --- CHIFA A LA CARTA ---
    { id: 60, categoria: 'Chifa', nombre: 'Frijolito con langostinos', precio: 15.00 },
    { id: 61, categoria: 'Chifa', nombre: 'Frijolito Especial', precio: 15.00 },
    { id: 62, categoria: 'Chifa', nombre: 'Limonkay', precio: 15.00 },
    { id: 63, categoria: 'Chifa', nombre: 'Pollo Chijaukay', precio: 15.00 },
    { id: 64, categoria: 'Chifa', nombre: 'Tipakay', precio: 15.00 },
    { id: 65, categoria: 'Chifa', nombre: 'Combinado de pollo', precio: 14.00 },
    { id: 66, categoria: 'Chifa', nombre: 'Combinado de carne', precio: 15.00 },
    { id: 67, categoria: 'Chifa', nombre: 'Combinado de chancho', precio: 17.00 },
    { id: 68, categoria: 'Chifa', nombre: 'Combinado de langostinos', precio: 15.00 },
    { id: 69, categoria: 'Chifa', nombre: 'Combinado Especial', precio: 20.00 },
    { id: 70, categoria: 'Chifa', nombre: 'Combinado c/ pollo en trozos', precio: 16.00 },
    { id: 71, categoria: 'Chifa', nombre: 'Pollo con verduras', precio: 16.00 },
    { id: 72, categoria: 'Chifa', nombre: 'Carne con verduras', precio: 14.00 },
    { id: 73, categoria: 'Chifa', nombre: 'Chancho con verduras', precio: 14.00 },
    { id: 74, categoria: 'Chifa', nombre: 'Langostinos con verduras', precio: 16.00 },
    { id: 75, categoria: 'Chifa', nombre: 'Verduras c/ pollo en trozos', precio: 16.00 },
    { id: 76, categoria: 'Chifa', nombre: 'Frijolito con pollo', precio: 11.00 },
    { id: 77, categoria: 'Chifa', nombre: 'Frijolito con carne', precio: 12.00 },
    { id: 78, categoria: 'Chifa', nombre: 'Frijolito con chancho', precio: 12.00 },
    { id: 80, categoria: 'Chifa', nombre: 'Aeropuerto c/ pollo trozos', precio: 14.00 },
    { id: 81, categoria: 'Chifa', nombre: 'Aeropuerto Salvaje pollo', precio: 14.00 },
    { id: 82, categoria: 'Chifa', nombre: 'Aeropuerto Salvaje carne', precio: 14.00 },
    { id: 83, categoria: 'Chifa', nombre: 'Aeropuerto Salvaje chancho', precio: 12.00 },
    { id: 84, categoria: 'Chifa', nombre: 'Tallarín de pollo', precio: 13.00 },
    { id: 85, categoria: 'Chifa', nombre: 'Tallarín de carne', precio: 14.00 },
    { id: 86, categoria: 'Chifa', nombre: 'Tallarín de chancho', precio: 16.00 },
    { id: 87, categoria: 'Chifa', nombre: 'Tallarín de langostinos', precio: 15.00 },
    { id: 88, categoria: 'Chifa', nombre: 'Tallarín Especial', precio: 20.00 },
    { id: 89, categoria: 'Chifa', nombre: 'Tallarín con pollo en trozos', precio: 14.00 },
    { id: 90, categoria: 'Chifa', nombre: 'Tortilla c/ pollo', precio: 14.00 },
    { id: 91, categoria: 'Chifa', nombre: 'Tortilla c/ carne', precio: 15.00 },
    { id: 92, categoria: 'Chifa', nombre: 'Tortilla c/ chancho', precio: 14.00 },
    { id: 93, categoria: 'Chifa', nombre: 'Tortilla c/ langostinos', precio: 16.00 },
    { id: 94, categoria: 'Chifa', nombre: 'Sopa Wantan c/ pollo', precio: 9.00 },
    { id: 95, categoria: 'Chifa', nombre: 'Sopa Wantan c/ chancho', precio: 11.00 },
    { id: 96, categoria: 'Chifa', nombre: 'Sopa Wantan c/ carne', precio: 11.00 },
    { id: 97, categoria: 'Chifa', nombre: 'Sopa Wantan c/ langostino', precio: 13.00 },
    { id: 98, categoria: 'Chifa', nombre: 'Sopa Wantan Especial', precio: 14.00 },
    { id: 99, categoria: 'Chifa', nombre: 'Sopa Fuchifu', precio: 12.00 },
    { id: 100, categoria: 'Chifa', nombre: 'Sopa de kion', precio: 10.00 },
    { id: 101, categoria: 'Chifa', nombre: 'Wantan Frito (Docena)', precio: 9.00 },
    { id: 102, categoria: 'Chifa', nombre: 'Wantan Frito (1/2 doc.)', precio: 6.00 },

    // --- PARRILLAS Y COMBOS ---
    { id: 110, categoria: 'Parrillas', nombre: 'OFERTA 1 (Chuleta+1/8Pollo)', precio: 30.00 },
    { id: 111, categoria: 'Parrillas', nombre: 'OFERTA 2 (Chuleta+Chorizo)', precio: 34.00 },
    { id: 112, categoria: 'Parrillas', nombre: 'OFERTA 3 (Churrasco+1/4Pollo)', precio: 31.00 },
    { id: 113, categoria: 'Parrillas', nombre: 'OFERTA 4 (Pechuga+Chuleta)', precio: 36.00 },
    { id: 114, categoria: 'Parrillas', nombre: 'OFERTA 5 (1/4Pollo+Mollejas)', precio: 33.00 },
    { id: 115, categoria: 'Parrillas', nombre: 'OFERTA 6 (Mollejas solas)', precio: 14.00 },
    { id: 116, categoria: 'Parrillas', nombre: 'Parrilla Dylan (Familiar)', precio: 45.00 },
    { id: 117, categoria: 'Parrillas', nombre: 'Parrilla Familiar Especial', precio: 68.00 },
    { id: 118, categoria: 'Parrillas', nombre: 'Pechuga Clásica Parrilla', precio: 17.00 },
    { id: 119, categoria: 'Parrillas', nombre: 'Pechuga Light (c/ ensalada)', precio: 14.00 },
    { id: 120, categoria: 'Parrillas', nombre: 'Pechuga al Orégano', precio: 17.00 },
    { id: 121, categoria: 'Parrillas', nombre: 'Pierna Deshuesada Parrilla', precio: 16.00 },
    { id: 122, categoria: 'Parrillas', nombre: 'Pechuga al Limón', precio: 17.00 },
    { id: 123, categoria: 'Parrillas', nombre: '1/4 Pollo + 2p Anticuchos', precio: 20.00 },
    { id: 124, categoria: 'Parrillas', nombre: '2 Brochetas de Pollo', precio: 20.00 },
    { id: 125, categoria: 'Parrillas', nombre: '3p Anticuchos de Corazón', precio: 20.00 },
    { id: 126, categoria: 'Parrillas', nombre: 'Churrasco a la Parrilla', precio: 17.00 },
    { id: 127, categoria: 'Parrillas', nombre: 'Churrasco a lo Pobre', precio: 19.00 },
    { id: 128, categoria: 'Parrillas', nombre: 'Chuleta a la Parrilla', precio: 16.00 },
    { id: 129, categoria: 'Parrillas', nombre: 'Chuleta a lo Pobre', precio: 18.00 },
    { id: 130, categoria: 'Parrillas', nombre: 'Bistec a la Parrilla', precio: 17.00 },
    { id: 131, categoria: 'Parrillas', nombre: 'Bistec a lo Pobre', precio: 20.00 },
    { id: 132, categoria: 'Parrillas', nombre: 'Chorizo Clásico', precio: 9.00 },
    { id: 133, categoria: 'Parrillas', nombre: 'Chorizo al Orégano', precio: 10.00 },
    { id: 134, categoria: 'Parrillas', nombre: 'Combo 1/4 Pollo + Chaufa', precio: 18.00 },
    { id: 135, categoria: 'Parrillas', nombre: 'Combito 1/8 Pollo + Chaufa', precio: 14.00 },
    { id: 136, categoria: 'Parrillas', nombre: 'Combo Chorizero 1/4 Pollo', precio: 19.00 },
    { id: 137, categoria: 'Parrillas', nombre: 'Mostro a lo Pobre 1/4', precio: 18.00 },
    { id: 138, categoria: 'Parrillas', nombre: 'Mostrito a lo Pobre 1/8', precio: 14.00 },
    { id: 139, categoria: 'Parrillas', nombre: 'Salchi Mostro', precio: 11.00 },
    { id: 140, categoria: 'Parrillas', nombre: 'Salchipapa Clásica', precio: 8.00 },
    { id: 141, categoria: 'Parrillas', merge: true, nombre: 'Salchipapa Montada', precio: 9.00 },
    { id: 142, categoria: 'Parrillas', nombre: 'Salchipapa a lo Pobre', precio: 10.00 },

    // --- GUARNICIONES ---
    { id: 150, categoria: 'Guarniciones', nombre: '1 Porción de Papas Fritas', precio: 14.00 },
    { id: 151, categoria: 'Guarniciones', nombre: '1/2 Porción Papas Fritas', precio: 7.00 },
    { id: 152, categoria: 'Guarniciones', nombre: '1 Porción Ensalada Mixta', precio: 6.00 },
    { id: 153, categoria: 'Guarniciones', nombre: '1/2 Porción Ensalada Mixta', precio: 3.00 },
    { id: 154, categoria: 'Guarniciones', nombre: '1 Porción Arroz Chaufa', precio: 5.00 },
    { id: 155, categoria: 'Guarniciones', nombre: '1 Porción Arroz Blanco', precio: 5.00 },
    { id: 156, categoria: 'Guarniciones', nombre: 'Porción de Plátano Frito', precio: 2.00 },
    { id: 157, categoria: 'Guarniciones', nombre: 'Porción de Huevo Frito', precio: 2.00 },
    { id: 158, categoria: 'Guarniciones', nombre: 'Porción de Hot Dog', precio: 2.00 }
  ];

  carrito: { [key: number]: number } = {};

  // 2. Inyectamos el Router en el constructor
  constructor(private router: Router) { }

  ngOnInit() { }

  get productosFiltrados() {
    return this.productosBase.filter(p => p.categoria === this.categoriaSeleccionada);
  }

  setCategoria(cat: string) {
    this.categoriaSeleccionada = cat;
  }

  setTipoEntrega(tipo: string) {
    this.pedido.tipoEntrega = tipo;
    // Limpieza automática si selecciona Recojo
    if (tipo === 'Recojo') {
      this.pedido.cliente.direccion = '';
    }
  }

  obtenerCantidad(producto: any): number {
    return this.carrito[producto.id] || 0;
  }

  aumentarCantidad(producto: any) {
    if (!this.carrito[producto.id]) {
      this.carrito[producto.id] = 0;
    }
    this.carrito[producto.id]++;
  }

  disminuirCantidad(producto: any) {
    if (this.carrito[producto.id] && this.carrito[producto.id] > 0) {
      this.carrito[producto.id]--;
    }
  }

  calcularTotal(): number {
    let total = 0;
    for (const id in this.carrito) {
      const prod = this.productosBase.find(p => p.id === +id);
      if (prod) {
        total += prod.precio * this.carrito[id];
      }
    }
    return total;
  }

  volver() {
    // Redirige al panel principal o menú anterior
    this.router.navigate(['/home']);
  }

  /**
   * Registra el pedido, añade metadatos obligatorios y gestiona la redirección automática
   */
  registrarPedido() {
    // Validaciones de seguridad indispensables
    if (!this.pedido.cliente.nombre || this.pedido.cliente.nombre.trim() === '') {
      alert('Por favor, ingresa el nombre del cliente.');
      return;
    }

    if (this.pedido.tipoEntrega === 'Delivery' && (!this.pedido.cliente.direccion || this.pedido.cliente.direccion.trim() === '')) {
      alert('Por favor, ingresa una dirección válida para el Delivery.');
      return;
    }

    // Estructuramos la data completa que se guardará en la sección de activos
    this.pedido.estado = 'Activo';
    this.pedido.total = this.calcularTotal();
    this.pedido.productosSeleccionados = this.carrito;
    this.pedido.fechaRegistro = new Date().toISOString();

    console.log('Pedido Registrado Listo para Activos:', this.pedido);

    // TODO: Aquí debes llamar a tu servicio local, Firebase o LocalStorage para guardar la orden.
    // Ejemplo: this.pedidosService.agregarPedido(this.pedido);

    // Redirección inmediata a la pantalla de pedidos activos.
    // NOTA: Asegúrate de reemplazar '/activos' por el path idéntico que tienes en tu 'app-routing.module.ts'
    this.router.navigate(['/activos']);
  }
}