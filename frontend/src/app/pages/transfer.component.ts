import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  standalone: true,
  selector: 'app-transfer',
  imports: [CommonModule, FormsModule],
  template: `
  <div class="card" style="max-width:450px; margin:4rem auto;">
    <h2>Funds Transfer</h2>
    <form (ngSubmit)="transfer()">
      <input placeholder="Recipient Account" [(ngModel)]="to" name="to" required>
      <input type="number" placeholder="Amount" [(ngModel)]="amount" name="amount" required>
      <button type="submit">Send</button>
    </form>
    <p style="margin-top:1rem;"><a routerLink="/history" style="color:var(--accent)">View History</a></p>
  </div>
  `
})
export class TransferComponent {
  to = '';
  amount = 0;
  base = 'http://localhost:8080/api/transfers';

  constructor(private http: HttpClient) {}

  transfer() {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http.post<any>(this.base, {
      recipientAccountNumber: this.to,
      amount: this.amount
    }, { headers }).subscribe({
      next: _ => alert('Transfer successful!'),
      error: err => alert(err.error?.message || 'Transfer failed')
    });
  }
}
