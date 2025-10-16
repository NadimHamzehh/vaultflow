import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { ContactPanelComponent } from './components/contact-panel.component';

@Component({
  standalone: true,
  selector: 'app-user-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatSidenavModule, MatToolbarModule, MatListModule, MatIconModule, MatButtonModule, MatCardModule, ContactPanelComponent],
  template: `
    <mat-sidenav-container style="min-height:100vh">
      <mat-sidenav mode="side" opened style="width:260px;">
        <mat-card class="sidebar-card">
          <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.5rem">
            <div style="font-weight:700; font-size:1.05rem">VaultFlow</div>
            <div style="font-size:.8rem;color:var(--muted)">Secure Banking</div>
          </div>
          <div style="display:flex;gap:.5rem;align-items:center;margin-bottom:.75rem">
            <div style="width:44px;height:44px;border-radius:8px;background:linear-gradient(90deg,var(--accent),#7c3aed);display:flex;align-items:center;justify-content:center;font-weight:700;color:#001"></div>
            <div>
              <div style="font-weight:700">User</div>
              <div class="small muted">ACCT•••2002 • $12,540</div>
            </div>
          </div>
          <mat-nav-list>
            <a mat-list-item routerLink="/app" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}"><mat-icon>dashboard</mat-icon><span>Dashboard</span></a>
            <a mat-list-item routerLink="/app/transfer" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}"><mat-icon>send</mat-icon><span>Transfer</span></a>
            <a mat-list-item routerLink="/app/history" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}"><mat-icon>history</mat-icon><span>History</span></a>
            <a mat-list-item routerLink="/app/account" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}"><mat-icon>account_circle</mat-icon><span>Account</span></a>
          </mat-nav-list>
          <div class="sidebar-footer">
            <button mat-flat-button color="primary" style="width:100%" (click)="logout()">Logout</button>
          </div>
        </mat-card>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar color="primary">VaultFlow</mat-toolbar>

        <div style="max-width:1100px;margin:1rem auto;padding:0 1rem">
          <mat-card class="promo"><img src="/promo-banner.svg" alt="promo"></mat-card>
          <router-outlet></router-outlet>
        </div>
        <app-contact-panel></app-contact-panel>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `
})
export class UserShellComponent {
  logout(){
    localStorage.removeItem('token');
    location.href = '/login';
  }
}
