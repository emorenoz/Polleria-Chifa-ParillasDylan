import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private usuarioActual = new BehaviorSubject<any>(null);

  constructor() {}

  // 🔑 LOGIN (usuario: jesus / clave: 010703)
  login(usuario: string, password: string) {

    if (usuario === 'jesus' && password === '010703') {

      const user = {
        id: 1,
        nombre: 'Jesus',
        rol: 'admin'
      };

      this.usuarioActual.next(user);
      return true;
    }

    return false;
  }

  // 🚪 LOGOUT
  logout() {
    this.usuarioActual.next(null);
  }

  // 👤 USUARIO ACTUAL
  getUser() {
    return this.usuarioActual.asObservable();
  }

  // 🔎 ESTADO LOGIN
  isLoggedIn() {
    return this.usuarioActual.value !== null;
  }
}