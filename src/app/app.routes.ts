import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'tabs',
    loadComponent: () => import('./pages/tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      {
        path: '',
        redirectTo: 'inicio',
        pathMatch: 'full',
      },
      {
        path: 'inicio',
        loadComponent: () => import('./pages/inicio/inicio.page').then((m) => m.InicioPage),
      },
      {
        path: 'pedido',
        loadComponent: () => import('./pages/pedido/pedido.page').then((m) => m.PedidoPage),
      },
      {
        path: 'activos',
        loadComponent: () => import('./pages/activos/activos.page').then((m) => m.ActivosPage),
      },
      {
        path: 'ventas',
        loadComponent: () => import('./pages/ventas/ventas.page').then((m) => m.VentasPage),
      },
      {
        path: 'config',
        loadComponent: () => import('./pages/config/config.page').then((m) => m.ConfigPage),
      },
    ],
  }
];