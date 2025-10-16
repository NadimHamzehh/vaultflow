import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  standalone: true,
  selector: 'app-contact-panel',
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div class="contact-panel">
      <div style="display:flex;gap:.6rem;align-items:center;justify-content:flex-end">
        <button class="contact-button" (click)="open = !open">
          <mat-icon style="vertical-align:middle">support_agent</mat-icon>
          <span style="margin-left:.4rem;font-weight:600">Support</span>
        </button>
      </div>

      <div [class.open]="open" class="contact-card" style="margin-top:.6rem">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div style="font-weight:700">Contact VaultFlow</div>
          <div class="small muted">Support hours 9am–6pm</div>
        </div>
        <div style="margin-top:.8rem">
          <div class="contact-row"><mat-icon>info</mat-icon><div><div style="font-weight:600">About Us</div><div class="small muted">Secure banking since 2020</div></div></div>
          <div class="contact-row"><mat-icon>email</mat-icon><div><a href="mailto:support@vaultflow.example">support@vaultflow.example</a></div></div>
          <div class="contact-row"><mat-icon>phone</mat-icon><div><a href="tel:+15551234567">+1 (555) 123-4567</a></div></div>
        </div>
      </div>
    </div>
  `
})
export class ContactPanelComponent{
  open = false;
}
