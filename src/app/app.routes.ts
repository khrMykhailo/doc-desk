import { Routes } from '@angular/router';
import { MainTableComponent } from './components/main-table/main-table.component';
import { authGuard } from './auth/guards/auth.guard';
import { documentResolver } from './shared/resolvers/document.resolver';

export const routes: Routes = [
  { 
    path: '', 
    component: MainTableComponent,
    canActivate: [authGuard],
    resolve: { documents: documentResolver }
  },
  { 
    path: 'login', 
    loadComponent: () => import('./auth/components/login/login.component').then(c => c.LoginComponent)
  },
  { 
    path: 'register', 
    loadComponent: () => import('./auth/components/register/register.component').then(c => c.RegisterComponent)
  }
];
