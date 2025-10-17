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
  // Default → login
  { path: '', pathMatch: 'full', redirectTo: 'login' },

  // Auth
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // Admin (standalone)
  { path: 'admin', component: AdminDashboardComponent, canActivate: [adminGuard] },

  // App (explicit top-level routes; prevents child-route mounting issues)
  { path: 'app', pathMatch: 'full', redirectTo: 'app/dashboard' },
  { path: 'app/dashboard', component: DashboardComponent, canActivate: [adminRedirectGuard] },
  { path: 'app/transfer',  component: TransferComponent,  canActivate: [adminRedirectGuard] },
  { path: 'app/history',   component: HistoryComponent,   canActivate: [adminRedirectGuard] },
  { path: 'app/account',   component: AccountComponent,   canActivate: [adminRedirectGuard] }, // <-- important
  { path: 'app/security',  component: SecurityComponent,  canActivate: [adminRedirectGuard] },

  // Hard stop if someone types /app/admin
  { path: 'app/admin', redirectTo: '/admin', pathMatch: 'full' },

  // Fallback
  { path: '**', redirectTo: 'login' },
];
