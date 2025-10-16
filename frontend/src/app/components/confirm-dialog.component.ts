import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export interface ConfirmDialogData {
  title: string;
  message: string;
  action: string;
  type?: 'default' | 'warning' | 'danger';
}

@Component({
  standalone: true,
  selector: 'app-confirm-dialog',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div style="min-width:320px">
      <h2 style="margin:0 0 .5rem">{{data.title}}</h2>
      <p style="margin:0 0 1.5rem;color:var(--muted)">{{data.message}}</p>
      
      <div style="display:flex;justify-content:flex-end;gap:.5rem">
        <button mat-button (click)="close(false)" [disabled]="loading">Cancel</button>
        <button mat-flat-button
                [color]="getColor()"
                (click)="close(true)"
                [disabled]="loading">
          <mat-progress-spinner *ngIf="loading" 
                              mode="indeterminate" 
                              [diameter]="20">
          </mat-progress-spinner>
          <span *ngIf="!loading">{{data.action}}</span>
        </button>
      </div>
    </div>
  `
})
export class ConfirmDialogComponent {
  loading = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData,
    private dialogRef: MatDialogRef<ConfirmDialogComponent>
  ) {}

  getColor(): 'primary' | 'warn' {
    return this.data.type === 'danger' ? 'warn' : 'primary';
  }

  close(result: boolean) {
    this.dialogRef.close(result);
  }

  setLoading(state: boolean) {
    this.loading = state;
  }
}