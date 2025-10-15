import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  template: `
  <div class="card" style="max-width:400px; margin:6rem auto; text-align:center;">
    <h2>VaultFlow Login</h2>
    <form (ngSubmit)="login()">
      <input placeholder="Username" [(ngModel)]="username" name="username" required>
      <input type="password" placeholder="Password" [(ngModel)]="password" name="password" required>
      <button type="submit">Login</button>
    </form>
    <p style="margin-top:1rem;">No account? 
      <a routerLink="/register" style="color:var(--accent)">Register here</a>
    </p>
  </div>
  `
})
export class LoginComponent {
  username = '';
  password = '';
  base = 'http://localhost:8080/api/auth';

  constructor(private http: HttpClient, private router: Router) {}

  login() {
    this.http.post<any>(`${this.base}/login`, { username: this.username, password: this.password })
      .subscribe({
        next: res => {
          localStorage.setItem('token', res.token);
          this.router.navigate(['/transfer']);
        },
        error: err => alert(err.error?.message || 'Login failed')
      });
  }
}
