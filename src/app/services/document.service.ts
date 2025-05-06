import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private apiUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  getPatientDocuments(patientId: string, consultationId: string | null = null): Observable<any> {
    if (!patientId) {
      throw new Error('Patient ID is required');
    }
    let url = `${this.apiUrl}/patients/${patientId}/documents`;
    if (consultationId) {
      url += `?consultationId=${consultationId}`;
    }
    return this.http.get(url);
  }

  getConsultation(consultationId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/consultations/${consultationId}`);
  }

  uploadDocument(patientId: string, file: File, metadata: any): Observable<any> {
    const formData = new FormData();
    formData.append('file', file, file.name);
    formData.append('metadata', JSON.stringify(metadata));
    return this.http.post(`${this.apiUrl}/patients/${patientId}/documents`, formData);
  }

  deleteDocument(documentId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/documents/${documentId}`);
  }

  getDoctors(): Observable<any> {
    return this.http.get(`${this.apiUrl}/medecins`);
  }
}