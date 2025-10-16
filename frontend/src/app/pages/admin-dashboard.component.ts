// src/app/pages/admin-dashboard.component.ts
import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { SparklineComponent } from '../components/sparkline.component';

@Component({
  standalone: true,
  selector: 'app-admin-dashboard',
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    SparklineComponent
  ],
  styles: [`
    :host {
      display:block;
      min-height: 100dvh;
      background:
        radial-gradient(1200px 520px at 110% -10%, rgba(137,87,229,.10), transparent 65%),
        radial-gradient(1200px 520px at -10% 110%, rgba(236,72,153,.08), transparent 60%),
        linear-gradient(180deg, var(--bg-01), var(--bg-02));
      color: var(--text);
    }
    .wrap {
      max-width: 1440px;
      margin: 0 auto;
      padding: clamp(16px, 3vw, 32px);
      display: grid;
      gap: 16px;
    }

    .header { display:flex; align-items:center; justify-content:space-between; gap:12px; }
    .title { display:flex; align-items:center; gap:10px; }
    .title h1 { margin:0; font-size: clamp(22px, 2.6vw, 30px); font-weight:700; color: var(--text-primary); }
    .sub { color: var(--text-secondary); }

    /* Two rows: KPI row and a huge chart row */
    .grid {
      display:grid;
      grid-template-rows: auto 1fr;
      gap: 16px;
      min-height: calc(100dvh - 140px);
    }

    .kpis {
      display:grid;
      grid-template-columns: repeat(3, minmax(240px, 1fr));
      gap: 16px;
    }
    @media (max-width: 1024px) { .kpis { grid-template-columns: 1fr; } }

    .card {
      background: var(--card-gradient);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      box-shadow: 0 18px 60px rgba(0,0,0,.45);
      position: relative; overflow:hidden;
    }
    .card::before{
      content:''; position:absolute; inset:0;
      background: var(--premium-gradient); opacity:.07;
      pointer-events:none; -webkit-mask: linear-gradient(135deg, #000, transparent);
              mask: linear-gradient(135deg, #000, transparent);
    }
    .card-inner { padding: clamp(16px, 2.2vw, 24px); }

    .kpi {
      display:flex; align-items:center; justify-content:space-between;
      gap:12px; padding: 16px; border-radius: 12px;
      background: linear-gradient(180deg, rgba(255,255,255,.02), rgba(255,255,255,.01));
      border: 1px solid rgba(255,255,255,.06);
    }
    .k-left { display:flex; align-items:center; gap:12px; }
    .k-icon {
      width:46px; height:46px; border-radius:12px; display:grid; place-items:center;
      background: rgba(137,87,229,.12); border: 1px solid rgba(137,87,229,.28); color:#cdb6ff;
    }
    .k-title { color: var(--text-secondary); font-size:.92rem; }
    .k-value { font-size: clamp(20px, 2.4vw, 26px); font-weight: 800; }

    /* Big chart section */
    .chart-card { min-height: 420px; display:grid; }
    .chart-head {
      display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom: 8px;
    }
    .pill { display:inline-flex; align-items:center; gap:.4rem; padding:.3rem .65rem; border-radius:999px;
      background: rgba(137,87,229,.12); border: 1px solid rgba(137,87,229,.28); color: var(--text); font-size:.82rem; }
    .chart-body { display:grid; align-items:stretch; min-height: 360px; }
    app-sparkline { block-size: 100%; inline-size: 100%; }

    .btn {
      display:inline-flex; align-items:center; gap:.45rem;
      padding:.6rem .9rem; border:none; border-radius: var(--border-radius);
      background: var(--accent-gradient); color:#fff; cursor:pointer;
      transition: transform .18s, box-shadow .18s, filter .18s;
    }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 12px 36px rgba(137,87,229,.18); }
    .btn:disabled { opacity:.6; cursor:default; }
  `],
  template: `
    <div class="wrap">
      <div class="header">
        <div class="title">
          <mat-icon>admin_panel_settings</mat-icon>
          <div>
            <h1>Admin Dashboard</h1>
            <div class="sub">Month-to-date performance & activity</div>
          </div>
        </div>
        <button class="btn" (click)="refresh()" [disabled]="loading()">
          <mat-icon>refresh</mat-icon> Refresh
        </button>
      </div>

      <div class="grid">
        <!-- KPIs -->
        <div class="kpis">
          <div class="kpi">
            <div class="k-left">
              <div class="k-icon"><mat-icon>attach_money</mat-icon></div>
              <div>
                <div class="k-title">Total transferred ({{monthLabel()}})</div>
                <div class="k-value">\${{ totalTransferred() | number:'1.2-2' }}</div>
              </div>
            </div>
          </div>

          <div class="kpi">
            <div class="k-left">
              <div class="k-icon"><mat-icon>group_add</mat-icon></div>
              <div>
                <div class="k-title">New users ({{monthLabel()}})</div>
                <div class="k-value">{{ newUsers() | number }}</div>
              </div>
            </div>
          </div>

          <div class="kpi">
            <div class="k-left">
              <div class="k-icon"><mat-icon color="warn">warning</mat-icon></div>
              <div>
                <div class="k-title">Unusual activity ({{monthLabel()}})</div>
                <div class="k-value">{{ unusualCount() | number }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Big chart -->
        <mat-card class="card chart-card">
          <div class="card-inner">
            <div class="chart-head">
              <div>
                <div style="font-weight:700">Transfers trend</div>
                <div class="sub small">Daily movement this month</div>
              </div>
              <span class="pill"><mat-icon style="font-size:18px">show_chart</mat-icon> Live</span>
            </div>

            <div *ngIf="loading()" style="display:flex; align-items:center; gap:8px;">
              <mat-progress-spinner diameter="20" mode="indeterminate"></mat-progress-spinner>
              <span class="sub small">Loading metrics…</span>
            </div>

            <div *ngIf="!loading() && error()" style="color:var(--error)" class="small">
              {{ error() }}
            </div>

            <div class="chart-body" *ngIf="!loading() && !error()">
              <app-sparkline [values]="series()"></app-sparkline>
            </div>
          </div>
        </mat-card>
      </div>
    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  private readonly base = 'http://localhost:8080/api/admin/metrics';

  loading = signal(false);
  error   = signal<string | null>(null);

  totalTransferred = signal(0);
  newUsers         = signal(0);
  unusualCount     = signal(0);
  series           = signal<number[]>([]);

  monthLabel = computed(() => {
    const now = new Date();
    return now.toLocaleString(undefined, { month: 'long', year: 'numeric' });
  });

  constructor(
    private http: HttpClient,
    private router: Router,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void { this.fetchMetrics(); }

  refresh() { this.fetchMetrics(true); }

  private fetchMetrics(isRefresh = false) {
    const token = localStorage.getItem('token');
    if (!token) { this.router.navigate(['/login']); return; }

    const { from, to } = this.currentMonthRange();
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const params  = new HttpParams().set('from', from).set('to', to);

    this.loading.set(true);
    this.error.set(null);

    this.http.get<any>(this.base, { headers, params }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.totalTransferred.set(Number(res?.totalTransferred || 0));
        this.newUsers.set(Number(res?.newUsers || 0));
        this.unusualCount.set(Number(res?.unusualActivity || 0));

        this.series.set(Array.isArray(res?.dailyTransfers) && res.dailyTransfers.length
          ? res.dailyTransfers
          : this.fakeSeries());

        if (isRefresh) this.snack.open('Metrics refreshed', 'Close', { duration: 1500 });
      },
      error: (err) => {
        this.loading.set(false);
        if (err?.status === 403) {
          this.error.set('Forbidden (need ADMIN role).');
          this.snack.open('Admin access required', 'Close', { duration: 2000 });
          this.router.navigate(['/app']);
          return;
        }
        this.error.set(err?.error?.message || 'Failed to load admin metrics');
      }
    });
  }

  private currentMonthRange() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const fmt = (d: Date) => d.toISOString().slice(0,10);
    return { from: fmt(start), to: fmt(end) };
  }

  private fakeSeries(): number[] {
    const days = new Date().getDate();
    let v = 1000;
    return Array.from({ length: days }, () => {
      v += Math.round((Math.random() - 0.3) * 150);
      return Math.max(200, v);
    });
  }
}
