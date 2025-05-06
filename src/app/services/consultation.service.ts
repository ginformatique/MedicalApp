import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConsultationService {
  private apiUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  getDoctorAppointments(medecinId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/medecins/${medecinId}/rendezvous`);
  }

  getDoctorConsultations(medecinId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/medecins/${medecinId}/consultations`);
  }

  createConsultation(consultationData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/consultations`, consultationData);
  }

  uploadDocument(patientId: string, file: File, metadata: any): Observable<any> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    formData.append('metadata', JSON.stringify(metadata));
    return this.http.post<any>(`${this.apiUrl}/patients/${patientId}/documents`, formData);
  }
}