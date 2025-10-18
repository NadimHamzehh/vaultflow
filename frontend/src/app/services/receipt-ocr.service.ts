// src/app/services/receipt-ocr.service.ts (new)
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
@Injectable({ providedIn: 'root' })
export class ReceiptOcrService {
  private base = `${environment.apiBaseUrl}/receipts/ocr`;
  constructor(private http: HttpClient) {}

  private headers(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  analyze(file: File) {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<any>(this.base, form, { headers: this.headers() });
  }
}
