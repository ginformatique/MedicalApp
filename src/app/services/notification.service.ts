import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = 'http://localhost:5000/api/notifications';

  constructor(private http: HttpClient) {}

  getPatientNotifications(patientId: string): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/patient/${patientId}`).pipe(
      map(response => {
        // Vérification approfondie de la réponse
        if (response && Array.isArray(response.notifications)) {
          return response.notifications;
        } else if (Array.isArray(response)) {
          return response;
        }
        return [];
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