import { Routes } from '@angular/router';

// Asegúrate de importar tu nuevo Layout aquí arriba
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';

export const routes: Routes = [

  // =========================
  // INICIO
  // =========================
  {
    path: '',
    redirectTo: 'select-role',
    pathMatch: 'full',
  },

  // =========================
  // AUTH / LOGIN
  // =========================
  {
    path: 'select-role',
    loadComponent: () => import('./pages/auth/select-role/select-role.page').then((m) => m.SelectRolePage),
  },
  {
    path: 'login-admin',
    loadComponent: () => import('./pages/auth/login-admin/login-admin.page').then((m) => m.LoginAdminPage),
  },
  {
    path: 'login-cajero',
    loadComponent: () => import('./pages/auth/login-cajero/login-cajero.page').then((m) => m.LoginCajeroPage),
  },

  // =========================
  // MÓDULO ADMINISTRADOR (Rutas Hijas del Layout)
  // =========================
  {
    path: 'admin',
    component: AdminLayoutComponent, // El Layout padre envuelve a sus hijos
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full', // Si entras a /admin, te lleva al dashboard
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/admin/dashboard/dashboard.page').then((m) => m.DashboardPage),
      },
      {
        path: 'pedidos',
        loadComponent: () => import('./pages/admin/pedidos/pedidos.page').then((m) => m.PedidosPage),
      },
      {
        path: 'productos',
        loadComponent: () => import('./pages/admin/productos/productos.page').then((m) => m.ProductosPage),
      },
      {
        path: 'categorias',
        loadComponent: () => import('./pages/admin/categorias/categorias.page').then((m) => m.CategoriasPage),
      },
      {
        path: 'mesas',
        loadComponent: () => import('./pages/admin/mesas/mesas.page').then((m) => m.MesasPage),
      },
      {
        path: 'stock',
        loadComponent: () => import('./pages/admin/stock/stock.page').then((m) => m.StockPage),
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./pages/admin/usuarios/usuarios.page').then((m) => m.UsuariosPage),
      },
      {
        path: 'reportes',
        loadComponent: () => import('./pages/admin/reportes/reportes.page').then((m) => m.ReportesPage),
      },
      {
        path: 'configuracion',
        loadComponent: () => import('./pages/admin/configuracion/configuracion.page').then((m) => m.ConfiguracionPage),
      },
      {
        path: 'ventas',
        loadComponent: () => import('./pages/admin/ventas/ventas.page').then((m) => m.VentasPage),
      },
      {
        path: 'caja',
        loadComponent: () => import('./pages/admin/caja/caja.page').then((m) => m.CajaPage),
      },
      {
        path: 'clientes',
        loadComponent: () => import('./pages/admin/clientes/clientes.page').then((m) => m.ClientesPage),
      },
    ]
  },

  // =========================
  // OTROS DASHBOARDS E INDEPENDIENTES
  // =========================
  {
    path: 'cajero-dashboard',
    loadComponent: () => import('./pages/cajero/dashboard/dashboard.page').then((m) => m.DashboardPage),
  },
  {
    path: 'mesero-dashboard',
    loadComponent: () => import('./pages/mesero/dashboard/dashboard.page').then((m) => m.DashboardPage),
  },
  {
    path: 'cocina-dashboard',
    loadComponent: () => import('./pages/cocina/dashboard/dashboard.page').then((m) => m.DashboardPage),
  },

  // =========================
  // ACCIONES DEL MESERO
  // =========================
  {
    path: 'nuevo-pedido',
    loadComponent: () => import('./pages/mesero/nuevo-pedido/nuevo-pedido.page').then((m) => m.NuevoPedidoPage),
  },

];