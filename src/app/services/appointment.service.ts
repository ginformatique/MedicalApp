import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private apiUrl = 'http://localhost:5000/api/rendezvous';
  private patientApiUrl = 'http://localhost:5000/api/patients';
  constructor(private http: HttpClient) {}

  createAppointment(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  // New method to fetch all appointments for a patient
  getPatientAppointments(patientId: string): Observable<any> {
    return this.http.get(`${this.patientApiUrl}/${patientId}/rendezvous`);
  }
  
  cancelAppointment(rendezvousId: string, patientId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${rendezvousId}/cancel`, { patientId });
  }
}