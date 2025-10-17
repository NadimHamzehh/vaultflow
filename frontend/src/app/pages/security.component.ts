import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  standalone: true,
  selector: 'app-security',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatSnackBarModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule
  ],
  styles: [`
    :host { display:block; }
    .wrap { max-width: 920px; margin: 0 auto; display: grid; gap: 16px; }

    .card {
      background: var(--card-gradient);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      box-shadow: 0 18px 60px rgba(0,0,0,.45);
      position: relative; overflow: hidden;
    }
    .card::before{
      content:''; position:absolute; inset:0;
      background: var(--premium-gradient); opacity:.06;
      pointer-events:none; -webkit-mask: linear-gradient(135deg, #000, transparent);
              mask: linear-gradient(135deg, #000, transparent);
    }
    .inner { padding: clamp(16px, 2.2vw, 24px); }

    .row { display:grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media (max-width: 860px){ .row { grid-template-columns: 1fr; } }

    .qr { display:flex; align-items:center; justify-content:center; padding:12px; border-radius:12px;
          background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.06); }
    .hint { color: var(--text-secondary); }

    .btn {
      display:inline-flex; align-items:center; gap:.45rem;
      padding:.6rem .9rem; border:none; border-radius: var(--border-radius);
      background: var(--accent-gradient); color:#fff; cursor:pointer;
      transition: transform .18s, box-shadow .18s, filter .18s;
    }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 12px 36px rgba(137,87,229,.18); }
    .btn.secondary { background: transparent; border: 1px solid var(--border-color); color: var(--text); }
  `],
  template: `
    <div class="wrap">
      <!-- Account Security -->
      <mat-card class="card">
        <div class="inner">
          <h2>Account security</h2>
          <p class="hint">Manage two-factor authentication (TOTP) for your account.</p>

          <div *ngIf="!enabled()">
            <p>Two-factor authentication is <strong>disabled</strong>.</p>
            <button class="btn" (click)="startEnroll()" [disabled]="busy()">Enable 2FA</button>
          </div>

          <div *ngIf="enabled()">
            <p>Two-factor authentication is <strong>enabled</strong>.</p>
            <button class="btn secondary" (click)="disable()" [disabled]="busy()">Disable 2FA</button>
          </div>
        </div>
      </mat-card>

      <!-- Enrollment (QR + verify form) -->
      <mat-card class="card" *ngIf="enrolling()">
        <div class="inner">
          <h3>Finish setup</h3>
          <div class="row">
            <div class="qr">
              <img *ngIf="qr()" [src]="qr()" alt="Scan in Google Authenticator" style="max-width:260px; width:100%; border-radius:10px" />
            </div>

            <form [formGroup]="verifyForm" (ngSubmit)="verify()">
              <p class="hint">Scan the QR with Google Authenticator / Authy, then enter the 6-digit code.</p>
              <mat-form-field appearance="fill" style="width:100%">
                <mat-label>6-digit code</mat-label>
                <input matInput formControlName="code" placeholder="123 456" inputmode="numeric" autocomplete="one-time-code">
              </mat-form-field>

              <div style="display:flex; gap:10px; align-items:center">
                <button class="btn" type="submit" [disabled]="verifyForm.invalid || busy()">Verify & enable</button>
                <button class="btn secondary" type="button" (click)="cancelEnroll()" [disabled]="busy()">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      </mat-card>
    </div>
  `
})
export class SecurityComponent implements OnInit {
  private readonly base = 'http://localhost:8080/api/2fa';

  enabled   = signal(false);
  enrolling = signal(false);
  busy      = signal(false);
  qr        = signal<string | null>(null);

  verifyForm!: FormGroup;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private snack: MatSnackBar
  ) {
    // Initialize form in constructor so DI is ready
    this.verifyForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });
  }

  ngOnInit(): void { this.refreshStatus(); }

  private authHeaders(): HttpHeaders {
    const t = localStorage.getItem('token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${t}` });
  }

  refreshStatus() {
    this.http.get<{enabled:boolean}>(`${this.base}/status`, { headers: this.authHeaders() })
      .subscribe({
        next: r => this.enabled.set(!!r.enabled),
        error: _ => this.enabled.set(false)
      });
  }

  startEnroll() {
    this.busy.set(true);
    this.http.post<{secret:string; qrDataUri:string}>(`${this.base}/enroll`, {}, { headers: this.authHeaders() })
      .subscribe({
        next: r => {
          this.busy.set(false);
          this.qr.set(r.qrDataUri);
          this.enrolling.set(true);
          this.snack.open('Scan the QR code with your authenticator app', 'Close', { duration: 2500 });
        },
        error: err => {
          this.busy.set(false);
          this.snack.open(err?.error?.message || 'Failed to start enrollment', 'Close', { duration: 2500 });
        }
      });
  }

  verify() {
    if (this.verifyForm.invalid) return;
    this.busy.set(true);
    this.http.post<{enabled:boolean}>(`${this.base}/verify`, this.verifyForm.value, { headers: this.authHeaders() })
      .subscribe({
        next: r => {
          this.busy.set(false);
          if (r.enabled) {
            this.enrolling.set(false);
            this.qr.set(null);
            this.verifyForm.reset();
            this.enabled.set(true);
            this.snack.open('Two-factor authentication enabled', 'Close', { duration: 2500 });
          }
        },
        error: err => {
          this.busy.set(false);
          this.snack.open(err?.error?.message || 'Invalid code', 'Close', { duration: 2500 });
        }
      });
  }

  cancelEnroll() {
    this.enrolling.set(false);
    this.qr.set(null);
    this.verifyForm.reset();
  }

  disable() {
    this.busy.set(true);
    this.http.post<{enabled:boolean}>(`${this.base}/disable`, {}, { headers: this.authHeaders() })
      .subscribe({
        next: _ => {
          this.busy.set(false);
          this.enabled.set(false);
          this.snack.open('Two-factor disabled', 'Close', { duration: 2000 });
        },
        error: err => {
          this.busy.set(false);
          this.snack.open(err?.error?.message || 'Failed to disable', 'Close', { duration: 2500 });
        }
      });
  }
}
