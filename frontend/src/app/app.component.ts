// src/app/app.component.ts
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SupportWidgetComponent } from './components/support-widget.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, SupportWidgetComponent],
  template: `
    <!-- AUTH LAYOUT (no nav) -->
    <ng-container *ngIf="isAuthPage(); else nonAuth">
      <router-outlet></router-outlet>
    </ng-container>

    <ng-template #nonAuth>
      <!-- ADMIN-ONLY LAYOUT (no horizontal nav) -->
      <ng-container *ngIf="isAdminRoute(); else appLayout">
        <div class="app-shell">
          <header class="topbar">
            <div class="topbar-main">
              <div class="brand">
                <div class="logo">VF</div>
                <div class="brand-meta">
                  <div class="title">VaultFlow — Admin</div>
                  <div class="subtitle small">Operational Metrics</div>
                </div>
              </div>
              <div class="spacer"></div>
              <button class="logout" (click)="logout()">Logout</button>
            </div>
          </header>

          <main class="content admin-only">
            <div class="container fade-in">
              <router-outlet></router-outlet>
            </div>
          </main>
        </div>
      </ng-container>

      <!-- STANDARD APP LAYOUT -->
      <ng-template #appLayout>
        <div class="app-shell">
          <header class="topbar">
            <div class="topbar-main">
              <div class="brand">
                <div class="logo">VF</div>
                <div class="brand-meta">
                  <div class="title">VaultFlow</div>
                  <div class="subtitle small">Secure personal banking</div>
                </div>
              </div>

              <div class="spacer"></div>
              <button class="logout" (click)="logout()">Logout</button>
            </div>

            <!-- Seamless horizontal nav: part of the header -->
            <nav class="topnav" aria-label="Primary">
              <a class="nav-btn"
                 routerLink="/app"
                 routerLinkActive="active"
                 [routerLinkActiveOptions]="{ exact: true }">Overview</a>
              <a class="nav-btn" routerLink="/app/transfer" routerLinkActive="active">Transfer</a>
              <a class="nav-btn" routerLink="/app/history" routerLinkActive="active">History</a>
              <a class="nav-btn" routerLink="/app/account" routerLinkActive="active">Account</a>
              <a class="nav-btn" routerLink="/app/security" routerLinkActive="active">Security</a>
            </nav>
          </header>

          <main class="content">
            <div class="container fade-in">
              <router-outlet></router-outlet>
            </div>
            <app-support-widget *ngIf="!isAuthPage() && !isAdminRoute()"></app-support-widget>
          </main>
        </div>
      </ng-template>
    </ng-template>
  `,
  styles: [`
    :host { display:block; min-height:100vh; color:var(--text); background:linear-gradient(180deg,var(--bg-01),var(--bg-02)); }

    /* Header becomes two rows: brand row + nav row */
    .topbar {
      position: sticky; top: 0; z-index: 50;
      display:flex; flex-direction:column; align-items:stretch; gap:0;
      background: var(--bg-primary);
      border-bottom: 1px solid var(--border-color);
    }
    .topbar-main {
      display:flex; align-items:center; gap:.75rem;
      padding:.65rem 1rem;
    }

    .brand { display:flex; align-items:center; gap:.6rem; }
    .logo {
      width: 34px; height: 34px; border-radius: 10px;
      display:grid; place-items:center; font-weight:800;
      background: var(--premium-gradient); color:#0b1020;
      box-shadow: 0 8px 26px rgba(137,87,229,.25);
    }
    .title { font-weight: 700; letter-spacing:.2px; }
    .subtitle { color:var(--text-secondary); }
    .spacer { flex:1; }
    .logout {
      background: transparent; border: 1px solid var(--border-color);
      color: var(--text); padding:.45rem .8rem; border-radius:10px; cursor:pointer;
      transition: background .2s, border-color .2s, transform .15s;
    }
    .logout:hover { background: rgba(255,255,255,.03); border-color: rgba(255,255,255,.16); transform: translateY(-1px); }

    /* Seamless horizontal nav (no card look) */
    .topnav {
      display: flex; gap: 8px;
      padding: 8px 10px;
      margin: 0;                          /* no outside gap */
      border-top: 1px solid var(--border-color);  /* gentle divider from brand row */
      background: transparent;             /* same bg as header */
      border-radius: 0;                    /* no rounding */
      box-shadow: none;                    /* no card shadow */
      overflow-x: auto; -webkit-overflow-scrolling: touch;
      white-space: nowrap; scrollbar-width: thin;
    }
    .topnav .nav-btn {
      display: inline-block;
      padding: 10px 14px;
      border-radius: 10px;
      text-decoration: none;
      font-weight: 600;
      color: var(--text);
      background: transparent;
      border: 1px solid rgba(255,255,255,0.06);
      transition: background .18s, border-color .18s, transform .06s;
      outline: none;
    }
    .topnav .nav-btn:hover { background: rgba(255,255,255,0.05); }
    .topnav .nav-btn:active { transform: translateY(1px); }
    .topnav .nav-btn:focus-visible {
      box-shadow: 0 0 0 3px rgba(137,87,229,0.35);
      border-color: rgba(137,87,229,0.8);
    }
    .topnav .nav-btn.active {
      background: linear-gradient(90deg, rgba(31,182,255,0.06), rgba(124,58,237,0.06));
      border-color: rgba(255,255,255,0.14);
      box-shadow: inset 0 0 0 1px rgba(255,255,255,0.05);
    }

    /* Content area */
    .content { padding: 1rem; }
    .content.admin-only { padding: 1rem; }

    @media (max-width: 980px) {
      .content, .content.admin-only { padding: .75rem; }
    }
  `]
})
export class AppComponent {
  private currentUrl = signal<string>('');

  constructor(private router: Router) {
    this.currentUrl.set(this.router.url);
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        this.currentUrl.set(e.urlAfterRedirects || e.url || '');
        if (this.isAdminRoute() && !this.isAdmin()) {
          this.router.navigate(['/app']);
        }
      });
  }

  isAuthPage(): boolean {
    const url = this.currentUrl();
    return url.startsWith('/login') || url.startsWith('/register');
  }

  isAdminRoute(): boolean {
    const url = this.currentUrl();
    return url.startsWith('/admin');
  }

  isAdmin(): boolean {
    const token = localStorage.getItem('token');
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1] || ''));
      const roles = Array.isArray(payload?.roles)
        ? payload.roles
        : String(payload?.roles || '').split(',').map((s: string) => s.trim().toUpperCase());
      return roles.includes('ADMIN');
    } catch {
      return false;
    }
  }

  logout() {
    try { localStorage.removeItem('token'); } catch {}
    this.router.navigate(['/login']);
  }
}
