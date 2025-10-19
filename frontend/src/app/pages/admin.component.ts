import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { environment } from '../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-admin',
  imports: [CommonModule, FormsModule, MatCardModule, MatSnackBarModule],
  styles: [`
    :host { display:block; color:inherit; }

    .admin-card {
      max-width: 980px;
      margin: 2.5rem auto;
      padding: clamp(12px, 2.4vw, 20px);
      width: calc(100% - 24px);
    }

    .title {
      margin: 0 0 12px 0;
      font-weight: 700;
      font-size: clamp(20px, 2.4vw, 26px);
    }

    /* --- Transfer panel --- */
    .xfer {
      margin: 0 0 14px 0;
      padding: 12px;
      border: 1px solid var(--border-color, #30363d);
      border-radius: 12px;
      background: linear-gradient(180deg, rgba(255,255,255,.02), rgba(255,255,255,.01));
    }
    .xfer-title { font-weight:700; margin:0 0 8px 0; }
    .xfer-form {
      display: grid;
      grid-template-columns: 1.2fr .6fr 1fr auto;
      gap: 8px;
      align-items: end;
    }
    .x-input, .x-text {
      width: 100%;
      padding: .6rem .7rem;
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,.12);
      background: rgba(255,255,255,.04);
      color: inherit;
      outline: none;
    }
    .x-btn {
      white-space: nowrap;
      padding: .65rem .9rem;
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,.12);
      background: var(--accent-gradient, linear-gradient(135deg,#8b5cf6,#6d28d9));
      color: #fff;
      cursor: pointer;
    }
    .x-btn[disabled] { opacity:.6; cursor: default; }

    .table-wrap {
      overflow: auto;
      -webkit-overflow-scrolling: touch;
      border: 1px solid var(--border-color, #30363d);
      border-radius: 12px;
    }

    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      min-width: 640px; /* enables horizontal scroll on phones instead of squeezing */
    }

    thead tr th {
      text-align: left;
      font-weight: 700;
      padding: .75rem .9rem;
      position: sticky;
      top: 0;
      background: rgba(255,255,255,.04);
      backdrop-filter: blur(6px);
      border-bottom: 1px solid var(--border-color, #30363d);
    }

    tbody tr td {
      padding: .65rem .9rem;
      border-bottom: 1px solid rgba(255,255,255,.06);
      vertical-align: top;
      word-break: break-word; /* prevents overflow on very long account numbers */
    }
    tbody tr:last-child td { border-bottom: none; }

    /* Mobile niceties */
    @media (max-width: 560px){
      .admin-card { margin: 1.2rem auto; }
      .xfer-form { grid-template-columns: 1fr; }
      .x-btn { width: 100%; }
      table { min-width: 520px; }
      thead tr th, tbody tr td { padding: .6rem .75rem; }
    }
  `],
  template: `
  <mat-card class="admin-card">
    <h2 class="title">Admin Dashboard</h2>

    <!-- Transfer (admin) -->
    <div class="xfer" role="region" aria-label="Admin transfer">
      <div class="xfer-title">Transfer funds</div>
      <div class="xfer-form">
        <div>
          <label class="small" for="toAcct">Recipient account</label>
          <input id="toAcct" class="x-input" [(ngModel)]="toAccount" placeholder="ACCT12345678"/>
        </div>
        <div>
          <label class="small" for="amt">Amount</label>
          <input id="amt" class="x-input" type="number" step="0.01" min="0.01" [(ngModel)]="amount"/>
        </div>
        <div>
          <label class="small" for="ref">Reference (optional)</label>
          <input id="ref" class="x-input" [(ngModel)]="reference" placeholder="e.g. Adjustment"/>
        </div>
        <button class="x-btn" (click)="submitTransfer()" [disabled]="sending || !canSend()">Send</button>
      </div>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Username</th><th>Account</th><th>Balance</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let acc of accounts">
            <td>{{acc.username}}</td>
            <td>{{acc.accountNumber}}</td>
            <td>{{acc.balance | number:'1.2-2'}}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </mat-card>
  `
})
export class AdminComponent implements OnInit {
  accounts: any[] = [];
  base = `${environment.apiBaseUrl}/admin/accounts`;
  private xferUrl = `${environment.apiBaseUrl}/transfers`;

  // transfer model
  toAccount = '';
  amount: number | null = null;
  reference = '';
  sending = false;

  constructor(private http: HttpClient, private snack: MatSnackBar) {}

  ngOnInit() {
    this.loadAccounts();
  }

  private loadAccounts() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http.get<any[]>(this.base, { headers }).subscribe({
      next: data => this.accounts = data,
      error: err => console.error(err)
    });
  }

  canSend(): boolean {
    return !!this.toAccount?.trim() && !!this.amount && this.amount > 0;
  }

  submitTransfer() {
    if (!this.canSend() || this.sending) return;
    const token = localStorage.getItem('token');
    if (!token) { this.snack.open('Not authenticated', 'Close', { duration: 2000 }); return; }
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    const body = {
      recipientAccount: this.toAccount.trim(),
      amount: Number(this.amount),
      reference: this.reference?.trim() || undefined
    };

    this.sending = true;
    this.http.post(this.xferUrl, body, { headers }).subscribe({
      next: () => {
        this.sending = false;
        this.snack.open('Transfer completed', 'Close', { duration: 1800 });
        this.toAccount = ''; this.amount = null; this.reference = '';
        this.loadAccounts(); // refresh balances
      },
      error: (err) => {
        this.sending = false;
        const msg = err?.error?.message || 'Transfer failed';
        this.snack.open(msg, 'Close', { duration: 3000 });
      }
    });
  }
}
