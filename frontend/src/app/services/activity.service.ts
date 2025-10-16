import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ActivityLog {
  id: string;
  type: 'login' | 'transfer' | 'security_change' | 'device_revoked';
  description: string;
  ipAddress: string;
  location: string;
  timestamp: string;
  status: 'success' | 'failed';
  metadata?: Record<string, any>;
}

@Injectable({
  providedIn: 'root'
})
export class ActivityService {
  constructor(private http: HttpClient) {}

  logActivity(activity: Partial<ActivityLog>): Observable<ActivityLog> {
    return this.http.post<ActivityLog>('/api/me/activity', activity);
  }

  getActivityLogs(page = 0, limit = 20): Observable<{
    items: ActivityLog[];
    total: number;
  }> {
    return this.http.get<{items: ActivityLog[], total: number}>(
      `/api/me/activity?page=${page}&limit=${limit}`
    );
  }

  // Helper method to format activity for display
  formatActivity(activity: ActivityLog): string {
    const date = new Date(activity.timestamp);
    const timeStr = date.toLocaleTimeString();
    const dateStr = date.toLocaleDateString();
    
    return `${activity.description} • ${timeStr} ${dateStr}`;
  }

  // Helper to get icon for activity type
  getActivityIcon(type: ActivityLog['type']): string {
    switch(type) {
      case 'login': return 'login';
      case 'transfer': return 'paid';
      case 'security_change': return 'security';
      case 'device_revoked': return 'devices';
      default: return 'info';
    }
  }
}