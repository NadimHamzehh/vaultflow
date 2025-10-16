import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';

@Component({
  standalone: true,
  selector: 'app-admin',
  imports: [CommonModule, MatCardModule],
  template: `
  <mat-card style="max-width:980px; margin:2.5rem auto;">
    <h2>Admin Dashboard</h2>
    <div style="overflow:auto">
      <table style="width:100%; border-collapse:collapse;">
        <tr style="border-bottom:1px solid #30363d;">
          <th>Username</th><th>Account</th><th>Balance</th>
        </tr>
        <tr *ngFor="let acc of accounts">
          <td>{{acc.username}}</td>
          <td>{{acc.accountNumber}}</td>
          <td>{{acc.balance | number:'1.2-2'}}</td>
        </tr>
      </table>
    </div>
  </mat-card>
  `
})
export class AdminComponent implements OnInit {
  accounts: any[] = [];
  base = 'http://localhost:8080/api/admin/accounts';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http.get<any[]>(this.base, { headers }).subscribe({
      next: data => this.accounts = data,
      error: err => console.error(err)
    });
  }
}
