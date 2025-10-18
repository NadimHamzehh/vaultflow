// src/app/services/admin-statements.service.ts (new)
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminStatementsService {
  private base = `${environment.apiBaseUrl}/admin/statements`;
  constructor(private http: HttpClient) {}

  headers(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  downloadCsv(year: number, month: number) {
    return this.http.get(`${this.base}/${year}/${String(month).padStart(2,'0')}.csv`, {
      headers: this.headers(),
      responseType: 'blob'
    });
  }

  exportPdf(year: number, month: number, chartDataUrl?: string) {
    return this.http.post(`${this.base}/pdf`, { year, month, chartPngDataUrl: chartDataUrl || null }, {
      headers: this.headers().set('Content-Type','application/json'),
      responseType: 'blob'
    });
  }
}
