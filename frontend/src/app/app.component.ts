// src/app/app.component.ts
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header class="topbar">
      <nav>
        <a routerLink="/login" routerLinkActive="active">Login</a>
        <a routerLink="/register" routerLinkActive="active">Register</a>
        <a routerLink="/transfer" routerLinkActive="active">Transfer</a>
        <a routerLink="/history" routerLinkActive="active">History</a>
        <a routerLink="/admin" routerLinkActive="active">Admin</a>
      </nav>
    </header>

    <main class="view">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    :host{display:block;background:#0f172a;color:#e2e8f0;min-height:100vh;font-family:Inter,system-ui,Segoe UI,Roboto,Arial,sans-serif}
    .topbar{position:sticky;top:0;background:#111827;border-bottom:1px solid #1f2937;padding:.75rem 1rem}
    nav{display:flex;gap:1rem;align-items:center}
    a{color:#cbd5e1;text-decoration:none;padding:.25rem .5rem;border-radius:.5rem}
    a.active, a:hover{background:#1f2937;color:#fff}
    .view{padding:1.25rem}
  `]
})
export class AppComponent {}
