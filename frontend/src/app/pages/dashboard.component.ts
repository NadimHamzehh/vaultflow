import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
// Import MatSnackBar for a better user experience when copying the account number
import { MatSnackBar } from '@angular/material/snack-bar';

type Account = { username: string; accountNumber: string; balance: number };
type Txn = { id: number; senderAccount: string; recipientAccount: string; amount: number; createdAt: string };

@Component({
  standalone: true,
  selector: 'app-dashboard',
  // Added MatSnackBarModule to imports, though it's typically provided at the root/module level
  // Since it's a standalone component, we need to ensure all required modules are here.
  imports: [CommonModule, FormsModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule],
  styles: [`
    /* keep styles very small & safe; anything fancy should live in global styles.css */
    .grid-hero {
      display: grid; grid-template-columns: 1.2fr .8fr; gap: 1rem; align-items: center;
    }
    .grid-main {
      display: grid; grid-template-columns: 1.2fr .8fr; gap: 1rem;
    }
    .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: .8rem; }
    .btn {
      display:inline-flex; align-items:center; gap:.4rem; padding:.55rem .9rem;
      border:1px solid var(--border-color); border-radius: var(--border-radius);
      background: var(--surface-1); color: var(--text); text-decoration:none; cursor:pointer;
    }
    .fab {
      position: fixed; right: 22px; bottom: 22px; z-index: 1100;
      width: 56px; height: 56px; border-radius: 50%; border: none; color: #fff;
      background: var(--premium-gradient); box-shadow: 0 16px 40px rgba(137,87,229,.35); cursor: pointer;
      display:flex; align-items:center; justify-content:center;
    }
    .support {
      position: fixed; right: 22px; bottom: 86px; z-index: 1100;
      width: min(360px, 92vw); border-radius: 14px; border: 1px solid rgba(255,255,255,.08);
      background: linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.015));
      box-shadow: 0 28px 80px rgba(0,0,0,.55); padding: 1rem;
      transition: transform .25s ease, opacity .25s ease;
    }
    .support.hidden { transform: translateY(12px); opacity: 0; pointer-events: none; }
    .support.visible { transform: translateY(0); opacity: 1; }
    .h1 {
      font-size: clamp(1.8rem,3.2vw,2.4rem); font-weight: 800; line-height: 1.1;
    }
    .txn-item {
      display:flex; justify-content:space-between; align-items:center;
      padding:.6rem; border-radius:10px; border:1px solid rgba(255,255,255,0.06);
      background: linear-gradient(180deg, transparent, rgba(255,255,255,0.02)); margin:.4rem 0;
    }
    .card-title { font-weight: 700; margin-bottom: .5rem; }
    .pill {
      font-weight:800; background: rgba(0,0,0,.22); padding:.35rem .6rem; border-radius: 8px;
    }
    .virtual-card {
      width: min(520px, 100%); border-radius: 18px; color: #fff;
      padding: 1.2rem 1.4rem; background: var(--premium-gradient);
      box-shadow: 0 24px 70px rgba(137,87,229,.3); border: 1px solid rgba(255,255,255,.18);
    }
  `],
  template: `
  <section style="width:100%;border-bottom:1px solid var(--border-color);background:linear-gradient(180deg,var(--bg-01),var(--bg-02));">
    <div class="app-container" style="padding:2rem 1rem;">
      <div class="grid-hero">
        <div>
          <div class="h1">
            Explore your <span style="background:var(--premium-gradient);-webkit-background-clip:text;background-clip:text;color:transparent;">money</span> with confidence
          </div>
          <div class="small" style="margin-top:.6rem;color:var(--text-secondary);max-width:62ch;">
            Secure, modern banking. Real-time balances, instant transfers, and a clear view of your finances.
          </div>
          <div style="display:flex;gap:.6rem;margin-top:1rem;flex-wrap:wrap;">
            <a class="btn-primary" routerLink="/app/transfer"><mat-icon>send</mat-icon> New Transfer</a>
            <a class="btn" routerLink="/app/history"><mat-icon>history</mat-icon> History</a>
            <a class="btn" routerLink="/app/security"><mat-icon>shield</mat-icon> Security</a>
          </div>
        </div>

        <div style="display:flex;justify-content:center;">
          <div class="virtual-card" aria-label="Your virtual card">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <div style="font-weight:800;letter-spacing:.4px;">VaultFlow</div>
              <div style="width:44px;height:32px;border-radius:6px;background:linear-gradient(180deg,#e2e2e2,#b8b8b8);"></div>
            </div>
            <div style="font-size:1.3rem;letter-spacing:.12rem;margin:1rem 0 .35rem;font-weight:700;">
              {{ maskedAccountText }}
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.6rem;">
              <div>
                <div class="small" style="opacity:.9;letter-spacing:.06rem;text-transform:uppercase;">Cardholder</div>
                <div style="font-weight:600;">{{ displayNameText }}</div>
              </div>
              <div>
                <div class="small" style="opacity:.9;letter-spacing:.06rem;text-transform:uppercase;">Balance</div>
                <div class="pill">
                  \${{ (account?.balance ?? 0) | number:'1.2-2' }}
                </div>
              </div>
            </div>
            <div class="small" style="margin-top:.6rem;opacity:.9;">
              {{ account?.accountNumber || 'ACCT••••••' }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="app-container" style="padding:1rem 1rem 3rem;">
    <div class="grid-main">
      <div>
        <div class="grid-3">
          <div class="card">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:.6rem;">
              <div>
                <div class="small muted">Available Balance</div>
                <div style="font-size:1.6rem;font-weight:800;">
                  \${{ (account?.balance ?? 0) | number:'1.2-2' }}
                </div>
              </div>
              <div class="small muted" style="text-align:right;">Last 30 days</div>
            </div>
          </div>

          <div class="card">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:.6rem;">
              <div>
                <div class="small muted">Account</div>
                <div style="font-weight:700;">{{ account?.accountNumber || '—' }}</div>
              </div>
              <button class="btn" type="button" (click)="copyAcc()">
                <mat-icon>content_copy</mat-icon> Copy
              </button>
            </div>
          </div>

          <div class="card">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:.6rem;">
              <div>
                <div class="small muted">Transfers (today)</div>
                <div style="font-weight:800;">{{ transfersToday }}</div>
              </div>
              <a class="btn" routerLink="/app/transfer"><mat-icon>north_east</mat-icon> Send</a>
            </div>
          </div>
        </div>

        <div class="card" style="margin-top:1rem;">
          <div class="card-title">Recent transactions</div>
          <div *ngIf="txns.length === 0" class="small muted">No transactions yet.</div>
          <div *ngFor="let t of txns" class="txn-item">
            <div>
              <div style="font-weight:600;">
                {{ t.senderAccount === account?.accountNumber ? 'To' : 'From' }}
                {{ t.senderAccount === account?.accountNumber ? t.recipientAccount : t.senderAccount }}
              </div>
              <div class="small muted">{{ t.createdAt | date:'medium' }}</div>
            </div>
            <div [style.color]="t.senderAccount === account?.accountNumber ? 'var(--danger)' : 'var(--accent-2)'" style="font-weight:700;">
              {{ t.senderAccount === account?.accountNumber ? '-' : '+' }}\${{ t.amount | number:'1.2-2' }}
            </div>
          </div>
        </div>
      </div>

      <div>
        <div class="card-title">Premium tools</div>
        <div style="display:grid;gap:.8rem;">
          <div class="premium-card" style="display:flex;gap:.8rem;align-items:flex-start;">
            <div class="premium-icon">AI</div>
            <div>
              <div style="font-weight:700;">Anomaly detection</div>
              <div class="small muted">We’ll flag unusual spending patterns to help you stay safe.</div>
            </div>
          </div>
          <div class="premium-card" style="display:flex;gap:.8rem;align-items:flex-start;">
            <div class="premium-icon"><mat-icon>insights</mat-icon></div>
            <div>
              <div style="font-weight:700;">Spending Insights</div>
              <div class="small muted">Understand where your money goes with a clean monthly view.</div>
            </div>
          </div>
          <div class="premium-card" style="display:flex;gap:.8rem;align-items:flex-start;">
            <div class="premium-icon"><mat-icon>schedule</mat-icon></div>
            <div>
              <div style="font-weight:700;">Scheduled Transfers</div>
              <div class="small muted">Automate routine payments with rock-solid reliability.</div>
            </div>
          </div>
        </div>

        <!-- Shortcuts card removed as requested -->
      </div>
    </div>
  </section>

  <button type="button" class="fab" (click)="toggleSupport()" aria-label="Open support">
    <mat-icon>support_agent</mat-icon>
  </button>

  <div class="support" [class.visible]="supportVisible" [class.hidden]="!supportVisible" aria-live="polite">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.4rem;">
      <div style="font-weight:700;">Support</div>
      <button class="btn" type="button" (click)="toggleSupport()" style="padding:.3rem .5rem;">
        <mat-icon>close</mat-icon> Close
      </button>
    </div>

    <div style="display:flex;align-items:center;gap:.6rem;margin:.3rem 0;">
      <mat-icon>email</mat-icon>
      <a href="mailto:support@vaultflow.bank">support@vaultflow.bank</a>
    </div>
    <div style="display:flex;align-items:center;gap:.6rem;margin:.3rem 0;">
      <mat-icon>call</mat-icon>
      <a href="tel:+18001234567">+1 (800) 123-4567</a>
    </div>

    <div style="margin-top:.6rem;border:1px solid rgba(255,255,255,.08);border-radius:10px;background:var(--surface-1);padding:.6rem;">
      <div style="max-height:180px;overflow:auto;padding:.25rem;display:flex;flex-direction:column;gap:.35rem;">
        <div style="max-width:80%;padding:.5rem .65rem;border-radius:10px;background:rgba(255,255,255,.06);">
          Hi! How can we help? A FAQ assistant is coming soon.
        </div>
        <div *ngFor="let m of chatMessages" style="max-width:80%;padding:.5rem .65rem;border-radius:10px;background:var(--premium-gradient);color:#001;align-self:flex-end;">
          {{ m }}
        </div>
      </div>
      <div style="display:flex;gap:.4rem;margin-top:.5rem;">
        <input
          [(ngModel)]="chatDraft"
          (keydown.enter)="sendChat()"
          placeholder="Type your message…"
          style="flex:1;padding:.55rem .7rem;border-radius:8px;border:1px solid rgba(255,255,255,.08);background:transparent;color:var(--text);outline:none;"
        />
        <button type="button" class="btn-primary" (click)="sendChat()"><mat-icon>send</mat-icon></button>
      </div>
    </div>
  </div>
  `
})
export class DashboardComponent implements OnInit {
  private apiAccount = 'http://localhost:8080/api/me/account';
  private apiTxns = 'http://localhost:8080/api/me/transactions';

  account: Account | null = null;
  displayNameText = 'User';
  maskedAccountText = 'ACCT••••••';

  txns: Txn[] = [];
  transfersToday = 0;

  supportVisible = false;
  chatMessages: string[] = [];
  chatDraft = '';

  // Injected MatSnackBar
  constructor(private http: HttpClient, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    if (!token) return;
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http.get<Account>(this.apiAccount, { headers }).subscribe({
      next: (d) => {
        this.account = d;
        this.displayNameText = this.toTitle(d.username);
        this.maskedAccountText = this.maskAccount(d.accountNumber);
      },
      error: (e) => console.error('Error fetching account:', e)
    });

    this.http.get<Txn[]>(this.apiTxns, { headers }).subscribe({
      next: (list) => {
        // Ensure the response is an array before assignment
        this.txns = Array.isArray(list) ? list : [];
        const today = new Date().toDateString();
        // The logic for transfersToday is correct, assuming 'createdAt' is a valid date string
        this.transfersToday = this.txns.filter(t => new Date(t.createdAt).toDateString() === today).length;
      },
      error: (e) => console.error('Error fetching transactions:', e)
    });
  }

  private toTitle(n: string): string {
    if (!n) return 'User';
    // The original regex is correct for title-casing words
    return n.replace(/\w\S*/g, s => s[0].toUpperCase() + s.slice(1).toLowerCase());
  }

  private maskAccount(raw: string): string {
    if (!raw) return 'ACCT••••••';
    // This logic is complex but assumes a pattern like 'ACCT12345678' -> 'ACCT •••••• 78'
    const prefix = raw.replace(/[^A-Za-z].*$/, '');
    const digits = raw.replace(/^[A-Za-z]+/, '');
    if (digits.length <= 2) return raw;
    const star = '•'.repeat(Math.max(0, digits.length - 2));
    // Fixed: added logic to handle cases where there is no alphabetic prefix
    const prefixSpace = prefix ? prefix + ' ' : '';
    return `${prefixSpace}${star} ${digits.slice(-2)}`;
  }

  /**
   * Copies the account number to the clipboard and shows a confirmation message.
   * Fixes the TypeScript error on 'navigator.clipboard'.
   */
  copyAcc(): void {
    const acct = this.account?.accountNumber;
    if (!acct) return;

    // Type assertion to 'any' or check for 'clipboard' existence on 'navigator'
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(acct)
        .then(() => {
          this.snackBar.open('Account number copied!', 'Dismiss', { duration: 3000 });
        })
        .catch((e) => {
          console.error('Copy failed:', e);
          // Fallback or error message, though usually permissions are the issue
          this.snackBar.open('Could not copy account number.', 'Dismiss', { duration: 3000 });
        });
    } else {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = acct;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      this.snackBar.open('Account number copied (fallback)!', 'Dismiss', { duration: 3000 });
    }
  }

  toggleSupport(): void { this.supportVisible = !this.supportVisible; }

  sendChat(): void {
    const msg = (this.chatDraft || '').trim();
    if (!msg) return;
    this.chatMessages = [...this.chatMessages, msg];
    this.chatDraft = '';
  }
}
