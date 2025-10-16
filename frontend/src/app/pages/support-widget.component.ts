import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  standalone: true,
  selector: 'app-support-widget',
  imports: [CommonModule, FormsModule, MatIconModule],
  styles: [`
    .vf-fab {
      position: fixed; right: 22px; bottom: 22px; z-index: 1100;
      width: 56px; height: 56px; border-radius: 50%; border: none; color: #fff;
      background: var(--premium-gradient); box-shadow: 0 16px 40px rgba(137,87,229,.35);
      display:flex; align-items:center; justify-content:center; cursor: pointer;
    }
    .vf-panel {
      position: fixed; right: 22px; bottom: 86px; z-index: 1100;
      width: min(360px, 92vw); border-radius: 14px; border: 1px solid rgba(255,255,255,.08);
      background: linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.015));
      box-shadow: 0 28px 80px rgba(0,0,0,.55); padding: 1rem;
      transition: transform .25s ease, opacity .25s ease;
    }
    .vf-panel.hidden { transform: translateY(12px); opacity: 0; pointer-events: none; }
    .vf-panel.visible { transform: translateY(0); opacity: 1; }

    .vf-btn {
      display:inline-flex; align-items:center; gap:.4rem; padding:.35rem .6rem;
      border:1px solid var(--border-color); border-radius: 10px;
      background: var(--surface-1); color: var(--text); text-decoration:none; cursor:pointer;
    }
    .vf-link { color: var(--accent); text-decoration: none; }
    .vf-row { display:flex; align-items:center; gap:.6rem; margin:.3rem 0; }

    .vf-chat {
      border:1px solid rgba(255,255,255,.08); border-radius:10px;
      background: var(--surface-1); padding:.6rem;
    }
    .vf-chat-history {
      max-height: 180px; overflow:auto; padding:.25rem;
      display:flex; flex-direction:column; gap:.35rem;
    }
    .vf-chat-msg {
      max-width:80%; padding:.5rem .65rem; border-radius:10px;
      background: rgba(255,255,255,.06);
    }
    .vf-chat-msg.me {
      background: var(--premium-gradient); color:#001; align-self:flex-end;
    }
    .vf-chat-input {
      flex:1; padding:.55rem .7rem; border-radius:8px;
      border:1px solid rgba(255,255,255,.08); background:transparent; color: var(--text);
      outline:none;
    }
  `],
  template: `
    <!-- Floating Action Button -->
    <button type="button" class="vf-fab" (click)="toggle()" aria-label="Open support">
      <mat-icon>support_agent</mat-icon>
    </button>

    <!-- Panel -->
    <div class="vf-panel" [class.visible]="open" [class.hidden]="!open" aria-live="polite">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.4rem;">
        <div style="font-weight:700;">Support</div>
        <button class="vf-btn" type="button" (click)="toggle()">
          <mat-icon>close</mat-icon> Close
        </button>
      </div>

      <div class="vf-row">
        <mat-icon>email</mat-icon>
        <a class="vf-link" [href]="'mailto:' + email">{{ email }}</a>
      </div>
      <div class="vf-row">
        <mat-icon>call</mat-icon>
        <a class="vf-link" [href]="'tel:' + phoneHref">{{ phone }}</a>
      </div>

      <div class="vf-chat" style="margin-top:.6rem;">
        <div class="small muted" style="margin-bottom:.25rem;">FAQ Assistant (coming soon)</div>

        <div class="vf-chat-history">
          <div class="vf-chat-msg">Hi! How can we help? A FAQ bot will be available here soon.</div>
          <div class="vf-chat-msg me" *ngFor="let m of messages">{{ m }}</div>
        </div>

        <div style="display:flex;gap:.4rem;margin-top:.5rem;">
          <input
            [(ngModel)]="draft"
            (keydown.enter)="send()"
            class="vf-chat-input"
            placeholder="Type your message…"
          />
          <button type="button" class="vf-btn" (click)="send()">
            <mat-icon>send</mat-icon>
          </button>
        </div>
      </div>
    </div>
  `
})
export class SupportWidgetComponent {
  /** Configure bank contact */
  @Input() email = 'support@vaultflow.bank';
  @Input() phone = '+1 (800) 123-4567';

  open = false;
  draft = '';
  messages: string[] = [];

  private storageKey = 'vf_support_chat';

  get phoneHref(): string {
    // Make tel: friendly format
    return this.phone.replace(/[^\d+]/g, '');
  }

  constructor() {
    // restore chat
    try {
      const raw = localStorage.getItem(this.storageKey);
      this.messages = raw ? JSON.parse(raw) : [];
    } catch {
      this.messages = [];
    }
  }

  toggle(): void { this.open = !this.open; }

  send(): void {
    const msg = (this.draft || '').trim();
    if (!msg) return;
    this.messages = [...this.messages, msg];
    this.draft = '';
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.messages));
    } catch {}
  }
}
