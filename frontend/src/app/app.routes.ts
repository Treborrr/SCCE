import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login';
import { LayoutComponent } from './layout/layout';

export const routes: Routes = [
  { path: '', pathMatch: 'full', component: LoginComponent },
  { path: 'login', component: LoginComponent },

  // Ruta PÚBLICA para catadores (sin layout/auth)
  {
    path: 'cata/:token',
    loadComponent: () => import('./pages/cata-form/cata-form').then(m => m.CataForm)
  },

  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.Dashboard) },
      { path: 'lotes', loadComponent: () => import('./pages/lotes/lotes').then(m => m.Lotes) },
      { path: 'fermentacion', loadComponent: () => import('./pages/fermentacion/fermentacion').then(m => m.Fermentacion) },
      { path: 'secado', loadComponent: () => import('./pages/secado/secado').then(m => m.Secado) },
      { path: 'almacen', loadComponent: () => import('./pages/almacen/almacen').then(m => m.Almacen) },
      { path: 'muestras', loadComponent: () => import('./pages/muestras/muestras').then(m => m.Muestras) },
      { path: 'derivados', loadComponent: () => import('./pages/derivados/derivados').then(m => m.Derivados) }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
