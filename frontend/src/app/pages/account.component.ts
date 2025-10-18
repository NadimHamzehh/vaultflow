// src/app/pages/account.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormControl } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

type AccountDto = { username: string; email: string; accountNumber: string; balance: number };

@Component({
  standalone: true,
  selector: 'app-account',
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatSnackBarModule, MatProgressSpinnerModule
  ],
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Space+Grotesk:wght@600;700&display=swap');
    :host { display:block; min-height:100vh; background:linear-gradient(135deg,#0b0f17 0%,#151a2b 100%); color:#e6e9ef; }
    .wrap { max-width: 980px; margin: 2.4rem auto; padding: 0 1rem; }

    .header { display:flex; align-items:center; justify-content:space-between; gap:.8rem; margin-bottom:1rem; }
    .title { font-family:'Space Grotesk',sans-serif; font-weight:700; font-size: clamp(1.6rem, 3.2vw, 2.2rem); letter-spacing:.4px; }
    .muted { color:#9aa3b2; }

    .grid { display:grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    @media (max-width: 900px){ .grid { grid-template-columns: 1fr; } }

    mat-card {
      background: rgba(255,255,255,.05);
      border:1px solid rgba(255,255,255,.08);
      border-radius:18px;
      padding:1.1rem 1.3rem;
      backdrop-filter: blur(10px);
      box-shadow: 0 10px 40px rgba(0,0,0,.4);
    }

    .section-title { font-weight:700; margin-bottom:.6rem; }

    /* Account on left, user info on right */
    .account-top {
      display:grid;
      grid-template-columns: 1fr 1fr;
      gap: .8rem;
      align-items:stretch;
    }
    @media (max-width: 640px){ .account-top { grid-template-columns: 1fr; } }

    .pill {
      display:flex; align-items:center; gap:.6rem; justify-content:space-between;
      padding:.7rem .8rem;
      border:1px solid rgba(255,255,255,.12);
      border-radius:12px;
      background:rgba(255,255,255,.04);
      font-weight:600;
    }
    .pill .acc { display:flex; align-items:center; gap:.5rem; }

    .user-card {
      border:1px solid rgba(255,255,255,.12);
      border-radius:12px;
      background:rgba(255,255,255,.04);
      padding:.7rem .8rem;
      display:grid; gap:.45rem;
    }
    .line { display:flex; align-items:center; justify-content:space-between; gap:.6rem; }
    .label { color:#9aa3b2; font-weight:600; letter-spacing:.3px; }
    .value { font-weight:700; font-family:'Inter',sans-serif; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

    .btn-ghost { background:transparent; border:1px solid rgba(255,255,255,.12); color:#e6e9ef; border-radius:10px; padding:.45rem .75rem; display:inline-flex; align-items:center; gap:.4rem; }

    .divider { height:1px; background:linear-gradient(90deg,transparent,rgba(255,255,255,.08),transparent); margin:1rem 0; }

    .btn-row { display:flex; gap:.6rem; flex-wrap:wrap; }
    .btn-primary {
      background:linear-gradient(135deg,#8b5cf6,#6d28d9);
      color:#fff; border:none; border-radius:10px; padding:.72rem 1.1rem; font-weight:600; letter-spacing:.3px; cursor:pointer;
      display:inline-flex; align-items:center; gap:.5rem; transition: transform .2s, box-shadow .2s;
    }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(139,92,246,.35); }

    .otp-box {
      display:flex; gap:.5rem; align-items:center;
      padding:.65rem; border-radius:10px; border:1px dashed rgba(255,255,255,.18);
      background:linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.015));
      margin-top:.6rem;
    }

    .pretty .mat-mdc-text-field-wrapper {
      border-radius:12px!important;
      background:rgba(255,255,255,.07);
      border:1px solid rgba(255,255,255,.1);
      transition:border-color .2s ease, box-shadow .2s ease;
    }
    .pretty.mat-focused .mat-mdc-text-field-wrapper {
      background:rgba(255,255,255,.08);
      box-shadow:0 0 0 3px rgba(139,92,246,.25);
      border-color:rgba(139,92,246,.4);
    }
    .pretty .mat-mdc-input-element::placeholder { color:rgba(230,233,239,.75); opacity:1; }

    .actions { display:flex; gap:.6rem; justify-content:flex-end; margin-top:.6rem; }
  `],
  template: `
    <div class="wrap">
      <div class="header">
        <div>
          <div class="title">Account</div>
          <div class="muted">Your profile and security</div>
        </div>
      </div>

      <div class="grid">
        <!-- Left: Profile & Account -->
        <mat-card>
          <div class="section-title">Profile</div>

          <div class="account-top">
            <!-- Account block -->
            <div class="pill">
              <div class="acc">
                <mat-icon>account_balance_wallet</mat-icon>
                <span>Account</span>
                <strong>{{ accountNumber || '—' }}</strong>
              </div>
              <button class="btn-ghost" type="button" (click)="copyAccount()">
                <mat-icon style="font-size:18px; height:18px; width:18px;">content_copy</mat-icon>
                Copy
              </button>
            </div>

            <!-- User info on the RIGHT -->
            <div class="user-card">
              <div class="line">
                <div class="label">Username</div>
                <div class="value">{{ username || '—' }}</div>
              </div>
              <div class="line">
                <div class="label">Email</div>
                <div class="value">{{ email || '—' }}</div>
              </div>
            </div>
          </div>

          <div class="divider"></div>

          <div class="section-title">Password</div>
          <div class="btn-row">
            <!-- Only Change Password remains -->
            <button class="btn-ghost" type="button" (click)="toggleChange()">
              <mat-icon>password</mat-icon> Change password
            </button>
          </div>

          <!-- Change password (2FA required) -->
          <form *ngIf="showChange" [formGroup]="pwdForm" (ngSubmit)="changePassword()" style="margin-top:.8rem;">
            <mat-form-field appearance="outline" class="pretty" style="width:100%; margin-bottom:.6rem;">
              <mat-label>Current password</mat-label>
              <input matInput [type]="showCurrent? 'text':'password'" formControlName="currentPassword" placeholder="">
              <button mat-icon-button type="button" matSuffix (click)="showCurrent=!showCurrent">
                <mat-icon>{{ showCurrent ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </mat-form-field>

            <mat-form-field appearance="outline" class="pretty" style="width:100%; margin-bottom:.6rem;">
              <mat-label>New password</mat-label>
              <input matInput [type]="showNew? 'text':'password'" formControlName="newPassword" placeholder="">
              <button mat-icon-button type="button" matSuffix (click)="showNew=!showNew">
                <mat-icon>{{ showNew ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </mat-form-field>

            <mat-form-field appearance="outline" class="pretty" style="width:100%; margin-bottom:.2rem;">
              <mat-label>Confirm new password</mat-label>
              <input matInput [type]="showConfirm? 'text':'password'" formControlName="confirmNewPassword" placeholder="">
              <button mat-icon-button type="button" matSuffix (click)="showConfirm=!showConfirm">
                <mat-icon>{{ showConfirm ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              <mat-error *ngIf="pwdMismatch()">Passwords do not match</mat-error>
            </mat-form-field>

            <!-- 2FA code -->
            <div class="otp-box">
              <mat-icon>shield</mat-icon>
              <mat-form-field appearance="outline" class="pretty" style="flex:1;">
                <mat-label>2FA code</mat-label>
                <input matInput maxlength="6" formControlName="code" placeholder="" inputmode="numeric">
              </mat-form-field>
            </div>

            <div class="actions">
              <button class="btn-ghost" type="button" (click)="cancelChange()">Cancel</button>
              <button class="btn-primary" type="submit" [disabled]="pwdForm.invalid || pwdMismatch() || saving()">
                <mat-spinner *ngIf="saving()" diameter="18" strokeWidth="3"></mat-spinner>
                <span *ngIf="!saving()">Change to new password</span>
              </button>
            </div>
          </form>
        </mat-card>

        <!-- Right column -->
        <mat-card>
          <div class="section-title">Security tips</div>
          <ul class="muted" style="margin:.25rem 0 0 1rem;">
            <li>We never store your password in plaintext.</li>
            <li>Use a unique password you don’t use elsewhere.</li>
            <li>Keep 2FA enabled to protect your account.</li>
          </ul>
        </mat-card>
      </div>
    </div>
  `
})
export class AccountComponent implements OnInit {
  private meAccountUrl = 'http://localhost:8080/api/me/account';
  private changeUrl = 'http://localhost:8080/api/me/security/password/change';

  username = '';
  email = '';
  accountNumber = '';

  // Change flow
  showChange = false;
  pwdForm!: FormGroup;
  currentPassword!: FormControl<string>;
  newPassword!: FormControl<string>;
  confirmNewPassword!: FormControl<string>;
  code!: FormControl<string>;
  saving = signal(false);

  // toggles
  showCurrent = false;
  showNew = false;
  showConfirm = false;

  constructor(private http: HttpClient, private fb: FormBuilder, private snack: MatSnackBar) {}

  ngOnInit(): void {
    this.initForms();
    this.loadAccount();
  }

  private initForms(): void {
    this.pwdForm = this.fb.group({
      currentPassword: this.fb.control<string>('', [Validators.required]),
      newPassword: this.fb.control<string>('', [Validators.required, Validators.minLength(6)]),
      confirmNewPassword: this.fb.control<string>('', [Validators.required, Validators.minLength(6)]),
      code: this.fb.control<string>('', [Validators.required, Validators.pattern(/^\d{6}$/)])
    });
    this.currentPassword = this.pwdForm.controls['currentPassword'] as FormControl<string>;
    this.newPassword = this.pwdForm.controls['newPassword'] as FormControl<string>;
    this.confirmNewPassword = this.pwdForm.controls['confirmNewPassword'] as FormControl<string>;
    this.code = this.pwdForm.controls['code'] as FormControl<string>;
  }

  private headers(): HttpHeaders | null {
    const token = localStorage.getItem('token');
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : null;
    }

  private loadAccount(): void {
    const headers = this.headers();
    if (!headers) return;

    this.http.get<AccountDto>(this.meAccountUrl, { headers }).subscribe({
      next: (d) => {
        this.username = d?.username || '';
        this.email = d?.email || '';
        this.accountNumber = d?.accountNumber || '';
      },
      error: (e) => console.error(e)
    });
  }

  copyAccount(): void {
    if (!this.accountNumber) return;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(this.accountNumber).then(() => {
        this.snack.open('Account number copied', 'Close', { duration: 2000 });
      }).catch(() => this.fallbackCopy(this.accountNumber));
    } else {
      this.fallbackCopy(this.accountNumber);
    }
  }
  private fallbackCopy(text: string) {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
    this.snack.open('Account number copied', 'Close', { duration: 2000 });
  }

  toggleChange(): void {
    this.showChange = !this.showChange;
    if (!this.showChange) this.pwdForm.reset();
  }
  cancelChange(): void {
    this.showChange = false;
    this.pwdForm.reset();
  }

  pwdMismatch(): boolean {
    return (this.newPassword.value || '') !== (this.confirmNewPassword.value || '');
  }

  changePassword(): void {
    if (this.pwdForm.invalid || this.pwdMismatch() || this.saving()) return;

    const headers = this.headers();
    if (!headers) { this.snack.open('Not authenticated', 'Close', { duration: 2000 }); return; }

    const body = {
      currentPassword: (this.currentPassword.value || '').trim(),
      newPassword: (this.newPassword.value || '').trim(),
      confirmNewPassword: (this.confirmNewPassword.value || '').trim(),
      code: (this.code.value || '').trim()
    };

    this.saving.set(true);
    this.http.post<{ message?: string }>(this.changeUrl, body, { headers }).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.snack.open(res?.message || 'Password updated', 'Close', { duration: 2500 });
        this.pwdForm.reset();
        this.showChange = false;
      },
      error: (err) => {
        this.saving.set(false);
        const msg = err?.error?.message || err?.error?.error || 'Password change failed';
        this.snack.open(msg, 'Close', { duration: 3000 });
      }
    });
  }
}
