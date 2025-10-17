import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormGroup,
  FormControl,
} from '@angular/forms';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule }      from '@angular/material/input';
import { MatButtonModule }     from '@angular/material/button';
import { MatCardModule }       from '@angular/material/card';
import { MatIconModule }       from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  styles: [`
    :host {
      display: block;
      min-height: 100dvh;
      background: radial-gradient(1200px 600px at 85% -10%, rgba(137,87,229,.12), transparent 70%),
                  radial-gradient(1000px 500px at -10% 110%, rgba(236,72,153,.10), transparent 60%),
                  linear-gradient(180deg, var(--bg-01), var(--bg-02));
      color: var(--text);
    }
    .shell { max-width: 1100px; margin: 0 auto; padding: clamp(16px, 3vw, 32px);
             display: grid; grid-template-columns: 1.05fr .95fr; gap: clamp(16px, 2.5vw, 32px); align-items: center; }
    .hero { padding-inline: clamp(8px, 1vw, 12px); }
    .brand { display:flex; align-items:center; gap:.6rem; margin-bottom: 1.2rem; }
    .badge { display:inline-flex; align-items:center; gap:.4rem; font-size:.82rem; padding:.3rem .6rem; border-radius:999px;
             background: rgba(137, 87, 229, .08); border: 1px solid rgba(137, 87, 229, .25); color: var(--text); }
    .badge .dot { width:8px; height:8px; border-radius:50%; background:#3FB950; box-shadow:0 0 0 4px rgba(63,185,80,.15); }
    h1 { margin:.2rem 0 .6rem 0; font-weight:600; letter-spacing:.2px; font-size:clamp(28px, 3.2vw, 38px); color:var(--text-primary); }
    .subtitle { color:var(--text-secondary); font-size:clamp(14px, 1.2vw, 16px); max-width:48ch; line-height:1.6; }

    .card { background: var(--card-gradient); border: 1px solid var(--border-color); border-radius: var(--border-radius);
            box-shadow: 0 18px 60px rgba(0,0,0,.45); position: relative; overflow: hidden; }
    .card::before { content:''; position:absolute; inset:0; background: var(--premium-gradient); opacity:.08;
                    pointer-events:none; -webkit-mask: linear-gradient(135deg, #000, transparent); mask: linear-gradient(135deg, #000, transparent); }
    .card-inner { padding: clamp(16px, 2.2vw, 26px); }

    .form-title { display:flex; align-items:center; justify-content:space-between; gap:.6rem; margin-bottom:.5rem; }
    .form-title h2 { margin:0; font-size:clamp(18px, 1.8vw, 22px); font-weight:600; color:var(--text-primary); }
    .hint { color:var(--text-secondary); font-size:.92rem; }

    .divider { height:1px; background:linear-gradient(90deg, transparent, rgba(255,255,255,.08), transparent); margin:.8rem 0 1.1rem; }
    .row { display:grid; grid-template-columns:1fr; gap:.65rem; }
    .full { grid-column: 1 / -1; }

    .actions { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-top:.75rem; }
    .link { color: var(--accent); text-decoration: none; font-size:.92rem; }

    .btn { display:inline-flex; align-items:center; justify-content:center; gap:.5rem;
           padding:.72rem 1.1rem; border:none; border-radius: var(--border-radius);
           background: var(--accent-gradient); color:#fff; cursor:pointer;
           transition: transform .2s, box-shadow .2s, filter .2s; }
    .btn:hover { transform: translateY(-2px); box-shadow:0 12px 38px rgba(137,87,229,.18); }
    .btn:active { transform: translateY(0); filter: brightness(.96); }

    .error { color: var(--error); }
    .foot-note { margin-top:.75rem; font-size:.92rem; color:var(--text-secondary); }
    .foot-note a { color: var(--accent); text-decoration:none; }
    .foot-note a:hover { text-decoration: underline; }

    .mat-mdc-form-field { width:100%; }
    .mat-mdc-form-field-subscript-wrapper { margin-top:4px; }

    @media (max-width: 980px) { .shell { grid-template-columns: 1fr; } }
  `],
  template: `
    <div class="shell">
      <section class="hero">
        <div class="brand">
          <span class="badge"><span class="dot"></span>Bank-grade security</span>
        </div>
        <h1>Welcome back to VaultFlow</h1>
        <p class="subtitle">
          Sign in to manage balances, review transaction history, and make secure transfers.
          Your session is protected with JWT and hardened server policies.
        </p>
      </section>

      <mat-card class="card">
        <div class="card-inner">
          <div class="form-title">
            <h2>Sign in</h2>
            <span class="hint">Use your VaultFlow credentials</span>
          </div>

          <form [formGroup]="form" (ngSubmit)="login()">
            <div class="row">

              <mat-form-field appearance="fill">
                <mat-label>Username</mat-label>
                <input matInput formControlName="username" autocomplete="username" placeholder="e.g. alice" />
                <mat-icon matSuffix>person</mat-icon>
                <mat-hint *ngIf="u.pristine">Enter your username</mat-hint>
                <mat-error *ngIf="u.touched && u.invalid" class="error">
                  Username is required (min 3 chars)
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="fill">
                <mat-label>Password</mat-label>
                <input matInput [type]="showPwd() ? 'text' : 'password'"
                       formControlName="password"
                       autocomplete="current-password"
                       placeholder="Your password" />
                <button mat-icon-button matSuffix type="button" (click)="togglePwd()" aria-label="Toggle password visibility">
                  <mat-icon>{{ showPwd() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                <mat-error *ngIf="p.touched && p.invalid" class="error">
                  Password is required (min 6 chars)
                </mat-error>
              </mat-form-field>

              <div class="divider full"></div>

              <div class="actions full">
                <a class="link" routerLink="/register">Create an account</a>
                <button class="btn" type="submit" [disabled]="form.invalid || loading()">
                  <mat-spinner *ngIf="loading()" diameter="18"></mat-spinner>
                  <span *ngIf="!loading()">Sign in</span>
                  <span *ngIf="loading()">Signing in…</span>
                </button>
              </div>
            </div>
          </form>

          <p class="foot-note">
            Trouble signing in? <a href="#" (click)="$event.preventDefault(); help()">Contact support</a>
          </p>
        </div>
      </mat-card>
    </div>
  `
})
export class LoginComponent {
  private readonly base = 'http://localhost:8080/api/auth';

  form!: FormGroup;
  u!: FormControl<string>;
  p!: FormControl<string>;

  loading = signal(false);
  private showPassword = signal(false);

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private snack: MatSnackBar
  ) {
    this.form = this.fb.group({
      username: this.fb.control<string>('', [Validators.required, Validators.minLength(3)]),
      password: this.fb.control<string>('', [Validators.required, Validators.minLength(6)]),
    });
    this.u = this.form.controls['username'] as FormControl<string>;
    this.p = this.form.controls['password'] as FormControl<string>;
  }

  showPwd() { return this.showPassword(); }
  togglePwd() { this.showPassword.update(v => !v); }

  private tokenHasAdmin(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1] || ''));
      const raw = Array.isArray(payload?.roles) ? payload.roles.join(',') : (payload?.roles || '');
      return raw.split(',').map((r: string) => r.trim().toUpperCase()).includes('ADMIN');
    } catch {
      return false;
    }
  }

  login() {
    if (this.form.invalid || this.loading()) return;

    this.loading.set(true);
    this.http.post<{ token: string }>(`${this.base}/login`, this.form.value).subscribe({
      next: (res) => {
        this.loading.set(false);
        localStorage.setItem('token', res.token);
        const isAdmin = this.tokenHasAdmin(res.token);
        this.snack.open('Signed in', 'Close', { duration: 2000 });
        this.router.navigate([ isAdmin ? '/admin' : '/app' ]);
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err?.error?.message || err?.error?.error || 'Login failed';
        this.snack.open(msg, 'Close', { duration: 3000 });
      }
    });
  }

  help() {
    this.snack.open('Reach us at support@vaultflow.local • +1 (555) 010-2222', 'Close', { duration: 3000 });
  }
}
