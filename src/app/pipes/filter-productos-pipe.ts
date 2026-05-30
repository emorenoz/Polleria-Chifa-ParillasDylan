import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterProductos'
})
export class FilterProductosPipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }

}
