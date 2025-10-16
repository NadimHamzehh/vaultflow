import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  standalone: true,
  selector: 'app-account',
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatTooltipModule, MatSnackBarModule],
  styles: [`
    .wrap { max-width: 860px; margin: 2.5rem auto; }
    .card {
      background: var(--card-gradient);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      overflow: hidden;
      position: relative;
    }
    .card::before { content:''; position:absolute; inset:0; background: var(--premium-gradient); opacity:.06; pointer-events:none; }
    .head { display:flex; align-items:center; justify-content:space-between; padding:1.1rem 1.25rem; border-bottom:1px solid var(--border-color); }
    .title { display:flex; align-items:center; gap:.6rem; font-weight:600; color:var(--text-primary); }
    .badge { font-size:.8rem; padding:.18rem .5rem; border-radius:999px; background:rgba(137,87,229,.12); border:1px solid rgba(137,87,229,.25) }
    .grid { display:grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; padding: 1.1rem 1.25rem; }
    .tile { background: rgba(255,255,255,.02); border:1px solid rgba(255,255,255,.06); border-radius:12px; padding: .9rem; }
    .k { color: var(--text-secondary); font-size:.88rem; }
    .v { color: var(--text-primary); font-weight:600; margin-top:.2rem; word-break: break-all; }
    .copy { display:inline-flex; align-items:center; gap:.25rem; opacity:.9; }
    .skeleton { height: 18px; border-radius: 8px; background: linear-gradient(90deg, rgba(255,255,255,.06), rgba(255,255,255,.12), rgba(255,255,255,.06));
                background-size: 200% 100%; animation: sh 1.2s linear infinite; }
    @keyframes sh { 0%{background-position: 200% 0} 100%{background-position: -200% 0} }
    @media (max-width: 900px){ .grid{ grid-template-columns: 1fr; } }
  `],
  template: `
    <div class="wrap">
      <mat-card class="card">
        <div class="head">
          <div class="title">
            <mat-icon>account_balance_wallet</mat-icon>
            <span>Account</span>
            <span class="badge">Verified</span>
          </div>
          <button mat-icon-button (click)="refresh()" matTooltip="Refresh">
            <mat-icon>refresh</mat-icon>
          </button>
        </div>

        <div class="grid" *ngIf="acc(); else loading">
          <div class="tile">
            <div class="k">Username</div>
            <div class="v">{{ acc()?.username }}</div>
          </div>
          <div class="tile">
            <div class="k">Account number</div>
            <div class="v">
              <span>{{ acc()?.accountNumber }}</span>
              <button class="copy" mat-icon-button matTooltip="Copy" (click)="copy(acc()?.accountNumber)">
                <mat-icon>content_copy</mat-icon>
              </button>
            </div>
          </div>
          <div class="tile">
            <div class="k">Available balance</div>
            <div class="v">$ {{ acc()?.balance | number:'1.2-2' }}</div>
          </div>
        </div>

        <ng-template #loading>
          <div class="grid">
            <div class="tile"><div class="k">Username</div><div class="skeleton" style="width:50%"></div></div>
            <div class="tile"><div class="k">Account number</div><div class="skeleton" style="width:70%"></div></div>
            <div class="tile"><div class="k">Available balance</div><div class="skeleton" style="width:40%"></div></div>
          </div>
        </ng-template>
      </mat-card>
    </div>
  `
})
export class AccountComponent implements OnInit {
  acc = signal<{username:string; accountNumber:string; balance:number} | null>(null);
  base = 'http://localhost:8080/api/me/account';

  constructor(private http: HttpClient, private snack: MatSnackBar) {}

  ngOnInit(){ this.refresh(); }

  refresh(){
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    this.acc.set(null);
    this.http.get<any>(this.base, { headers }).subscribe({
      next: d => this.acc.set(d),
      error: e => this.snack.open(e?.error?.message || 'Failed to load account', 'Close', {duration:2500})
    });
  }

  copy(v?: string){
    if (!v) return;
    navigator.clipboard?.writeText(v);
    this.snack.open('Account number copied', 'Close', {duration:1500});
  }
}
