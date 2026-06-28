export type EstadoMesa = 'libre' | 'activa' | 'listo' | 'cuenta' | 'pagado';

export interface Mesa {
  id?: string;
  numero: string;
  estado: EstadoMesa;
  pedidoId?: string;
  total?: number;
  mesero?: string;
  fechaActualizacion?: any;
}