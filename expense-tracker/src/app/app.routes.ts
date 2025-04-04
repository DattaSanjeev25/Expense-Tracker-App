import { Routes } from '@angular/router';
import { AuthComponent } from './components/auth/auth.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/auth', pathMatch: 'full' },
  { path: 'auth', component: AuthComponent },
  { 
    path: 'transactions', 
    loadComponent: () => import('./components/transaction/transaction.component').then(m => m.TransactionComponent),
    canActivate: [authGuard]
  }
];
