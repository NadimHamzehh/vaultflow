import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { LoginResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient) {}
  login(username: string, password: string) {
    return this.http.post<LoginResponse>(`${environment.apiBaseUrl}/api/auth/login`, { username, password });
  }
  register(payload: {username:string; password:string; initialDeposit?:string}) {
    return this.http.post(`${environment.apiBaseUrl}/api/auth/register`, payload);
  }
  saveToken(t: string) { localStorage.setItem('jwt', t); }
  logout() { localStorage.removeItem('jwt'); }
  token() { return localStorage.getItem('jwt'); }
  isLoggedIn() { return !!this.token(); }
}
