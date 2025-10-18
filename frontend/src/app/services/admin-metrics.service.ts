import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface AdminMetrics {
  totalTransferred: number;
  newUsers: number;
  unusualCount: number;
  unusualSamples: Array<{ id: number; description: string; date: string }>;
  dailyTransfers?: number[];        // optional sparkline series
  dailyNewUsers?: number[];         // optional bar series
}

@Injectable({ providedIn: 'root' })
export class AdminMetricsService {
  private http = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/admin/metrics`;

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  /** Month-to-date metrics */
  fetchMonthToDate(fromISO: string, toISO: string) {
    return this.http.get<AdminMetrics>(`${this.base}?from=${fromISO}&to=${toISO}`, {
      headers: this.authHeaders()
    });
  }
}
