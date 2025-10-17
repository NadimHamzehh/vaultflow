import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-credit-card',
  imports: [CommonModule],
  styles: [`
    :host { display:block; }
    .card {
      width: 100%;
      color: #fff;
      border-radius: 18px;
      padding: 18px 20px;
      background: var(--premium-gradient);
      box-shadow: 0 24px 70px rgba(137,87,229,.28);
      border: 1px solid rgba(255,255,255,.15);
      position: relative; overflow:hidden;
    }
    .row { display:flex; align-items:center; justify-content:space-between; gap:10px; }
    .brand { font-weight:800; letter-spacing:.4px; }
    .chip { width:42px; height:28px; border-radius:6px; background: rgba(0,0,0,.25); border:1px solid rgba(255,255,255,.4); }
    .num { font: 700 20px/1.2 Inter, ui-sans-serif; letter-spacing: 2px; margin: 10px 0 6px; }
    .muted { color: rgba(255,255,255,.75); font-size: .86rem; }
    .name { font-weight:700; }
    .badge { position:absolute; right:16px; bottom:16px; padding:.2rem .5rem; border-radius:999px; background: rgba(0,0,0,.22); font-size:.8rem; }
  `],
  template: `
    <div class="card">
      <div class="row">
        <div class="brand">VaultFlow</div>
        <div class="chip"></div>
      </div>
      <div class="num">{{ maskedNumber }}</div>
      <div class="row">
        <div>
          <div class="muted">Card Holder</div>
          <div class="name">{{ name || '—' }}</div>
        </div>
        <div style="text-align:right">
          <div class="muted">Balance</div>
          <div class="name">\${{ (balance || 0) | number:'1.2-2' }}</div>
        </div>
      </div>
      <div class="badge">ACCT {{ accountNumber || '—' }}</div>
    </div>
  `
})
export class CreditCardComponent {
  @Input() name = '';
  @Input() accountNumber = '';
  @Input() number = ''; // optional “PAN” lookalike if you want
  @Input() balance = 0;

  get maskedNumber() {
    const n = this.number || (this.accountNumber ? this.accountNumber.replace(/\D/g,'').padStart(12,'0') : '');
    if (!n) return '**** **** **** ****';
    const m = n.replace(/\D/g,'').slice(-12).padStart(12,'0').replace(/(\d{4})(?=\d)/g,'$1 ');
    return '**** ' + m.slice(-9); // **** **** 1234 style
  }
}
