import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login';
import { LayoutComponent } from './layout/layout';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.Dashboard) },
      { path: 'lotes', loadComponent: () => import('./pages/lotes/lotes').then(m => m.Lotes) },
      { path: 'fermentacion', loadComponent: () => import('./pages/fermentacion/fermentacion').then(m => m.Fermentacion) },
      { path: 'secado', loadComponent: () => import('./pages/secado/secado').then(m => m.Secado) }

    ]
  },
  { path: '**', redirectTo: 'login' }
];
