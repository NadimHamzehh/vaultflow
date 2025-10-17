import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  standalone: true,
  selector: 'app-history',
  imports: [CommonModule, MatCardModule, MatChipsModule, DatePipe, DecimalPipe],
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
  `],
  template: `
    <div class="wrap">
      <mat-card class="card">
        <div class="head">
          <h2 style="margin:0">Transaction History</h2>
          <mat-chip-set>
            <mat-chip class="chip">Most recent first</mat-chip>
          </mat-chip-set>
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
  base = 'http://localhost:8080/api/me/transactions';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    this.http.get<any[]>(this.base, { headers }).subscribe({
      next: data => this.txns.set(data ?? []),
      error: err => console.error(err)
    });
  }
}
