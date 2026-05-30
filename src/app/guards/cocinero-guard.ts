import { CanActivateFn } from '@angular/router';

export const cocineroGuard: CanActivateFn = (route, state) => {
  return true;
};
