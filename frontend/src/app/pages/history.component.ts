import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
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

    /* Download buttons */
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

  // server endpoints we try first (may be absent)
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

  // --- CSV (server first, then client fallback) ---
  downloadCsv() {
    const token = localStorage.getItem('token');
    if (!token) { return; }
    const { year, month } = this.currentYm();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    const url = `${this.statementsBase}/${year}/${String(month).padStart(2,'0')}.csv`;
    this.http.get(url, { headers, responseType: 'blob' }).subscribe({
      next: (blob) => this.saveBlob(blob, `my-transactions-${year}-${String(month).padStart(2,'0')}.csv`),
      error: (_err: HttpErrorResponse) => {
        // Fallback: build CSV from loaded txns
        const csv = this.buildCsv(this.txns());
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        this.saveBlob(blob, `my-transactions-${year}-${String(month).padStart(2,'0')}.csv`);
      }
    });
  }

  // --- PDF (server first, then client fallback) ---
  exportPdf() {
    const token = localStorage.getItem('token');
    if (!token) { return; }
    const { year, month } = this.currentYm();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const body = { year, month };
    this.http.post(`${this.statementsBase}/pdf`, body, { headers, responseType: 'blob' }).subscribe({
      next: (blob) => this.saveBlob(blob, `my-transactions-${year}-${String(month).padStart(2,'0')}.pdf`),
      error: (_err: HttpErrorResponse) => {
        // Fallback: minimal client-side PDF (one page, simple text)
        const blob = this.buildSimplePdfBlob(`My Transactions — ${year}-${String(month).padStart(2, '0')}`, this.txns());
        this.saveBlob(blob, `my-transactions-${year}-${String(month).padStart(2,'0')}.pdf`);
      }
    });
  }

  // ---------- Helpers ----------
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

  private buildCsv(rows: any[]): string {
    const esc = (v: any) => {
      const s = v == null ? '' : String(v);
      // escape quotes and wrap if needed
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const header = ['ID', 'Sender', 'Recipient', 'Amount', 'Date'].join(',');
    const body = rows.map(r =>
      [r.id, r.senderAccount, r.recipientAccount, r.amount, new Date(r.createdAt).toISOString()]
        .map(esc).join(',')
    ).join('\n');
    return header + '\n' + body + '\n';
  }

  // Tiny PDF generator: one-page, simple text lines
  private buildSimplePdfBlob(title: string, rows: any[]): Blob {
    const lines: string[] = [];
    lines.push(title);
    lines.push(''); // spacer
    lines.push('ID | Sender -> Recipient | Amount | Date');
    lines.push('--------------------------------------------');

    // Keep it readable; cap to ~50 lines (avoid overflowing small pages)
    const maxLines = 50;
    for (let i = 0; i < rows.length && lines.length < maxLines; i++) {
      const r = rows[i];
      const date = new Date(r.createdAt).toLocaleString();
      lines.push(`${r.id} | ${r.senderAccount} -> ${r.recipientAccount} | ${Number(r.amount).toFixed(2)} | ${date}`);
    }
    if (rows.length > maxLines - 4) {
      lines.push(`...and ${rows.length - (maxLines - 4)} more`);
    }

    const escPdf = (s: string) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    const content =
      'BT\n' +
      '/F1 12 Tf\n' +
      '14 TL\n' +           // line height
      '40 780 Td\n' +       // start x,y
      lines.map(l => `(${escPdf(l)}) Tj T*\n`).join('') +
      'ET\n';

    const obj = (n: number, body: string) => `${n} 0 obj\n${body}\nendobj\n`;
    let pdf = '%PDF-1.4\n';
    const xref: number[] = [0];

    const add = (s: string) => { xref.push(pdf.length); pdf += s; };

    // 1: Catalog
    add(obj(1, '<< /Type /Catalog /Pages 2 0 R >>'));
    // 2: Pages
    add(obj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>'));
    // 3: Page
    add(obj(3, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>'));
    // 4: Contents
    const stream = `<< /Length ${content.length} >>\nstream\n${content}endstream\n`;
    add(obj(4, stream.trimEnd()));
    // 5: Font
    add(obj(5, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'));

    const xrefStart = pdf.length;
    pdf += `xref\n0 ${xref.length}\n`;
    pdf += '0000000000 65535 f \n';
    for (let i = 1; i < xref.length; i++) {
      pdf += (xref[i].toString().padStart(10, '0')) + ' 00000 n \n';
    }
    pdf += `trailer\n<< /Size ${xref.length} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

    return new Blob([pdf], { type: 'application/pdf' });
  }
}
