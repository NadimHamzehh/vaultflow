import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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

type LoginSuccess = { token: string };
type Login2FA = { requires2fa: true; tempToken: string };

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
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;700&display=swap');

    :host {
      --bg1: #0b0f17;
      --bg2: #0b1020;
      --border: rgba(255,255,255,.1);
      --accent1: #8b5cf6;
      --accent2: #22d3ee;
      --text: #e6e9ef;
      --muted: #9aa3b2;
      --error: #ef4444;
      font-family: 'Inter', sans-serif;
      display:block;
      min-height:100vh;
      background:
        radial-gradient(1200px 600px at 85% -10%, rgba(139,92,246,.15), transparent 70%),
        radial-gradient(1000px 500px at -10% 110%, rgba(34,211,238,.12), transparent 60%),
        linear-gradient(180deg, var(--bg1), var(--bg2));
      color:var(--text);
    }

    .screen {
      min-height:100vh;
      display:flex;
      flex-direction:column;
      justify-content:center;
      align-items:center;
      padding:56px 20px; /* extra top/bottom so the title never looks clipped */
      text-align:center;
    }

    .title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: clamp(2rem, 4vw, 3rem);
      font-weight: 700;
      letter-spacing: .5px;
      line-height: 1.15;        /* prevents visual clipping */
      padding-block: 6px;       /* breathing room above/below */
      margin: 0 0 .35rem 0;
      background: linear-gradient(90deg, var(--accent1), var(--accent2));
      -webkit-background-clip: text;
      color: transparent;
      animation: fadeInUp 1.0s ease;
    }
    .subtitle {
      color: var(--muted);
      font-size: 1.05rem;
      margin: 0 0 1.4rem 0;
    }

    mat-card {
      width: 100%;
      max-width: 480px;
      background: rgba(255,255,255,0.05);
      border: 1px solid var(--border);
      border-radius: 18px;
      padding: 1.6rem 1.4rem;
      box-shadow: 0 10px 60px rgba(0,0,0,0.45);
      backdrop-filter: blur(10px);
      animation: fadeIn 1.1s ease;
    }

    /* ------- Polished inputs ------- */
    .pretty-field .mat-mdc-text-field-wrapper {
      border-radius: 14px !important;
      background: rgba(255,255,255,.06);
      border: 1px solid rgba(255,255,255,.10);
      transition: box-shadow .2s ease, border-color .2s ease, background .2s ease;
    }
    .pretty-field .mat-mdc-form-field-flex {
      padding: 6px 12px !important;
    }
    .pretty-field .mdc-text-field--outlined:not(.mdc-text-field--disabled) .mdc-notched-outline__leading,
    .pretty-field .mdc-text-field--outlined:not(.mdc-text-field--disabled) .mdc-notched-outline__notch,
    .pretty-field .mdc-text-field--outlined:not(.mdc-text-field--disabled) .mdc-notched-outline__trailing {
      border: none !important;
    }
    .pretty-field .mat-mdc-input-element::placeholder {
      font-family: 'Space Grotesk', sans-serif;
      color: rgba(230,233,239,.75);
      opacity: 1;
      letter-spacing: .2px;
    }
    .pretty-field.mat-focused .mat-mdc-text-field-wrapper {
      background: rgba(255,255,255,.08);
      box-shadow: 0 0 0 3px rgba(139,92,246,.25);
      border-color: rgba(139,92,246,.45);
    }
    .pretty-field .mat-mdc-form-field-subscript-wrapper { margin-top: 4px; }

    .divider { height:1px; background:linear-gradient(90deg, transparent, rgba(255,255,255,.08), transparent); margin:1rem 0 1rem; }
    .row { display:grid; grid-template-columns:1fr; gap:.7rem; }
    .btn {
      background: linear-gradient(135deg, var(--accent1), #6d28d9);
      color: white;
      border: none;
      border-radius: 12px;
      padding: 0.9rem 1.1rem;
      font-weight: 600;
      transition: all 0.2s ease;
      min-height: 46px;
    }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(139,92,246,0.35); }
    .link { color: var(--accent1); text-decoration:none; }
    .link:hover { text-decoration: underline; }

    .otp-wrap {
      margin-top: .5rem;
      padding: .9rem;
      border: 1px dashed rgba(255,255,255,.18);
      border-radius: 12px;
      background: linear-gradient(180deg, rgba(255,255,255,.02), rgba(255,255,255,.01));
      text-align: left;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(22px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `],
  template: `
    <div class="screen">
      <h1 class="title">VaultFlow — Sign In</h1>
      <p class="subtitle">Secure access with email + optional 2FA</p>

      <mat-card>
        <!-- STEP 1: Credentials -->
        <form [formGroup]="form" (ngSubmit)="login()" *ngIf="!needsOtp()">
          <div class="row">
            <mat-form-field appearance="outline" class="pretty-field">
              <mat-label>Email</mat-label>
              <input matInput formControlName="email" autocomplete="email" placeholder=""/>
              <mat-error *ngIf="email.invalid && email.touched">Enter a valid email</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="pretty-field">
              <mat-label>Password</mat-label>
              <input matInput [type]="showPwd() ? 'text' : 'password'"
                     formControlName="password"
                     autocomplete="current-password"
                     placeholder=""/>
              <button mat-icon-button matSuffix type="button" (click)="togglePwd()" aria-label="Toggle password visibility">
                <mat-icon>{{ showPwd() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              <mat-error *ngIf="password.invalid && password.touched">Password is required (min 6 chars)</mat-error>
            </mat-form-field>

            <div class="divider"></div>
            <button class="btn" type="submit" [disabled]="form.invalid || loading()">
              <mat-spinner *ngIf="loading()" diameter="18"></mat-spinner>
              <span *ngIf="!loading()">Sign in</span>
            </button>

            <p style="margin: .6rem 0 0 0;">No account?
              <a routerLink="/register" class="link">Register here</a>
            </p>
          </div>
        </form>

        <!-- STEP 2: OTP -->
        <div *ngIf="needsOtp()" class="otp-wrap">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:.5rem;">
            <div>
              <div style="font-weight:600">Two-factor authentication</div>
              <div class="small" style="opacity:.85">Enter the 6-digit code from your authenticator</div>
            </div>
            <button class="btn" type="button" (click)="cancelOtp()" [disabled]="verifying()">
              Change account
            </button>
          </div>

          <form [formGroup]="otpForm" (ngSubmit)="verifyOtp()" style="margin-top:.65rem;">
            <mat-form-field appearance="outline" class="pretty-field" style="width:100%;">
              <mat-label>One-time code</mat-label>
              <input matInput formControlName="code" maxlength="6" placeholder="" inputmode="numeric"/>
              <mat-hint align="end">{{ otp.value?.length || 0 }}/6</mat-hint>
              <mat-error *ngIf="otp.touched && otp.invalid">Enter your 6-digit code</mat-error>
            </mat-form-field>

            <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
              <a class="link" href="#" (click)="$event.preventDefault(); resendHint()">Problems with your code?</a>
              <button class="btn" type="submit" [disabled]="otpForm.invalid || verifying()">
                <mat-spinner *ngIf="verifying()" diameter="18"></mat-spinner>
                <span *ngIf="!verifying()">Verify & Sign in</span>
              </button>
            </div>
          </form>
        </div>
      </mat-card>
    </div>
  `
})
export class LoginComponent {
  private readonly base = 'http://localhost:8080/api/auth';

  form!: FormGroup;
  email!: FormControl<string>;
  password!: FormControl<string>;

  otpForm!: FormGroup;
  otp!: FormControl<string>;

  loading   = signal(false);
  verifying = signal(false);
  private showPassword = signal(false);

  needsOtp = signal(false);
  private tempToken: string | null = null;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private snack: MatSnackBar
  ) {
    this.form = this.fb.group({
      email: this.fb.control<string>('', [Validators.required, Validators.email]),
      password: this.fb.control<string>('', [Validators.required, Validators.minLength(6)]),
    });
    this.email = this.form.controls['email'] as FormControl<string>;
    this.password = this.form.controls['password'] as FormControl<string>;

    this.otpForm = this.fb.group({
      code: this.fb.control<string>('', [Validators.required, Validators.pattern(/^\d{6}$/)]),
    });
    this.otp = this.otpForm.controls['code'] as FormControl<string>;
  }

  showPwd() { return this.showPassword(); }
  togglePwd() { this.showPassword.update(v => !v); }

  login() {
    if (this.form.invalid || this.loading()) return;
    this.loading.set(true);

    this.http.post<LoginSuccess | Login2FA>(`${this.base}/login`, this.form.value).subscribe({
      next: (res) => {
        this.loading.set(false);
        if ((res as Login2FA).requires2fa) {
          const twofa = res as Login2FA;
          this.tempToken = twofa.tempToken;
          this.needsOtp.set(true);
          this.snack.open('Two-factor required — enter the 6-digit code', 'Close', { duration: 2500 });
          return;
        }
        const ok = res as LoginSuccess;
        this.finishLogin(ok.token);
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err?.error?.message || err?.error?.error || 'Login failed';
        this.snack.open(msg, 'Close', { duration: 3000 });
      }
    });
  }

  verifyOtp() {
    if (this.otpForm.invalid || this.verifying()) return;
    if (!this.tempToken) {
      this.snack.open('Missing temporary token. Please sign in again.', 'Close', { duration: 2500 });
      this.cancelOtp();
      return;
    }
    this.verifying.set(true);
    const headers = new HttpHeaders({ Authorization: `Bearer ${this.tempToken}` });

    this.http.post<LoginSuccess>(`${this.base}/2fa/verify`, { code: this.otp.value }, { headers }).subscribe({
      next: (res) => {
        this.verifying.set(false);
        this.needsOtp.set(false);
        this.tempToken = null;
        this.finishLogin(res.token);
      },
      error: (err) => {
        this.verifying.set(false);
        const msg = err?.error?.message || 'Invalid or expired code';
        this.snack.open(msg, 'Close', { duration: 2500 });
      }
    });
  }

  private finishLogin(token: string) {
    localStorage.setItem('token', token);
    this.snack.open('Signed in', 'Close', { duration: 1500 });
    try {
      const payload = JSON.parse(atob(token.split('.')[1] || ''));
      const roles = Array.isArray(payload?.roles)
        ? payload.roles
        : String(payload?.roles || '').split(',').map((s: string) => s.trim().toUpperCase());
      if (roles.includes('ADMIN')) {
        this.router.navigate(['/admin']); return;
      }
    } catch {}
    this.router.navigate(['/app']);
  }

  cancelOtp() {
    this.needsOtp.set(false);
    this.tempToken = null;
    this.otpForm.reset();
    this.form.enable();
  }

  resendHint() {
    this.snack.open('Open your authenticator app. If codes keep failing, ensure device time is correct.', 'Close', { duration: 4000 });
  }
}
