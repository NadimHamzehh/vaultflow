import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  standalone: true,
  selector: 'app-history',
  imports: [CommonModule],
  template: `
  <div class="card" style="max-width:800px; margin:3rem auto;">
    <h2>Transaction History</h2>
    <table style="width:100%; text-align:left; border-collapse:collapse;">
      <tr style="border-bottom:1px solid #30363d;">
        <th>ID</th><th>Sender</th><th>Recipient</th><th>Amount</th><th>Date</th>
      </tr>
      <tr *ngFor="let t of txns">
        <td>{{t.id}}</td>
        <td>{{t.senderAccount}}</td>
        <td>{{t.recipientAccount}}</td>
        <td>{{t.amount | number:'1.2-2'}}</td>
        <td>{{t.createdAt | date:'short'}}</td>
      </tr>
    </table>
  </div>
  `
})
export class HistoryComponent implements OnInit {
  txns: any[] = [];
  base = 'http://localhost:8080/api/me/transactions';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http.get<any[]>(this.base, { headers }).subscribe({
      next: data => this.txns = data,
      error: err => console.error(err)
    });
  }
}
