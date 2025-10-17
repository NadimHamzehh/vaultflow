// src/app/app.routes.ts
import { Routes } from '@angular/router';

// Auth
import { LoginComponent } from './pages/login.component';
import { RegisterComponent } from './pages/register.component';

// User app pages
import { DashboardComponent } from './pages/dashboard.component';
import { TransferComponent } from './pages/transfer.component';
import { HistoryComponent } from './pages/history.component';
import { AccountComponent } from './pages/account.component';
import { SecurityComponent } from './pages/security.component';

// Admin page (standalone)
import { AdminDashboardComponent } from './pages/admin-dashboard.component';

// Guards (functional CanActivate)
import { adminGuard } from './guards/admin.guard';
import { adminRedirectGuard } from './guards/admin-redirect.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },

  // Auth
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // Admin (no sidebar layout in app.component)
  { path: 'admin', component: AdminDashboardComponent, canActivate: [adminGuard] },

  // Regular app (admins get bounced to /admin)
  {
    path: 'app',
    canActivate: [adminRedirectGuard],
    children: [
      { path: '', pathMatch: 'full', component: DashboardComponent },
      { path: 'transfer', component: TransferComponent },
      { path: 'history', component: HistoryComponent },
      { path: 'account', component: AccountComponent },
      { path: 'security', component: SecurityComponent },
      { path: 'admin', redirectTo: '/admin', pathMatch: 'full' }, // hard stop if someone typed /app/admin
    ],
  },

  // Fallback
  { path: '**', redirectTo: 'login' },
];
