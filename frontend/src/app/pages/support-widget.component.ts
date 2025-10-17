import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Fuse from 'fuse.js';

type QA = { q: string; a: string; tags?: string[] };

@Component({
  standalone: true,
  selector: 'app-support-widget',
  imports: [CommonModule, FormsModule],
  styles: [`
    :host { position: fixed; right: 22px; bottom: 22px; z-index: 1200; }
    .fab {
      width: 56px; height: 56px; border-radius: 50%; border: none; cursor: pointer;
      background: var(--premium-gradient); color:#0b1020; display:grid; place-items:center;
      box-shadow: 0 16px 46px rgba(0,0,0,.45);
    }
    .panel {
      position: absolute; right: 0; bottom: 70px;
      width: min(360px, 92vw);
      background: var(--card-gradient);
      border: 1px solid var(--border-color);
      border-radius: 14px; box-shadow: 0 28px 80px rgba(0,0,0,.55);
      padding: 12px; transform-origin: bottom right;
    }
    .header { display:flex; align-items:center; justify-content:space-between; gap:8px; }
    .muted { color: var(--text-secondary); }
    .row { display:flex; align-items:flex-end; gap:8px; margin-top:8px; }
    textarea {
      flex:1; resize: none; min-height: 46px; max-height: 120px;
      background: var(--surface-1); color: var(--text);
      border: 1px solid var(--border-color); border-radius: 10px;
      padding: 8px 10px; outline: none;
    }
    .send { padding: .55rem .8rem; border:none; border-radius:10px; background: var(--accent-gradient); color:#fff; cursor:pointer; }
    .bubble { padding: .55rem .7rem; border-radius: 10px; margin-top: 8px; font-size: .95rem; }
    .me { background: rgba(137,87,229,.18); border: 1px solid rgba(137,87,229,.28); }
    .bot { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.10); }
    .contact { display:flex; flex-direction:column; gap:4px; margin-top:6px; font-size:.92rem; }
    .contact a { color: var(--accent); text-decoration: none; }
  `],
  template: `
    <button class="fab" (click)="toggleOpen()" aria-label="Support">?</button>

    <div class="panel" *ngIf="open()">
      <div class="header">
        <div>
          <div style="font-weight:700">Support</div>
          <div class="muted small">Bank email • phone • FAQ bot</div>
        </div>
        <button class="send" (click)="toggleOpen()">Close</button>
      </div>

      <div class="contact">
        <div>Email: <a href="mailto:support@vaultflow.local">support@vaultflow.local</a></div>
        <div>Phone: <a href="tel:+15550102222">+1 (555) 010-2222</a></div>
      </div>

      <div *ngFor="let m of messages()">
        <div class="bubble" [class.me]="m.role==='user'" [class.bot]="m.role==='bot'">{{ m.text }}</div>
      </div>

      <div class="row">
        <textarea
          [(ngModel)]="draft"
          placeholder="Ask about transfers, hours, cards…"
          (keydown.enter)="send()"
        ></textarea>
        <button class="send" (click)="send()">Send</button>
      </div>
    </div>
  `
})
export class SupportWidgetComponent {
  open = signal(false);
  draft = '';
  messages = signal<{ role: 'user'|'bot'; text: string }[]>([
    { role: 'bot', text: 'Hi! I’m your VaultFlow FAQ assistant. Ask me about banking, transfers, hours, cards, fees, and more.' }
  ]);

  private readonly faqs: QA[] = [
    { q: 'what time do you open', a: 'Our banking hours are Monday–Friday, 9:00 AM – 5:00 PM (local time).', tags: ['hours', 'open'] },
  { q: 'what time do you close', a: 'We close at 5:00 PM on weekdays. Closed on weekends and public holidays.', tags: ['hours', 'close'] },
  { q: 'how do i transfer money', a: 'Go to “Transfer” → enter recipient and amount → confirm. Transfers post instantly between VaultFlow accounts.', tags: ['transfer', 'send'] },
  { q: 'can i cancel a transfer', a: 'Internal transfers are instant and can’t be reversed. External transfers can be cancelled within 30 minutes from the “History” tab.', tags: ['cancel', 'transfer'] },
  { q: 'transfer limit', a: 'Standard users: $5,000 / day. Verified users: up to $25,000 / day. Larger limits available upon request.', tags: ['limit', 'daily limit'] },
  { q: 'how long do transfers take', a: 'Internal transfers are instant. External (ACH) transfers take 1–3 business days.', tags: ['duration', 'ach'] },
  { q: 'international transfers', a: 'Yes! International wires supported. FX fees may apply depending on country and currency.', tags: ['international', 'wire'] },
  { q: 'lost card', a: 'Freeze your card immediately in “Account → Card Controls”, then contact support for a replacement.', tags: ['lost', 'card', 'freeze'] },
  { q: 'stolen card', a: 'Freeze your card right away and report it to support@vaultflow.local. A new card will be shipped to your address.', tags: ['stolen', 'card'] },
  { q: 'fees', a: 'No maintenance fees. ATM withdrawals are free within our network; out-of-network fees vary by operator.', tags: ['fees'] },
  { q: 'forgot password', a: 'Use “Forgot Password?” on the login page. You’ll receive a secure reset link via email.', tags: ['password', 'reset'] },
  { q: 'how to change password', a: 'Go to Security → Change Password → follow the prompts to update it safely.', tags: ['change password'] },
  { q: 'two factor authentication', a: 'Enable 2FA under Security → Two-Factor. You can use Google Authenticator or SMS codes.', tags: ['2fa', 'security'] },
  { q: 'security advice', a: 'Never share your login details. Use strong passwords and enable Two-Factor Authentication for safety.', tags: ['security', 'tips'] },
  { q: 'how to contact support', a: 'You can email support@vaultflow.local or call +1 (555) 010-2222 for assistance.', tags: ['contact', 'help'] },
  { q: 'where can i view statements', a: 'Go to Account → Statements to download monthly transaction reports in PDF.', tags: ['statement', 'download'] },
  { q: 'how to update address', a: 'Head to Account → Personal Info and edit your address. Some changes may need ID verification.', tags: ['address', 'update'] },
  { q: 'failed transfer', a: 'Check that your balance covers the amount. If it still fails, retry later or contact support with the error message.', tags: ['failed', 'error', 'transfer'] },
  { q: 'how to add beneficiary', a: 'Add beneficiaries from Transfer → Manage Beneficiaries. Save frequent recipients for faster sending.', tags: ['beneficiary'] },
  { q: 'atm withdrawal limit', a: 'ATM withdrawals are capped at $800/day for standard users and $2,000/day for verified users.', tags: ['atm', 'limit'] },
  { q: 'card delivery', a: 'Physical cards arrive in 5–7 business days after approval. Virtual cards are active immediately.', tags: ['card', 'delivery'] },
  { q: 'mobile app', a: 'Yes! The VaultFlow mobile app is available on iOS & Android for easy account management.', tags: ['mobile', 'app'] },
  { q: 'downloading app', a: 'Search “VaultFlow” on App Store or Google Play. Login with your web credentials.', tags: ['app', 'download'] },
  { q: 'how to verify account', a: 'Submit ID and proof of address in the Verification page under Settings. Review takes 1–2 days.', tags: ['verify', 'kyc'] },
  { q: 'deposit money', a: 'You can deposit via linked bank account, debit card, or incoming transfer. Instant deposits supported for most cards.', tags: ['deposit', 'top up'] },
  { q: 'loan eligibility', a: 'VaultFlow offers personal loans to verified users with good history. Check the “Offers” tab if eligible.', tags: ['loan'] },
  ];

  private fuse = new Fuse(this.faqs, {
    includeScore: true,
    keys: ['q', 'tags'],
    threshold: 0.4,
    ignoreLocation: true
  });

  toggleOpen() { this.open.update(v => !v); }

  send() {
    const text = (this.draft || '').trim();
    if (!text) return;

    this.messages.update(arr => [...arr, { role: 'user', text }]);
    this.draft = '';

    const r = this.fuse.search(text, { limit: 1 })[0];
    const answer = r && r.score !== undefined && r.score <= 0.6
      ? r.item.a
      :  'Sorry, I couldn’t find an exact answer. You can explore: Transfers → Send Money, Account → Manage Card, or Security → Two-Factor Authentication.';

    this.messages.update(arr => [...arr, { role: 'bot', text: answer }]);
  }
}
