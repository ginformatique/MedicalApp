import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEvent, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private apiUrl = 'http://localhost:5000/api'; // Assurez-vous que c'est la bonne URL

  constructor(private http: HttpClient) { }

  getPatientDocuments(patientId: string): Observable<any> {
    if (!patientId) {
      throw new Error('Patient ID is required');
    }
    return this.http.get(`${this.apiUrl}/patients/${patientId}/documents`);
  }


  updateDocumentStatus(documentId: string, status: string): Observable<any> {
    if (!documentId || !status) {
      throw new Error('Document ID and status are required');
    }
    return this.http.patch(
      `${this.apiUrl}/documents/${documentId}/status`,
      { status },
      {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' })
      }
    );
  }


  uploadDocument(patientId: string, file: File, metadata: any): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('metadata', JSON.stringify(metadata)); // Bien sérialiser
    
    return this.http.post(`${this.apiUrl}/patients/${patientId}/documents`, formData, {
      reportProgress: true
    });
  }
  deleteDocument(documentId: string): Observable<any> {
    if (!documentId) {
      throw new Error('Document ID is required');
    }
    return this.http.delete(`${this.apiUrl}/documents/${documentId}`);
  }
}