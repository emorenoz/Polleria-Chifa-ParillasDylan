import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'metodoPago'
})
export class MetodoPagoPipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }

}
