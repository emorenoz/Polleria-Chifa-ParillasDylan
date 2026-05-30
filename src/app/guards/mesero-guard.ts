import { CanActivateFn } from '@angular/router';

export const meseroGuard: CanActivateFn = (route, state) => {
  return true;
};
