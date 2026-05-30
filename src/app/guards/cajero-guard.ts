import { CanActivateFn } from '@angular/router';

export const cajeroGuard: CanActivateFn = (route, state) => {
  return true;
};
