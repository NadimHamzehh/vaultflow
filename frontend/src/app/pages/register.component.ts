import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormGroup,
  FormControl,
  ValidationErrors,
  ValidatorFn,
  AbstractControl
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { environment } from '../../environments/environment';

const passwordMatchValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const pass = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pass && confirm && pass !== confirm ? { mismatch: true } : null;
};

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
    MatCardModule,
  ],
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;700&display=swap');

    :host {
      --accent1: #8b5cf6;
      --accent2: #22d3ee;
      --border: rgba(255,255,255,.1);
      --bg1: #0b0f17;
      --bg2: #0b1020;
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
      padding:56px 20px; /* prevents title clipping */
      text-align:center;
    }

    .title {
      font-family: 'Space Grotesk', sans-serif;
      font-size: clamp(2rem, 4vw, 3rem);
      font-weight: 700;
      letter-spacing: .5px;
      line-height: 1.15;
      padding-block: 6px;
      margin: 0 0 .35rem 0;
      background: linear-gradient(90deg, var(--accent1), var(--accent2));
      -webkit-background-clip: text;
      color: transparent;
      animation: fadeInUp 1.0s ease;
    }
    .subtitle { color: var(--muted); font-size: 1.05rem; margin-bottom: 1.4rem; }

    mat-card {
      width: 100%;
      max-width: 500px;
      background: rgba(255,255,255,0.05);
      border: 1px solid var(--border);
      border-radius: 18px;
      padding: 1.6rem 1.4rem;
      box-shadow: 0 10px 60px rgba(0,0,0,0.45);
      backdrop-filter: blur(10px);
      animation: fadeIn 1.1s ease;
    }

    /* Polished inputs like login */
    .pretty-field .mat-mdc-text-field-wrapper {
      border-radius: 14px !important;
      background: rgba(255,255,255,.06);
      border: 1px solid rgba(255,255,255,.10);
      transition: box-shadow .2s ease, border-color .2s ease, background .2s ease;
    }
    .pretty-field .mat-mdc-form-field-flex { padding: 6px 12px !important; }
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

    .btn {
      background: linear-gradient(135deg, var(--accent1), #6d28d9);
      color: white;
      border: none;
      border-radius: 12px;
      padding: 0.9rem 1.1rem;
      font-weight: 600;
      transition: all 0.2s ease;
      min-height: 46px;
      width: 100%;
      margin-top: .2rem;
    }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(139,92,246,0.35); }

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(22px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `],
  template: `
    <div class="screen">
      <h1 class="title">VaultFlow — Register</h1>
      <p class="subtitle">Create your secure banking account</p>

      <mat-card>
        <form [formGroup]="form" (ngSubmit)="register()">
          <mat-form-field appearance="outline" class="pretty-field" style="width:100%;">
            <mat-label>Username</mat-label>
            <input matInput formControlName="username" placeholder=""/>
            <mat-error *ngIf="u.invalid && u.touched">Username is required (min 3 chars)</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="pretty-field" style="width:100%;">
            <mat-label>Email</mat-label>
            <input matInput formControlName="email" placeholder=""/>
            <mat-error *ngIf="e.invalid && e.touched">Enter a valid email</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="pretty-field" style="width:100%;">
            <mat-label>Password</mat-label>
            <input matInput [type]="show ? 'text':'password'" formControlName="password" placeholder=""/>
            <mat-error *ngIf="p.invalid && p.touched">Password is required (min 6 chars)</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="pretty-field" style="width:100%;">
            <mat-label>Confirm password</mat-label>
            <input matInput [type]="show ? 'text':'password'" formControlName="confirmPassword" placeholder=""/>
            <mat-error *ngIf="form.hasError('mismatch') && cp.touched">Passwords do not match</mat-error>
          </mat-form-field>

          <button class="btn" type="submit" [disabled]="form.invalid || loading">
            <!-- Centered spinner while loading -->
            <span *ngIf="loading" style="display:flex; width:100%; justify-content:center;">
              <mat-spinner diameter="18"></mat-spinner>
            </span>
            <span *ngIf="!loading">Create account</span>
          </button>

          <p style="margin:.7rem 0 0 0;">Already have an account?
            <a routerLink="/login" class="link" style="color:#8b5cf6;">Sign in</a>
          </p>
        </form>
      </mat-card>
    </div>
  `
})
export class RegisterComponent {
  form!: FormGroup;

  get u()  { return this.form.controls['username'] as FormControl<string>; }
  get e()  { return this.form.controls['email'] as FormControl<string>; }
  get p()  { return this.form.controls['password'] as FormControl<string>; }
  get cp() { return this.form.controls['confirmPassword'] as FormControl<string>; }
  get b()  { return this.form.controls['initialBalance'] as FormControl<number>; }

  readonly base = `${environment.apiBaseUrl}/auth`;
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
      email:          this.fb.control<string>('', [Validators.required, Validators.email]),
      password:       this.fb.control<string>('', [Validators.required, Validators.minLength(6)]),
      confirmPassword:this.fb.control<string>('', [Validators.required]),
      initialBalance: this.fb.control<number>(0,   [Validators.required, Validators.min(0)]),
    }, { validators: passwordMatchValidator });
  }

  register() {
    if (this.form.invalid) return;
    this.loading = true;

    const payload = {
      username: this.u.value,
      email: this.e.value,
      password: this.p.value,
      initialDeposit: (this.b.value ?? 0).toString()
    };

    this.http.post<any>(`${this.base}/register`, payload).subscribe({
      next: () => {
        this.loading = false;
        this.snack.open('Registration successful', 'Close', { duration: 1800 });
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.loading = false;
        this.snack.open(err?.error?.error || err?.error?.message || 'Registration failed', 'Close', { duration: 3000 });
      }
    });
  }
}
