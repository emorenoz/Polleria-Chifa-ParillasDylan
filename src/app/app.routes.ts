import { Routes } from '@angular/router';

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
  // SELECT ROLE
  // =========================

  {
    path: 'select-role',
    loadComponent: () =>
      import('./pages/auth/select-role/select-role.page').then(
        (m) => m.SelectRolePage
      ),
  },

  // =========================
  // LOGIN ADMIN
  // =========================

  {
    path: 'login-admin',
    loadComponent: () =>
      import('./pages/auth/login-admin/login-admin.page').then(
        (m) => m.LoginAdminPage
      ),
  },

  // LOGIN CAJERO

  {
    path: 'login-cajero',
    loadComponent: () =>
      import('./pages/auth/login-cajero/login-cajero.page').then(
        (m) => m.LoginCajeroPage
      ),
  },

  // LOGIN MESERO

  {
    path: 'login-mesero',
    loadComponent: () =>
      import('./pages/auth/login-mesero/login-mesero.page').then(
        (m) => m.LoginMeseroPage
      ),
  },

  // LOGIN COCINA

  {
    path: 'login-cocina',
    loadComponent: () =>
      import('./pages/auth/login-cocina/login-cocina.page').then(
        (m) => m.LoginCocinaPage
      ),
  },

  // =========================
  // DASHBOARDS
  // =========================

  {
    path: 'admin-dashboard',
    loadComponent: () =>
      import('./pages/admin/dashboard/dashboard.page').then(
        (m) => m.DashboardPage
      ),
  },

  {
    path: 'cajero-dashboard',
    loadComponent: () =>
      import('./pages/cajero/dashboard/dashboard.page').then(
        (m) => m.DashboardPage
      ),
  },

  {
    path: 'mesero-dashboard',
    loadComponent: () =>
      import('./pages/mesero/dashboard/dashboard.page').then(
        (m) => m.DashboardPage
      ),
  },

  {
    path: 'cocina-dashboard',
    loadComponent: () =>
      import('./pages/cocina/dashboard/dashboard.page').then(
        (m) => m.DashboardPage
      ),
  },

  {
  path: 'productos',
  loadComponent: () =>
    import('./pages/admin/productos/productos.page').then(
      (m) => m.ProductosPage
    ),
},

{
  path: 'categorias',
  loadComponent: () =>
    import('./pages/admin/categorias/categorias.page').then(
      (m) => m.CategoriasPage
    ),
},

{
  path: 'pedidos',
  loadComponent: () =>
    import('./pages/admin/pedidos/pedidos.page').then(
      (m) => m.PedidosPage
    ),
},

{
  path: 'mesas',
  loadComponent: () =>
    import('./pages/admin/mesas/mesas.page').then(
      (m) => m.MesasPage
    ),
},

{
  path: 'stock',
  loadComponent: () =>
    import('./pages/admin/stock/stock.page').then(
      (m) => m.StockPage
    ),
},

{
  path: 'usuarios',
  loadComponent: () =>
    import('./pages/admin/usuarios/usuarios.page').then(
      (m) => m.UsuariosPage
    ),
},

{
  path: 'reportes',
  loadComponent: () =>
    import('./pages/admin/reportes/reportes.page').then(
      (m) => m.ReportesPage
    ),
},

{
  path: 'configuracion',
  loadComponent: () =>
    import('./pages/admin/configuracion/configuracion.page').then(
      (m) => m.ConfiguracionPage
    ),
},

{
  path: 'ventas',
  loadComponent: () =>
    import('./pages/admin/ventas/ventas.page').then(
      (m) => m.VentasPage
    ),
},

{
  path: 'caja',
  loadComponent: () =>
    import('./pages/admin/caja/caja.page').then(
      (m) => m.CajaPage
    ),
},

{
  path: 'clientes',
  loadComponent: () =>
    import('./pages/admin/clientes/clientes.page').then(
      (m) => m.ClientesPage
    ),
},
// =========================
// ACCIONES DEL MESERO
// =========================
{
  path: 'nuevo-pedido',
  loadComponent: () =>
    import('./pages/mesero/nuevo-pedido/nuevo-pedido.page').then(
      (m) => m.NuevoPedidoPage
    ),
},

];