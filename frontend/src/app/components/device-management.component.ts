import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

interface Device {
  id: string;
  name: string;
  browser: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

@Component({
  standalone: true,
  selector: 'app-device-management',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule],
  template: `
    <div style="width:500px;padding:1.5rem">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
        <div>
          <h2 style="margin:0">Device Management</h2>
          <div class="small muted">Manage devices with access to your account</div>
        </div>
        <div class="status-dot success"></div>
      </div>

      <div *ngIf="loading" style="display:grid;place-items:center;padding:2rem">
        <mat-progress-spinner mode="indeterminate" [diameter]="40"></mat-progress-spinner>
      </div>

      <ng-container *ngIf="!loading">
        <div *ngFor="let device of devices" class="security-option" [class.enabled]="device.isCurrent" style="margin-bottom:.5rem">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div style="display:flex;gap:1rem;align-items:center">
              <mat-icon [style.color]="device.isCurrent ? 'var(--accent-2)' : 'var(--muted)'">
                {{ device.isCurrent ? 'computer' : 'devices' }}
              </mat-icon>

              <div>
                <div style="font-weight:500">{{ device.name }}</div>
                <div class="small muted">{{ device.browser }} • {{ device.location }}</div>
                <div class="small" [style.color]="device.isCurrent ? 'var(--accent-2)' : 'var(--muted)'">
                  {{ device.isCurrent ? 'Current Device' : ('Last active ' + device.lastActive) }}
                </div>
              </div>
            </div>

            <div>
              <button *ngIf="!device.isCurrent" mat-flat-button color="warn" [class.loading]="revokingId === device.id" (click)="revokeDevice(device)" [disabled]="!!revokingId">
                <mat-progress-spinner *ngIf="revokingId === device.id" mode="indeterminate" [diameter]="20"></mat-progress-spinner>
                <span *ngIf="revokingId !== device.id">Revoke</span>
              </button>
            </div>
          </div>
        </div>

        <div style="margin-top:2rem">
          <div style="font-weight:600;margin-bottom:.5rem">Security Tips</div>
          <div class="small muted" style="display:flex;flex-direction:column;gap:.5rem">
            <div>• Revoke access from devices you no longer use</div>
            <div>• Check locations match your login history</div>
            <div>• Enable 2FA for additional security</div>
          </div>
        </div>
      </ng-container>

      <div style="margin-top:2rem;display:flex;justify-content:flex-end">
        <button mat-button (click)="close()">Close</button>
      </div>
    </div>
  `
})
export class DeviceManagementComponent implements OnInit {
  loading = true;
  devices: Device[] = [];
  revokingId: string | null = null;

  constructor(
    private dialogRef: MatDialogRef<DeviceManagementComponent>,
    private http: HttpClient,
    private snack: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadDevices();
  }

  loadDevices() {
    this.loading = true;
    this.http.get<Device[]>('/api/me/security/devices').subscribe({
      next: (devices) => {
        this.devices = devices;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.snack.open('Could not load devices', 'Close', { duration: 3000 });
      }
    });
  }

  revokeDevice(device: Device) {
    this.revokingId = device.id;
    this.http.post(`/api/me/security/devices/${device.id}/revoke`, {}).subscribe({
      next: () => {
        this.revokingId = null;
        this.devices = this.devices.filter(d => d.id !== device.id);
        this.snack.open('Device access revoked', 'Close', { duration: 2000 });
      },
      error: (err) => {
        this.revokingId = null;
        this.snack.open(err?.error?.message || 'Could not revoke device', 'Close', { duration: 3000 });
      }
    });
  }

  close() {
    this.dialogRef.close();
  }
}