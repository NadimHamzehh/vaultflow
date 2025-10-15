import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-register',
  imports: [CommonModule, FormsModule],
  template: `
  <div class="card" style="max-width:450px; margin:4rem auto;">
    <h2>Create Account</h2>
    <form (ngSubmit)="register()">
      <input placeholder="Username" [(ngModel)]="username" name="username" required>
      <input type="password" placeholder="Password" [(ngModel)]="password" name="password" required>
      <input placeholder="Account Number" [(ngModel)]="accountNumber" name="accountNumber" required>
      <input type="number" placeholder="Initial Balance" [(ngModel)]="initialBalance" name="initialBalance" required>
      <button type="submit">Register</button>
    </form>
    <p style="margin-top:1rem;"><a routerLink="/login" style="color:var(--accent)">Back to Login</a></p>
  </div>
  `
})
export class RegisterComponent {
  username = '';
  password = '';
  accountNumber = '';
  initialBalance = 0;
  base = 'http://localhost:8080/api/auth';

  constructor(private http: HttpClient, private router: Router) {}

  register() {
    this.http.post<any>(`${this.base}/register`, {
      username: this.username,
      password: this.password,
      accountNumber: this.accountNumber,
      initialBalance: this.initialBalance
    }).subscribe({
      next: _ => {
        alert('Registration successful!');
        this.router.navigate(['/login']);
      },
      error: err => alert(err.error?.message || 'Registration failed')
    });
  }
}
