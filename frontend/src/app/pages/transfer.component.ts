import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormControl } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ActivityService } from '../services/activity.service';
import { DeviceManagementComponent } from '../components/device-management.component';
import { environment } from '../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-transfer',
  imports: [
    CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatCardModule, MatSnackBarModule, MatProgressSpinnerModule,
    MatIconModule, MatTooltipModule, MatDialogModule
  ],
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Space+Grotesk:wght@600;700&display=swap');

    :host {
      display:block;
      font-family:'Inter',sans-serif;
      background:linear-gradient(135deg,#0b0f17 0%,#151a2b 100%);
      min-height:100vh;
      color:#e6e9ef;
    }

    .wrap {
      max-width:960px;
      margin:3rem auto;
      padding:0 1.4rem;
      animation: fadeIn 0.8s ease;
    }

    h2 {
      font-family:'Space Grotesk',sans-serif;
      font-weight:700;
      letter-spacing:.5px;
      color:#fff;
      margin-bottom:.2rem;
    }
    .subtitle { color:#9aa3b2; margin:0 0 1rem 0; }

    mat-card {
      background:rgba(255,255,255,0.05);
      border:1px solid rgba(255,255,255,0.08);
      border-radius:18px;
      padding:1.4rem 1.6rem;
      backdrop-filter:blur(10px);
      box-shadow:0 10px 40px rgba(0,0,0,0.4);
      animation: cardFade 0.9s ease;
    }

    .panel { display:grid; grid-template-columns:1.1fr .9fr; gap:1.2rem; }
    @media(max-width:860px){ .panel{ grid-template-columns:1fr; } }

    .btn-primary {
      background:linear-gradient(135deg,#8b5cf6,#6d28d9);
      color:white;
      border:none;
      border-radius:10px;
      font-weight:600;
      letter-spacing:.3px;
      padding:.8rem 1.3rem;
      transition:all .25s ease;
      cursor:pointer;
      display:inline-flex;
      align-items:center;
      justify-content:center;
      gap:.5rem;
    }
    .btn-primary:hover {
      transform:translateY(-2px);
      box-shadow:0 8px 25px rgba(139,92,246,.4);
    }

    .pretty-field .mat-mdc-text-field-wrapper {
      border-radius:12px!important;
      background:rgba(255,255,255,.07);
      border:1px solid rgba(255,255,255,.1);
      transition:border-color .2s ease, box-shadow .2s ease;
    }
    .pretty-field.mat-focused .mat-mdc-text-field-wrapper {
      background:rgba(255,255,255,.08);
      box-shadow:0 0 0 3px rgba(139,92,246,.25);
      border-color:rgba(139,92,246,.4);
    }
    .pretty-field .mat-mdc-input-element::placeholder {
      color:rgba(230,233,239,.7);
      font-family:'Space Grotesk',sans-serif;
      opacity:1;
    }

    .banner {
      display:flex;align-items:center;gap:.7rem;
      padding:.9rem 1rem;border-radius:12px;margin-bottom:1rem;
      border:1px solid;
      animation: slideIn .4s ease;
    }
    .banner.success{ background:rgba(34,197,94,.1);color:#4ade80;border-color:rgba(34,197,94,.4);}
    .banner.error{background:rgba(239,68,68,.1);color:#f87171;border-color:rgba(239,68,68,.4);}
    .muted{color:#9aa3b2;}

    .tips ul{margin:.6rem 0 0 1.1rem;color:#aab1c1;font-size:.95rem;}
    .tips li{margin-bottom:.35rem;}

    .ocr-row { display:flex; align-items:center; gap:.6rem; margin:.2rem 0 .8rem; }
    .ocr-row input[type="file"] { color:#cbd5e1; max-width:280px; }

    @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
    @keyframes slideIn{from{opacity:0;transform:translateY(-8px);}to{opacity:1;transform:translateY(0);}}
    @keyframes cardFade{from{opacity:0;transform:translateY(15px);}to{opacity:1;transform:translateY(0);}}
  `],
  template: `
  <div class="wrap">

    <!-- Success Banner -->
    <div *ngIf="status() === 'success'" class="banner success">
      <mat-icon>check_circle</mat-icon>
      <div>
        <div style="font-weight:600">Transfer Complete</div>
        <div class="muted">Your funds have been sent successfully.</div>
      </div>
      <span style="flex:1"></span>
      <button mat-icon-button (click)="status.set(null)"><mat-icon>close</mat-icon></button>
    </div>

    <!-- Error Banner -->
    <div *ngIf="status() === 'error'" class="banner error">
      <mat-icon>error</mat-icon>
      <div>
        <div style="font-weight:600">Transfer Failed</div>
        <div class="muted">{{ lastError() }}</div>
      </div>
      <span style="flex:1"></span>
      <button mat-icon-button (click)="status.set(null)"><mat-icon>close</mat-icon></button>
    </div>

    <div class="panel">
      <mat-card>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
          <div>
            <h2>New Transfer</h2>
            <p class="subtitle">Send funds instantly & securely.</p>
          </div>
          <button mat-icon-button matTooltip="Manage Devices" (click)="openDeviceManagement()">
            <mat-icon>security</mat-icon>
          </button>
        </div>

       

        <form [formGroup]="form" (ngSubmit)="submit()" autocomplete="off">
          <mat-form-field appearance="outline" class="pretty-field" style="width:100%;margin-bottom:1rem;">
            <mat-label>Recipient account number</mat-label>
            <input matInput formControlName="recipientAccountNumber" placeholder="">
            <mat-error *ngIf="r.invalid && r.touched">Please enter a valid account number.</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="pretty-field" style="width:100%;margin-bottom:1rem;">
            <mat-label>Amount (USD)</mat-label>
            <input matInput type="number" step="0.01" min="5" formControlName="amount" placeholder="">
            <mat-error *ngIf="a.invalid && a.touched">Enter a valid amount (min $5)</mat-error>
          </mat-form-field>

          <div style="display:flex;justify-content:flex-end;margin-top:1rem;">
            <button class="btn-primary" type="submit" [disabled]="form.invalid || loading()">
              <mat-spinner *ngIf="loading()" mode="indeterminate" diameter="18" strokeWidth="3"></mat-spinner>
              <span *ngIf="!loading()">Send Transfer</span>
              <span *ngIf="loading()">Sending...</span>
            </button>
          </div>
        </form>
      </mat-card>

      <mat-card class="tips">
        <h3 style="font-family:'Space Grotesk',sans-serif;font-weight:700;margin:0;">Quick Tips</h3>
        <ul>
          <li>Ensure the recipient’s account number is correct.</li>
          <li>Minimum transfer amount is 5 $.</li>
          <li>Transfers are encrypted & processed instantly.</li>
          <li>Keep your 2FA active for extra protection.</li>
        </ul>
      </mat-card>
    </div>
  </div>
  `
})
export class TransferComponent implements OnInit {
  form!: FormGroup;
  r!: FormControl<string>;
  a!: FormControl<number>;

  base = `${environment.apiBaseUrl}/transfers`;
  loading = signal(false);
  status = signal<'success' | 'error' | null>(null);
  lastError = signal<string>('');
  securityChecks = 0;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snack: MatSnackBar,
    private dialog: MatDialog,
    private activityService: ActivityService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      recipientAccountNumber: this.fb.control<string>('', [Validators.required, Validators.minLength(6)]),
      amount: this.fb.control<number | null>(null, [Validators.required, Validators.min(5)]) // min $5 to match UI tips
    });
    this.r = this.form.controls['recipientAccountNumber'] as FormControl<string>;
    this.a = this.form.controls['amount'] as FormControl<number>;
    this.performSecurityCheck();
  }

  openDeviceManagement(): void {
    this.dialog.open(DeviceManagementComponent);
  }

  private performSecurityCheck(): void {
    this.securityChecks++;
    this.activityService.logActivity({
      type: 'security_change',
      description: 'Security check performed',
      status: 'success'
    }).subscribe({ next: () => {}, error: () => {} });
  }

  // ------- Receipt OCR upload -------
  onReceipt(ev: Event) {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const token = localStorage.getItem('token');
    if (!token) {
      this.snack.open('Not authenticated', 'Close', { duration: 2000 });
      return;
    }
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const form = new FormData();
    form.append('file', file);

    this.http.post<any>(`${environment.apiBaseUrl}/receipts/ocr`, form, { headers }).subscribe({
      next: (data) => {
        if (data?.amount != null && !isNaN(+data.amount)) {
          this.a.setValue(Number(data.amount));
          this.a.markAsDirty();
          this.snack.open(`Detected $${Number(data.amount).toFixed(2)} ${data?.merchant ? 'at '+data.merchant : ''}`, 'Close', { duration: 2500 });
        } else {
          this.snack.open('Couldn’t detect an amount from the receipt', 'Close', { duration: 2500 });
        }
      },
      error: (err) => {
        const msg = err?.error?.error || 'OCR failed';
        this.snack.open(msg, 'Close', { duration: 3000 });
      }
    });
  }

  private uuidv4(): string {
    // Lightweight UUID for idempotency keys
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = crypto.getRandomValues(new Uint8Array(1))[0] & 15;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  submit(): void {
    if (this.form.invalid || this.loading()) return;

    const token = localStorage.getItem('token');
    if (!token) {
      this.snack.open('Not authenticated', 'Close', { duration: 2000 });
      return;
    }

    const idempKey = this.uuidv4();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'X-Idempotency-Key': idempKey
    });

    const body = {
      recipientAccountNumber: (this.r.value || '').trim(),
      amount: Number(this.a.value),
      securityChecksum: this.securityChecks
    };

    this.loading.set(true);
    this.http.post<any>(this.base, body, { headers }).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.status.set('success');

        this.activityService.logActivity({
          type: 'transfer',
          description: `Transfer of $${body.amount} to ${body.recipientAccountNumber}`,
          status: 'success',
          metadata: { amount: body.amount, recipient: body.recipientAccountNumber, transactionId: response?.id }
        }).subscribe({ next: () => {}, error: () => {} });

        this.form.reset();
      },
      error: (err) => {
        this.loading.set(false);
        this.status.set('error');
        const msg = err?.error?.message || err?.error?.error || 'Transfer failed';
        this.lastError.set(msg);

        this.activityService.logActivity({
          type: 'transfer',
          description: `Failed transfer of $${body.amount} to ${body.recipientAccountNumber}`,
          status: 'failed',
          metadata: { amount: body.amount, recipient: body.recipientAccountNumber, error: msg }
        }).subscribe({ next: () => {}, error: () => {} });
      }
    });
  }
}
