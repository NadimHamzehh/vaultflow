import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';

@Component({
  standalone: true,
  selector: 'app-change-password-dialog',
  imports: [CommonModule, MatDialogModule, MatButtonModule, FormsModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule],
  template: `
    <div style="width:400px;padding:1rem">
      <h2 style="margin-top:0">Change Password</h2>
      <p class="small muted">Enter your current password and choose a new secure password</p>

      <form (ngSubmit)="submit()" #form="ngForm">
        <mat-form-field appearance="fill" style="width:100%">
          <mat-label>Current Password</mat-label>
          <input matInput type="password" [(ngModel)]="currentPassword" name="current" required>
        </mat-form-field>

        <mat-form-field appearance="fill" style="width:100%">
          <mat-label>New Password</mat-label>
          <input matInput type="password" [(ngModel)]="newPassword" name="new" required
                 pattern="^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{8,}$">
          <mat-hint>At least 8 characters, one letter and one number</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="fill" style="width:100%">
          <mat-label>Confirm New Password</mat-label>
          <input matInput type="password" [(ngModel)]="confirmPassword" name="confirm" required>
        </mat-form-field>

        <div style="display:flex;justify-content:flex-end;gap:.5rem;margin-top:1rem">
          <button mat-button type="button" (click)="cancel()" [disabled]="loading">Cancel</button>
          <button mat-flat-button color="primary" type="submit" 
                  [disabled]="!form.valid || loading || newPassword !== confirmPassword"
                  class="btn-primary">
            <mat-progress-spinner *ngIf="loading" diameter="20" mode="indeterminate">
            </mat-progress-spinner>
            <span *ngIf="!loading">Update Password</span>
          </button>
        </div>
      </form>
    </div>
  `
})
export class ChangePasswordDialogComponent {
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  loading = false;

  constructor(
    private dialogRef: MatDialogRef<ChangePasswordDialogComponent>,
    private http: HttpClient
  ) {}

  submit() {
    if (this.newPassword !== this.confirmPassword) return;
    
    this.loading = true;
    this.http.post('/api/me/security/password', {
      currentPassword: this.currentPassword,
      newPassword: this.newPassword
    }).subscribe({
      next: () => {
        this.dialogRef.close(true);
      },
      error: err => {
        this.loading = false;
        // Surface error via dialog
        console.error('Password change failed:', err);
      }
    });
  }

  cancel() {
    this.dialogRef.close();
  }
}