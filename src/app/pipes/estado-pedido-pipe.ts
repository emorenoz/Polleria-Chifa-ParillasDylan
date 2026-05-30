import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'estadoPedido'
})
export class EstadoPedidoPipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }

}
