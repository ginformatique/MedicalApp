import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppointService {
  private apiUrl = 'http://localhost:5000/api'; // URL de base

  constructor(private http: HttpClient) { }

  getPatientAppointments(patientId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/patients/${patientId}/rendezvous`);
  }

  cancelAppointment(appointmentId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/rendezvous/${appointmentId}`);
  }

  createAppointment(appointmentData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/rendezvous`, appointmentData);
  }

  updateAppointment(appointmentId: string, updateData: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/rendezvous/${appointmentId}`, updateData);
  }
}