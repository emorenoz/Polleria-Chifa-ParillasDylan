export type EstadoPedido =
  | 'pendiente_cocina'
  | 'preparando'
  | 'listo'
  | 'entregado_mesa'
  | 'cuenta'
  | 'pagado'
  | 'anulado';

export interface ProductoPedido {
  id?: string;
  nombre: string;
  precio: number;
  cantidad: number;
  subtotal?: number;
}

export interface Pedido {
  id?: string;
  mesa: string;
  cliente?: {
    nombre?: string;
    apellido?: string;
  };
  productos: ProductoPedido[];
  total: number;
  comentario?: string;
  estado: EstadoPedido;
  mesero?: string;
  fecha?: any;
  fechaActualizacion?: any;
}