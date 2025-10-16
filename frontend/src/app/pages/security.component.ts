import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';

@Component({
  standalone: true,
  selector: 'app-security',
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatSnackBarModule, MatProgressSpinnerModule],
  styles: [`
    .wrap { max-width: 1100px; margin: 1.6rem auto; padding: 0 1rem; }
    .card { background: var(--card-gradient); border:1px solid var(--border-color); border-radius: var(--border-radius); padding: 1.1rem; }
    .muted { color: var(--text-secondary); }
    .row { padding: .9rem; border:1px solid rgba(255,255,255,.06); border-radius: 12px; background: rgba(255,255,255,.02); margin:.6rem 0; }
    .status-dot{width:10px;height:10px;border-radius:50%}
    .status-dot.success{background:#3FB950;box-shadow:0 0 0 4px rgba(63,185,80,.12)}
    .status-dot.error{background:#F85149;box-shadow:0 0 0 4px rgba(248,81,73,.12)}
  `],
  template: `
    <div class="wrap">
      <mat-card class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.8rem">
          <div>
            <h2 style="margin:0">Security Settings</h2>
            <div class="muted">Manage your account security and device access</div>
          </div>
          <div class="status-dot success"></div>
        </div>

        <div class="row" [style.borderColor]="twoFactorEnabled ? 'rgba(63,185,80,.35)' : 'rgba(255,255,255,.06)'">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <div style="font-weight:600">Two-Factor Authentication</div>
              <div class="muted">{{twoFactorEnabled ? 'Enabled - Using Authenticator App' : 'Not enabled - Click to setup'}}</div>
            </div>
            <button mat-flat-button [color]="twoFactorEnabled ? 'accent' : 'primary'" (click)="toggleTwoFactor()" [disabled]="loading">
              <mat-spinner *ngIf="loading" mode="indeterminate" diameter="18"></mat-spinner>
              <span *ngIf="!loading">{{twoFactorEnabled ? 'Manage' : 'Enable'}}</span>
            </button>
          </div>
        </div>

        <div class="row">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <div style="font-weight:600">Change Password</div>
              <div class="muted">Last changed 30 days ago</div>
            </div>
            <button mat-flat-button color="primary" (click)="changePassword()">Update</button>
          </div>
        </div>

        <div class="row">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <div style="font-weight:600">Device Management</div>
              <div class="muted">2 active devices</div>
            </div>
            <button mat-flat-button color="primary" (click)="viewDevices()">View All</button>
          </div>
        </div>

        <div style="margin-top:1rem">
          <div style="font-weight:600;margin-bottom:.4rem">Recent Activity</div>
          <div class="row" *ngFor="let activity of recentActivity">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div>
                <div style="font-weight:500">{{activity.action}}</div>
                <div class="muted">{{activity.date}} • {{activity.location}}</div>
              </div>
              <div [class]="'status-dot ' + activity.status"></div>
            </div>
          </div>
        </div>
      </mat-card>
    </div>
  `
})
export class SecurityComponent {
  loading = false;
  twoFactorEnabled = false;
  recentActivity = [
    { action: 'Login from Chrome', date: 'Oct 16, 2025', location: 'New York, US', status: 'success' },
    { action: 'Password Changed', date: 'Sep 15, 2025', location: 'New York, US', status: 'success' },
    { action: 'Failed Login Attempt', date: 'Sep 10, 2025', location: 'Unknown Location', status: 'error' }
  ];

  constructor(private http: HttpClient, private snack: MatSnackBar) {
    this.http.get<any>('http://localhost:8080/api/me/security/2fa').subscribe({
      next: res => this.twoFactorEnabled = !!res?.enabled,
      error: _ => {/* optional; keep UI graceful if endpoint not implemented */}
    });
  }

  toggleTwoFactor() {
    this.loading = true;
    this.http.post<any>('http://localhost:8080/api/me/security/2fa/toggle', {}).subscribe({
      next: res => {
        this.loading = false;
        this.twoFactorEnabled = !!res?.enabled;
        this.snack.open(this.twoFactorEnabled ? '2FA enabled' : '2FA disabled', 'Close', {duration: 2000});
      },
      error: err => {
        this.loading = false;
        this.snack.open(err?.error?.message || 'Could not update 2FA', 'Close', {duration: 3000});
      }
    });
  }

  changePassword() { this.snack.open('Password change dialog opening…', 'Close', {duration: 2000}); }
  viewDevices()    { this.snack.open('Device management opening…', 'Close', {duration: 2000}); }
}
