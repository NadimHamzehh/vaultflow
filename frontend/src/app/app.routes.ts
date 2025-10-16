import { Routes } from '@angular/router';

import { DashboardComponent } from './pages/dashboard.component';
import { TransferComponent } from './pages/transfer.component';
import { HistoryComponent } from './pages/history.component';
import { AccountComponent } from './pages/account.component';
import { SecurityComponent } from './pages/security.component';
import { LoginComponent } from './pages/login.component';
import { RegisterComponent } from './pages/register.component';
import { AdminDashboardComponent } from './pages/admin-dashboard.component';
import { AdminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, title: 'Login' },
  { path: 'register', component: RegisterComponent, title: 'Register' },

  {
    path: 'app',
    children: [
      { path: '', component: DashboardComponent, title: 'Overview' },
      { path: 'transfer', component: TransferComponent, title: 'Transfer' },
      { path: 'history', component: HistoryComponent, title: 'History' },
      { path: 'account', component: AccountComponent, title: 'Account' },
      { path: 'security', component: SecurityComponent, title: 'Security' },

      // SINGLE admin page, guarded
      { path: 'admin', component: AdminDashboardComponent, canActivate: [AdminGuard], title: 'Admin' },
    ],
  },

  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: '**', redirectTo: 'login' },
];
