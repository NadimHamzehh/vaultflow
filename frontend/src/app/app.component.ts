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
      <!-- ADMIN-ONLY LAYOUT (no sidebar, focused admin screen) -->
      <ng-container *ngIf="isAdminRoute(); else appLayout">
        <div class="app-shell">
          <header class="topbar">
            <div class="brand">
              <div class="logo">VF</div>
              <div class="brand-meta">
                <div class="title">VaultFlow — Admin</div>
                <div class="subtitle small">Operational Metrics</div>
              </div>
            </div>
            <div class="spacer"></div>
            <button class="logout" (click)="logout()">Logout</button>
          </header>

          <main class="content admin-only">
            <div class="container fade-in">
              <router-outlet></router-outlet>
            </div>
          </main>
        </div>
      </ng-container>

      <!-- STANDARD APP LAYOUT (sidebar + user pages) -->
      <ng-template #appLayout>
        <div class="app-shell">
          <header class="topbar">
            <button class="hamburger" (click)="toggleNav()" aria-label="Toggle navigation">
              <span></span><span></span><span></span>
            </button>

            <div class="brand">
              <div class="logo">VF</div>
              <div class="brand-meta">
                <div class="title">VaultFlow</div>
                <div class="subtitle small">Secure personal banking</div>
              </div>
            </div>

            <div class="spacer"></div>
            <button class="logout" (click)="logout()">Logout</button>
          </header>

          <div class="body">
            <aside class="sidebar" [class.open]="navOpen()">
              <nav class="nav">
                <a routerLink="/app" routerLinkActive="active" [routerLinkActiveOptions]="{ exact:true }">
                  <span class="dot"></span> Overview
                </a>
                <a routerLink="/app/transfer" routerLinkActive="active">
                  <span class="dot"></span> Transfer
                </a>
                <a routerLink="/app/history" routerLinkActive="active">
                  <span class="dot"></span> History
                </a>
                <a routerLink="/app/account" routerLinkActive="active">
                  <span class="dot"></span> Account
                </a>
                <a routerLink="/app/security" routerLinkActive="active">
                  <span class="dot"></span> Security
                </a>

                <div class="divider"></div>
                <!-- No admin link here on purpose -->
              </nav>

              <div class="sidebar-footer">
                <a routerLink="/login" class="link" (click)="logout()">Sign out</a>
              </div>
            </aside>

            <main class="content">
              <div class="container fade-in">
                <router-outlet></router-outlet>
              </div>
              <!-- Support widget only on user pages -->
              <app-support-widget *ngIf="!isAuthPage() && !isAdminRoute()"></app-support-widget>
            </main>
          </div>
        </div>
      </ng-template>
    </ng-template>
  `,
  styles: [`
    :host { display:block; min-height:100vh; color:var(--text); background:linear-gradient(180deg,var(--bg-01),var(--bg-02)); }

    /* Top bar */
    .topbar {
      position: sticky; top: 0; z-index: 50;
      display:flex; align-items:center; gap:.75rem;
      padding:.65rem 1rem;
      background: var(--bg-primary);
      border-bottom: 1px solid var(--border-color);
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

    /* Hamburger (mobile) */
    .hamburger {
      display:none; width:40px; height:34px; border:none; background:transparent; cursor:pointer;
      border-radius:8px; align-items:center; justify-content:center; gap:4px; flex-direction:column;
    }
    .hamburger span { display:block; width:20px; height:2px; background:#8b93a6; border-radius:2px; }

    /* Layout */
    .body { display:grid; grid-template-columns: 260px 1fr; min-height: calc(100vh - 56px); }
    .content { padding: 1rem; }
    .content.admin-only { padding: 1rem; }

    /* Sidebar */
    .sidebar {
      position: sticky; top:56px; height: calc(100vh - 56px);
      display:flex; flex-direction:column; justify-content:space-between;
      background: var(--bg-secondary);
      border-right: 1px solid var(--border-color);
      padding: .8rem .8rem;
    }
    .nav { display:flex; flex-direction:column; gap: .15rem; }
    .nav a {
      display:flex; align-items:center; gap:.55rem;
      padding:.55rem .6rem; border-radius:10px;
      color: var(--text); text-decoration:none;
      border: 1px solid transparent;
      transition: background .18s, transform .12s, border-color .18s;
    }
    .nav a:hover { background: rgba(255,255,255,.03); border-color: rgba(255,255,255,.06); transform: translateX(2px); }
    .nav a.active {
      background: linear-gradient(90deg, rgba(31,182,255,0.06), rgba(124,58,237,0.06));
      border-color: rgba(255,255,255,0.10);
      box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04);
    }
    .dot { width:8px; height:8px; border-radius:50%; background: var(--accent); box-shadow: 0 0 0 4px rgba(137,87,229,.12); }

    .divider { height:1px; margin:.4rem 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,.10), transparent); }
    .sidebar-footer { padding:.4rem .2rem; display:flex; }
    .sidebar-footer .link { color: var(--text-secondary); text-decoration:none; font-size:.95rem; }
    .sidebar-footer .link:hover { color: var(--text); }

    /* Responsive */
    @media (max-width: 980px) {
      .hamburger { display:flex; }
      .body { grid-template-columns: 1fr; }
      .sidebar {
        position: fixed; inset: 56px 0 0 auto; width: 260px; transform: translateX(-110%);
        border-left: 1px solid var(--border-color); border-right: none;
        transition: transform .22s ease;
      }
      .sidebar.open { transform: translateX(0); }
      .content, .content.admin-only { padding: .75rem; }
    }
  `]
})
export class AppComponent {
  navOpen = signal(false);
  private currentUrl = signal<string>('');

  constructor(private router: Router) {
    // initial
    this.currentUrl.set(this.router.url);

    // track route changes so layout switching + guards are correct
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        this.currentUrl.set(e.urlAfterRedirects || e.url || '');
        // close the drawer on navigation (mobile)
        this.navOpen.set(false);
        // guard: if someone opens /admin without ADMIN, bounce to /app
        if (this.isAdminRoute() && !this.isAdmin()) {
          this.router.navigate(['/app']);
        }
      });
  }

  toggleNav() { this.navOpen.update(v => !v); }

  /** Login & Register have no chrome */
  isAuthPage(): boolean {
    const url = this.currentUrl();
    return url.startsWith('/login') || url.startsWith('/register');
  }

  /** Admin area uses its own chrome (no sidebar) */
  isAdminRoute(): boolean {
    const url = this.currentUrl();
    return url.startsWith('/admin');
  }

  /** Decode roles safely */
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
