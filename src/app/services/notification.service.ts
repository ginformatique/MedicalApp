import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface Notification {
  _id: string;
  patientId: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = 'http://localhost:5000/api/notifications';

  constructor(private http: HttpClient) {}

  getPatientNotifications(patientId: string): Observable<Notification[]> {
    return this.http.get<{ count: number; notifications: Notification[] }>(`${this.apiUrl}/patient/${patientId}`).pipe(
      map(response => {
        // Extract notifications array or return empty array
        const notifications = response?.notifications || [];
        // Remove duplicates based on _id
        const uniqueNotifications = Array.from(
          new Map(notifications.map(n => [n._id, n])).values()
        );
        return uniqueNotifications;
      }),
      catchError(error => {
        console.error('Error fetching notifications:', error);
        return of([]); // Return empty array on error
      })
    );
  }

  createNotification(patientId: string, message: string, type: string = 'Rappel'): Observable<any> {
    return this.http.post(this.apiUrl, {
      patientId,
      message,
      type
    });
  }

  markAsRead(notificationId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${notificationId}/read`, {});
  }

  markAllAsRead(notificationIds: string[]): Observable<any> {
    return this.http.patch(`${this.apiUrl}/mark-multiple-read`, { ids: notificationIds });
  }

  
}