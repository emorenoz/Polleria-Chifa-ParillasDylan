import { Routes } from '@angular/router';

import {
  AdminLayoutComponent
} from './layout/admin-layout/admin-layout.component';

import {
  CajeroLayoutComponent
} from './layout/cajero-layout/cajero-layout.component';

export const routes: Routes = [

  // =====================================================
  // INICIO
  // =====================================================

  {
    path: '',
    redirectTo: 'select-role',
    pathMatch: 'full'
  },

  // =====================================================
  // ACCESO / AUTENTICACIÓN
  // =====================================================

  {
    path: 'select-role',
    loadComponent: () =>
      import(
        './pages/auth/select-role/select-role.page'
      ).then(
        m => m.SelectRolePage
      )
  },

  {
    path: 'login-admin',
    loadComponent: () =>
      import(
        './pages/auth/login-admin/login-admin.page'
      ).then(
        m => m.LoginAdminPage
      )
  },

  {
    path: 'login-cajero',
    loadComponent: () =>
      import(
        './pages/auth/login-cajero/login-cajero.page'
      ).then(
        m => m.LoginCajeroPage
      )
  },

  {
    path: 'seleccionar-mesero',
    loadComponent: () =>
      import(
        './pages/auth/seleccionar-mesero/seleccionar-mesero.page'
      ).then(
        m => m.SeleccionarMeseroPage
      )
  },

  {
    path: 'seleccionar-cocina',
    loadComponent: () =>
      import(
        './pages/auth/seleccionar-cocina/seleccionar-cocina.page'
      ).then(
        m => m.SeleccionarCocinaPage
      )
  },

  // =====================================================
  // MÓDULO ADMINISTRADOR
  // =====================================================

  {
    path: 'admin',
    component: AdminLayoutComponent,

    children: [

      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },

      {
        path: 'dashboard',
        loadComponent: () =>
          import(
            './pages/admin/dashboard/dashboard.page'
          ).then(
            m => m.DashboardPage
          )
      },

      {
        path: 'pedidos',
        loadComponent: () =>
          import(
            './pages/admin/pedidos/pedidos.page'
          ).then(
            m => m.PedidosPage
          )
      },

      {
        path: 'productos',
        loadComponent: () =>
          import(
            './pages/admin/productos/productos.page'
          ).then(
            m => m.ProductosPage
          )
      },

      {
        path: 'categorias',
        loadComponent: () =>
          import(
            './pages/admin/categorias/categorias.page'
          ).then(
            m => m.CategoriasPage
          )
      },

      {
        path: 'mesas',
        loadComponent: () =>
          import(
            './pages/admin/mesas/mesas.page'
          ).then(
            m => m.MesasPage
          )
      },

      {
        path: 'stock',
        loadComponent: () =>
          import(
            './pages/admin/stock/stock.page'
          ).then(
            m => m.StockPage
          )
      },

      {
        path: 'usuarios',
        loadComponent: () =>
          import(
            './pages/admin/usuarios/usuarios.page'
          ).then(
            m => m.UsuariosPage
          )
      },

      {
        path: 'reportes',
        loadComponent: () =>
          import(
            './pages/admin/reportes/reportes.page'
          ).then(
            m => m.ReportesPage
          )
      },

      {
        path: 'configuracion',
        loadComponent: () =>
          import(
            './pages/admin/configuracion/configuracion.page'
          ).then(
            m => m.ConfiguracionPage
          )
      },

      {
        path: 'ventas',
        loadComponent: () =>
          import(
            './pages/admin/ventas/ventas.page'
          ).then(
            m => m.VentasPage
          )
      },

      {
        path: 'caja',
        loadComponent: () =>
          import(
            './pages/admin/caja/caja.page'
          ).then(
            m => m.CajaPage
          )
      },

      {
        path: 'clientes',
        loadComponent: () =>
          import(
            './pages/admin/clientes/clientes.page'
          ).then(
            m => m.ClientesPage
          )
      }

    ]
  },

  // =====================================================
  // MÓDULO CAJERO
  // =====================================================

  {
    path: 'cajero',
    component: CajeroLayoutComponent,

    children: [

      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },

      {
        path: 'dashboard',
        loadComponent: () =>
          import(
            './pages/cajero/dashboard/dashboard.page'
          ).then(
            m => m.DashboardPage
          )
      },

      {
        path: 'comprobantes',
        loadComponent: () =>
          import(
            './pages/cajero/comprobantes/comprobantes.page'
          ).then(
            m => m.ComprobantesPage
          )
      },

      {
        path: 'historial',
        loadComponent: () =>
          import(
            './pages/cajero/historial/historial.page'
          ).then(
            m => m.HistorialPage
          )
      }

    ]
  },

  // =====================================================
  // COMPATIBILIDAD CON RUTAS ANTIGUAS DEL CAJERO
  // =====================================================

  {
    path: 'cajero-dashboard',
    redirectTo: 'cajero/dashboard',
    pathMatch: 'full'
  },

  {
    path: 'cajero-comprobantes',
    redirectTo: 'cajero/comprobantes',
    pathMatch: 'full'
  },

  {
    path: 'cajero-historial',
    redirectTo: 'cajero/historial',
    pathMatch: 'full'
  },

  // =====================================================
  // COMPATIBILIDAD CON RUTAS SIMPLES ANTIGUAS
  // =====================================================

  {
    path: 'comprobantes',
    redirectTo: 'cajero/comprobantes',
    pathMatch: 'full'
  },

  {
    path: 'historial',
    redirectTo: 'cajero/historial',
    pathMatch: 'full'
  },

  // =====================================================
  // MÓDULO MESERO
  // =====================================================

  {
    path: 'mesero-dashboard',
    loadComponent: () =>
      import(
        './pages/mesero/dashboard/dashboard.page'
      ).then(
        m => m.DashboardPage
      )
  },

  // =====================================================
  // MÓDULO COCINA
  // =====================================================

  {
    path: 'cocina-dashboard',
    loadComponent: () =>
      import(
        './pages/cocina/dashboard/dashboard.page'
      ).then(
        m => m.DashboardPage
      )
  },

  // =====================================================
  // RUTA NO ENCONTRADA
  // SIEMPRE DEBE IR AL FINAL
  // =====================================================

  {
    path: '**',
    redirectTo: 'select-role'
  }

];