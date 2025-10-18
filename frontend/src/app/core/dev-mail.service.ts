// src/app/core/dev-mail.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DevMailService {
  private readonly base = 'http://localhost:8080/api/dev';

  constructor(private http: HttpClient) {}

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  sendTestEmail(to: string): Observable<string> {
    const params = new HttpParams().set('to', to);
    return this.http.get(`${this.base}/email/test`, {
      headers: this.authHeaders(),
      params,
      responseType: 'text'
    });
  }

  // Optional: if you add more dev endpoints on the backend:
  triggerPasswordChanged(to: string): Observable<string> {
    const params = new HttpParams().set('to', to);
    return this.http.get(`${this.base}/email/password-changed`, {
      headers: this.authHeaders(),
      params,
      responseType: 'text'
    });
  }
}
