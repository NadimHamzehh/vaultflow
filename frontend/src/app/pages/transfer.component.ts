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

@Component({
  standalone: true,
  selector: 'app-transfer',
  imports: [
    CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatCardModule, MatSnackBarModule, MatProgressSpinnerModule,
    MatIconModule, MatTooltipModule, MatDialogModule
  ],
  styles: [`
    .wrap { max-width: 980px; margin: 2.2rem auto; padding: 0 1rem; }
    .panel { display:grid; grid-template-columns:1fr 320px; gap:1rem; }
    .card { background: var(--card-gradient); border:1px solid var(--border-color); border-radius: var(--border-radius); padding:1.1rem; }
    .muted { color: var(--text-secondary); }
    .banner { display:flex; align-items:center; gap:.7rem; padding:.85rem 1rem; border-radius:12px; border:1px solid; margin-bottom: .9rem; }
    .banner.success{ background: var(--success-bg); color: var(--success); border-color: rgba(63,185,80,.3) }
    .banner.error  { background: var(--error-bg);   color: var(--error);   border-color: rgba(248,81,73,.3) }
    @media (max-width: 980px){ .panel{ grid-template-columns: 1fr; } }
  `],
  template: `
    <div class="wrap">
      <div *ngIf="status() === 'success'" class="banner success">
        <mat-icon>check_circle</mat-icon>
        <div>
          <div style="font-weight:600">Transfer Complete</div>
          <div class="muted">Your transfer has been processed successfully</div>
        </div>
        <span class="spacer" style="flex:1"></span>
        <button mat-icon-button (click)="status.set(null)"><mat-icon>close</mat-icon></button>
      </div>

      <div *ngIf="status() === 'error'" class="banner error">
        <mat-icon>error</mat-icon>
        <div>
          <div style="font-weight:600">Transfer Failed</div>
          <div class="muted">{{ lastError() }}</div>
        </div>
        <span class="spacer" style="flex:1"></span>
        <button mat-icon-button (click)="status.set(null)"><mat-icon>close</mat-icon></button>
      </div>

      <div class="panel">
        <mat-card class="card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.4rem">
            <div>
              <h2 style="margin:0">New Transfer</h2>
              <p class="muted" style="margin:.2rem 0 0">Send funds quickly and securely.</p>
            </div>
            <button mat-icon-button (click)="openDeviceManagement()" matTooltip="Manage Devices">
              <mat-icon>security</mat-icon>
            </button>
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()">
            <mat-form-field appearance="fill" style="width:100%">
              <mat-label>Recipient account number</mat-label>
              <input matInput formControlName="recipientAccountNumber" placeholder="e.g. ACCT2002">
            </mat-form-field>

            <mat-form-field appearance="fill" style="width:100%">
              <mat-label>Amount (USD)</mat-label>
              <input matInput type="number" step="0.01" min="0.01" formControlName="amount" placeholder="e.g. 100.00">
            </mat-form-field>

            <div style="display:flex;justify-content:flex-end;margin-top:.5rem">
              <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || loading()">
                <mat-spinner *ngIf="loading()" mode="indeterminate" diameter="18" strokeWidth="3" style="margin-right:.5rem"></mat-spinner>
                <span *ngIf="!loading()">Send transfer</span>
                <span *ngIf="loading()">Sending…</span>
              </button>
            </div>
          </form>
        </mat-card>

        <mat-card class="card">
          <h3 style="margin:0 0 .4rem">Quick tips</h3>
          <ul class="muted" style="margin:.2rem 0 0 1.1rem">
            <li>Ensure recipient account number is correct.</li>
            <li>Minimum transfer amount $0.01.</li>
            <li>Transfers are instant and secured.</li>
          </ul>
        </mat-card>
      </div>
    </div>
  `
})
export class TransferComponent implements OnInit {
  form!: FormGroup;
  // typed handles
  r!: FormControl<string>;
  a!: FormControl<number>;

  base = 'http://localhost:8080/api/transfers';
  loading = signal(false);
  status = signal<'success'|'error'|null>(null);
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
      amount: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)])
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

  submit(): void {
    if (this.form.invalid || this.loading()) return;

    const token = localStorage.getItem('token');
    if (!token) { this.snack.open('Not authenticated', 'Close', {duration: 2000}); return; }

    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const body = {
      recipientAccountNumber: this.r.value.trim(),
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
