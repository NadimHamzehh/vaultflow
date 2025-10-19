import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-history',
  imports: [CommonModule, MatCardModule, MatChipsModule, MatButtonModule, MatIconModule, DatePipe, DecimalPipe],
  styles: [`
    .wrap { max-width: 1060px; margin: 2.5rem auto; }
    .card { background: var(--card-gradient); border: 1px solid var(--border-color); border-radius: var(--border-radius); overflow: hidden; }
    .head { display:flex; justify-content:space-between; align-items:center; padding:1rem 1.25rem; border-bottom:1px solid var(--border-color); }
    .tbl { width:100%; border-collapse: collapse; }
    th, td { padding: .75rem 1rem; text-align: left; }
    th { color: var(--text-secondary); font-weight:500; border-bottom: 1px solid var(--border-color); }
    tr:not(:first-child) td { border-top: 1px solid rgba(255,255,255,.04); }
    tr:nth-child(odd) td { background: rgba(255,255,255,.02); }
    .amt-pos { color: var(--accent-2); font-weight:600; }
    .amt-neg { color: var(--danger); font-weight:600; }
    .chip { background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12); }
    .body { overflow:auto; }

    /* Added: small, reusable button styling like admin */
    .buttons { display:flex; gap:.5rem; align-items:center; }
    .btn {
      display:inline-flex; align-items:center; gap:.45rem;
      padding:.6rem .9rem; border:none; border-radius: var(--border-radius);
      background: var(--accent-gradient); color:#fff; cursor:pointer;
      transition: transform .18s, box-shadow .18s, filter .18s;
      white-space: nowrap;
    }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 12px 36px rgba(137,87,229,.18); }
  `],
  template: `
    <div class="wrap">
      <mat-card class="card">
        <div class="head">
          <h2 style="margin:0">Transaction History</h2>
          <!-- Added: user statements download buttons -->
          <div class="buttons">
            <button class="btn" (click)="downloadCsv()">
              <mat-icon>download</mat-icon> CSV
            </button>
            <button class="btn" (click)="exportPdf()">
              <mat-icon>picture_as_pdf</mat-icon> PDF
            </button>
          </div>
        </div>
        <div class="body">
          <table class="tbl">
            <thead>
              <tr>
                <th>ID</th>
                <th>Sender</th>
                <th>Recipient</th>
                <th>Amount</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let t of txns()">
                <td>{{ t.id }}</td>
                <td>{{ t.senderAccount }}</td>
                <td>{{ t.recipientAccount }}</td>
                <td [class.amt-pos]="t.amount>=0" [class.amt-neg]="t.amount<0">
                  {{ t.amount | number:'1.2-2' }}
                </td>
                <td>{{ t.createdAt | date:'short' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </mat-card>
    </div>
  `
})
export class HistoryComponent implements OnInit {
  txns = signal<any[]>([]);
  base = `${environment.apiBaseUrl}/me/transactions`;

  // Added: base for user statements (mirrors admin endpoints but under /me)
  private readonly statementsBase = `${environment.apiBaseUrl}/me/statements`;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    this.http.get<any[]>(this.base, { headers }).subscribe({
      next: data => this.txns.set(data ?? []),
      error: err => console.error(err)
    });
  }

  // --- Added: CSV/PDF download helpers (user-only) ---
  downloadCsv() {
    const token = localStorage.getItem('token');
    if (!token) return;
    const { year, month } = this.currentYm();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    const url = `${this.statementsBase}/${year}/${String(month).padStart(2,'0')}.csv`;
    this.http.get(url, { headers, responseType: 'blob' }).subscribe({
      next: (blob) => this.saveBlob(blob, `my-transactions-${year}-${String(month).padStart(2,'0')}.csv`),
      error: (err) => { console.error('CSV export failed', err); }
    });
  }

  exportPdf() {
    const token = localStorage.getItem('token');
    if (!token) return;
    const { year, month } = this.currentYm();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const body = { year, month }; // server can render user's PDF from auth context
    this.http.post(`${this.statementsBase}/pdf`, body, { headers, responseType: 'blob' }).subscribe({
      next: (blob) => this.saveBlob(blob, `my-transactions-${year}-${String(month).padStart(2,'0')}.pdf`),
      error: (err) => { console.error('PDF export failed', err); }
    });
  }

  private saveBlob(blob: Blob, filename: string) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  private currentYm() {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  }
}
