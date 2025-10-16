import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormGroup,
  FormControl
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card'; // <-- add this

@Component({
  standalone: true,
  selector: 'app-register',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatCardModule, // <-- and include it here
  ],
  styles: [`
    :host {
      display:block;
      min-height: 100dvh;
      background: radial-gradient(1000px 500px at 100% 0%, rgba(137,87,229,.10), transparent 65%),
                  radial-gradient(900px 500px at -10% 100%, rgba(236,72,153,.10), transparent 60%),
                  linear-gradient(180deg, var(--bg-01), var(--bg-02));
      color: var(--text);
    }
    .shell {
      max-width: 1100px; margin: 0 auto; padding: clamp(16px, 3vw, 32px);
      display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; align-items: center;
    }
    .art { display:flex; align-items:center; justify-content:center; }
    .card {
      background: var(--card-gradient); border:1px solid var(--border-color); border-radius: var(--border-radius);
      padding: 1.2rem; box-shadow: 0 18px 60px rgba(0,0,0,.45); position:relative; overflow:hidden;
    }
    .card::before {
      content:''; position:absolute; inset:0; background: var(--premium-gradient); opacity:.08;
      pointer-events:none; -webkit-mask: linear-gradient(135deg, #000, transparent); mask: linear-gradient(135deg, #000, transparent);
    }
    .muted { color: var(--text-secondary); }
    h2 { margin-top:0; font-weight:700; }
    .row { display:grid; grid-template-columns: 1fr; gap:.65rem; }
    .actions { display:flex; align-items:center; justify-content:space-between; gap:.6rem; margin-top:.6rem; }
    .link { color: var(--accent); text-decoration:none; }
    .btn {
      display:inline-flex; align-items:center; justify-content:center; gap:.5rem;
      padding:.72rem 1.1rem; border:none; border-radius: var(--border-radius);
      background: var(--accent-gradient); color:#fff; cursor:pointer;
      transition: transform .2s, box-shadow .2s, filter .2s;
    }
    .btn:hover { transform: translateY(-2px); box-shadow:0 12px 38px rgba(137,87,229,.18); }
    .btn:active { transform: translateY(0); filter: brightness(.96); }
    .error { color: var(--error); }
    @media (max-width: 980px){ .shell{ grid-template-columns: 1fr; } }
  `],
  template: `
    <div class="shell">
      <div class="art">
        <img src="/bank-mascot.svg" alt="VaultFlow mascot" style="max-width:320px;opacity:.9">
      </div>

      <mat-card class="card">
        <h2>Create an account</h2>
        <p class="muted">Register to check your balance, view transactions, and transfer funds.</p>

        <form [formGroup]="form" (ngSubmit)="register()">
          <div class="row">
            <mat-form-field appearance="fill">
              <mat-label>Username</mat-label>
              <input matInput formControlName="username" placeholder="Your username">
              <mat-icon matSuffix>person</mat-icon>
              <mat-error *ngIf="u.touched && u.invalid" class="error">
                Username is required (min 3 chars)
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="fill">
              <mat-label>Password</mat-label>
              <input matInput [type]="show ? 'text':'password'"
                     formControlName="password"
                     placeholder="At least 6 characters">
              <button mat-icon-button matSuffix type="button" (click)="show = !show" aria-label="Toggle password visibility">
                <mat-icon>{{ show ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              <mat-error *ngIf="p.touched && p.invalid" class="error">
                Password is required (min 6 chars)
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="fill">
              <mat-label>Account Number</mat-label>
              <input matInput formControlName="accountNumber" placeholder="e.g. ACCT123456">
              <mat-error *ngIf="a.touched && a.invalid" class="error">
                Account number is required
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="fill">
              <mat-label>Initial Balance</mat-label>
              <input matInput type="number" step="0.01" formControlName="initialBalance" placeholder="e.g. 1000">
              <mat-error *ngIf="b.touched && b.invalid" class="error">
                Initial balance must be zero or greater
              </mat-error>
            </mat-form-field>

            <div class="actions">
              <a routerLink="/login" class="link">Back to Login</a>
              <button class="btn" type="submit" [disabled]="form.invalid || loading">
                <mat-spinner *ngIf="loading" diameter="18"></mat-spinner>
                <span *ngIf="!loading">Create account</span>
              </button>
            </div>
          </div>
        </form>
      </mat-card>
    </div>
  `
})
export class RegisterComponent {
  form!: FormGroup;

  get u() { return this.form.controls['username'] as FormControl<string>; }
  get p() { return this.form.controls['password'] as FormControl<string>; }
  get a() { return this.form.controls['accountNumber'] as FormControl<string>; }
  get b() { return this.form.controls['initialBalance'] as FormControl<number>; }

  readonly base = 'http://localhost:8080/api/auth';
  loading = false;
  show = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private snack: MatSnackBar
  ) {
    this.form = this.fb.group({
      username:       this.fb.control<string>('', [Validators.required, Validators.minLength(3)]),
      password:       this.fb.control<string>('', [Validators.required, Validators.minLength(6)]),
      accountNumber:  this.fb.control<string>('', [Validators.required]),
      initialBalance: this.fb.control<number>(0,   [Validators.required, Validators.min(0)])
    });
  }

  register() {
    if (this.form.invalid) return;
    this.loading = true;
    this.http.post<any>(`${this.base}/register`, this.form.value).subscribe({
      next: () => {
        this.loading = false;
        this.snack.open('Registration successful', 'Close', { duration: 2000 });
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.loading = false;
        this.snack.open(err?.error?.message || 'Registration failed', 'Close', { duration: 3000 });
      }
    });
  }
}
