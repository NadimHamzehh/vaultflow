import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ActivityService, ActivityLog } from '../services/activity.service';

@Component({
  standalone: true,
  selector: 'app-activity-log',
  imports: [CommonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule, MatPaginatorModule],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Activity Log</mat-card-title>
        <mat-card-subtitle>Track your account activity</mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        <div *ngIf="loading" style="display:grid;place-items:center;padding:2rem">
          <mat-progress-spinner mode="indeterminate" [diameter]="40"></mat-progress-spinner>
        </div>

        <ng-container *ngIf="!loading">
          <div *ngFor="let activity of activities" 
               style="display:flex;align-items:center;padding:1rem;border-bottom:1px solid var(--border)"
               [style.background]="activity.status === 'failed' ? 'var(--error-bg)' : 'transparent'">
            <mat-icon [style.color]="activity.status === 'failed' ? 'var(--error)' : 'var(--accent-2)'">
              {{activityService.getActivityIcon(activity.type)}}
            </mat-icon>
            
            <div style="margin-left:1rem;flex:1">
              <div style="font-weight:500">{{activity.description}}</div>
              <div class="small muted">
                {{activity.location}} • {{activity.ipAddress}}
              </div>
            </div>

            <div class="small muted" style="text-align:right">
              {{formatDate(activity.timestamp)}}
            </div>
          </div>

          <mat-paginator 
            [length]="totalItems"
            [pageSize]="20"
            [hidePageSize]="true"
            (page)="onPageChange($event)">
          </mat-paginator>
        </ng-container>

        <div *ngIf="!loading && activities.length === 0" 
             style="text-align:center;padding:2rem;color:var(--muted)">
          No activity to display
        </div>
      </mat-card-content>
    </mat-card>
  `
})
export class ActivityLogComponent implements OnInit {
  activities: ActivityLog[] = [];
  loading = true;
  totalItems = 0;
  currentPage = 0;

  constructor(public activityService: ActivityService) {}

  ngOnInit() {
    this.loadActivities();
  }

  loadActivities() {
    this.loading = true;
    this.activityService.getActivityLogs(this.currentPage).subscribe({
      next: (response) => {
        this.activities = response.items;
        this.totalItems = response.total;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex;
    this.loadActivities();
  }

  formatDate(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleString();
  }
}