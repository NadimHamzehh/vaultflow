// src/app/components/support-widget.component.ts
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Fuse from 'fuse.js';

type QA = { q: string; a: string; tags?: string[] };
type ChatMsg = { role: 'user' | 'bot'; text: string };

@Component({
  standalone: true,
  selector: 'app-support-widget',
  imports: [CommonModule, FormsModule],
  styles: [`
    :host { position: fixed; right: 22px; bottom: 22px; z-index: 1200; }

    .fab {
      width: 56px; height: 56px; border-radius: 50%; border: none; cursor: pointer;
      background: var(--premium-gradient); color:#0b1020; display:grid; place-items:center;
      box-shadow: 0 16px 46px rgba(0,0,0,.45); font-weight: 800; font-size: 20px;
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

    .contact { display:flex; flex-direction:column; gap:4px; margin-top:6px; font-size:.92rem; }
    .contact a { color: var(--accent); text-decoration: none; }

    .messages { max-height: 260px; overflow:auto; margin-top: 8px; padding-right: 2px; }
    .bubble { padding: .55rem .7rem; border-radius: 10px; margin-top: 8px; font-size: .95rem; }
    .me  { background: rgba(137,87,229,.18); border: 1px solid rgba(137,87,229,.28); }
    .bot { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.10); }

    .row { display:flex; align-items:flex-end; gap:8px; margin-top:8px; }
    textarea {
      flex:1; resize: none; min-height: 46px; max-height: 120px;
      background: var(--surface-1); color: var(--text);
      border: 1px solid var(--border-color); border-radius: 10px;
      padding: 8px 10px; outline: none;
    }
    .hint { font-size: .8rem; color: var(--text-secondary); margin-top: 4px; }

    .btn {
      padding: .55rem .8rem; border:none; border-radius:10px;
      background: var(--accent-gradient); color:#fff; cursor:pointer;
    }
  `],
  template: `
    <!-- Floating action button -->
    <button class="fab" (click)="toggleOpen()" aria-label="Support">?</button>

    <!-- Panel -->
    <div class="panel" *ngIf="open()">
      <div class="header">
        <div>
          <div style="font-weight:700">Support</div>
        <div class="muted small">Bank email • phone • FAQ bot</div>
        </div>
        <button class="btn" (click)="toggleOpen()">Close</button>
      </div>

      <!-- Contact -->
      <div class="contact">
        <div>Email: <a href="mailto:support@vaultflow.local">support@vaultflow.local</a></div>
        <div>Phone: <a href="tel:+15550102222">+1 (555) 010-2222</a></div>
      </div>

      <!-- Chat -->
      <div class="messages" #msgs>
        <div *ngFor="let m of messages()">
          <div class="bubble" [class.me]="m.role==='user'" [class.bot]="m.role==='bot'">{{ m.text }}</div>
        </div>
      </div>

      <!-- Input -->
      <div class="row">
        <textarea
          [(ngModel)]="draft"
          placeholder="Ask about transfers, hours, cards…"
          (keydown.enter)="$event.preventDefault(); send()"
          (keydown.shift.enter)="$event.stopPropagation()"
        ></textarea>
        <button class="btn" (click)="send()">Send</button>
      </div>
      <div class="hint">Press Enter to send • Shift+Enter for a new line</div>
    </div>
  `
})
export class SupportWidgetComponent {
  open = signal(false);
  draft = '';
  messages = signal<ChatMsg[]>([
    { role: 'bot', text: 'Hi! I’m your VaultFlow FAQ assistant. Ask me about banking, transfers, hours, cards, fees, and more.' }
  ]);

  private readonly faqs: QA[] = [
    { q: 'what time do you open', a: 'We’re open Monday–Friday, 9:00 AM to 5:00 PM.', tags: ['hours', 'opening times', 'open time'] },
    { q: 'what time do you close', a: 'We close at 5:00 PM on weekdays. We’re closed on weekends and public holidays.', tags: ['hours', 'closing times', 'close time'] },
    { q: 'how do i transfer money', a: 'Go to Transfer → enter recipient and amount → confirm. Transfers post instantly between VaultFlow accounts.', tags: ['transfer', 'send money'] },
    { q: 'is there a transfer limit', a: 'Standard users can transfer up to $5,000 per day. Larger limits are available upon verification.', tags: ['limits', 'transfer limit'] },
    { q: 'how long do external transfers take', a: 'External ACH transfers typically take 1–3 business days.', tags: ['ach', 'external transfers', 'timing'] },
    { q: 'lost card', a: 'Freeze your card in the Account page immediately, then contact support to issue a replacement.', tags: ['card', 'lost', 'freeze'] },
    { q: 'fees', a: 'No monthly maintenance fee. ATM network withdrawals are free; out-of-network may incur a fee from the ATM owner.', tags: ['fees', 'atm'] },
    { q: 'international transfers', a: 'International wires are supported; fees and FX rates apply. Contact support for details.', tags: ['international', 'wire', 'fx'] },
    { q: 'two factor authentication', a: 'Enable 2FA in Security → Two-Factor for an extra layer of protection.', tags: ['2fa', 'security'] },
    { q: 'forgot password', a: 'Use the “Forgot password” link on the login page to reset securely.', tags: ['password', 'reset'] },
    { q: 'how to add a beneficiary', a: 'Currently, transfers use account numbers directly. Beneficiaries list is coming soon in Settings.', tags: ['beneficiary'] },
    { q: 'daily withdrawal limit', a: 'ATM withdrawals are limited to $800/day for standard users.', tags: ['atm limit'] },
    { q: 'how to view statements', a: 'Statements will be available under Account → Statements (feature rolling out).', tags: ['statements'] },
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

    const hit = this.fuse.search(text, { limit: 1 })[0];
    const answer = hit && hit.score !== undefined && hit.score <= 0.6
      ? hit.item.a
      : 'Here’s what I found: Transfers → send money; Account → card controls; Security → 2FA. Need a human? support@vaultflow.local.';

    this.messages.update(arr => [...arr, { role: 'bot', text: answer }]);
  }
}
