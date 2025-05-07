import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private apiUrl = 'http://localhost:5000/api'; // Adjust based on your Flask server

  constructor(private http: HttpClient) {}

  /**
   * Fetches doctors associated with a patient's appointments.
   * @param patientId The ID of the patient.
   * @returns Observable of an array of doctors.
   */
  getDoctorsFromAppointments(patientId: string): Observable<any[]> {
    if (!patientId || patientId === 'undefined') {
      return throwError(() => new Error('Patient ID invalide'));
    }
    const url = `${this.apiUrl}/patients/${patientId}/doctors-from-appointments`;
    return this.http.get<any[]>(url).pipe(
      map(response => Array.isArray(response) ? response : []),
      catchError(this.handleError('Erreur lors de la récupération des médecins'))
    );
  }

  /**
   * Uploads a document for a patient with associated metadata.
   * @param patientId The ID of the patient.
   * @param file The file to upload.
   * @param metadata Metadata for the document (type, description, tags, etc.).
   * @returns Observable of the server response.
   */
  uploadDocument(patientId: string, file: File, metadata: any): Observable<any> {
    if (!patientId || patientId === 'undefined') {
      return throwError(() => new Error('Patient ID invalide'));
    }
    if (!file) {
      return throwError(() => new Error('Aucun fichier sélectionné'));
    }
    const formData = new FormData();
    formData.append('file', file, file.name);
    formData.append('metadata', JSON.stringify(metadata));
    const url = `${this.apiUrl}/patients/${patientId}/documents`;
    return this.http.post(url, formData).pipe(
      catchError(this.handleError('Erreur lors de l\'envoi du document'))
    );
  }

  /**
   * Retrieves documents for a patient, optionally filtered by consultationId.
   * @param patientId The ID of the patient.
   * @param consultationId Optional consultation ID to filter documents.
   * @returns Observable of an array of documents.
   */
  getPatientDocuments(patientId: string, consultationId?: string | null): Observable<any[]> {
    if (!patientId || patientId === 'undefined') {
      return throwError(() => new Error('Patient ID invalide'));
    }
    let params = new HttpParams();
    if (consultationId && consultationId !== 'undefined') {
      params = params.set('consultationId', consultationId);
    }
    const url = `${this.apiUrl}/patients/${patientId}/documents`;
    return this.http.get<any[]>(url, { params }).pipe(
      map(response => Array.isArray(response) ? response : []),
      catchError(this.handleError('Erreur lors de la récupération des documents'))
    );
  }

  /**
   * Retrieves documents for a doctor.
   * @param doctorId The ID of the doctor.
   * @returns Observable of an array of documents.
   */
  getDoctorDocuments(doctorId: string): Observable<any[]> {
    if (!doctorId || doctorId === 'undefined') {
      return throwError(() => new Error('Doctor ID invalide'));
    }
    const url = `${this.apiUrl}/medecins/${doctorId}/documents`;
    return this.http.get<any[]>(url).pipe(
      map(response => Array.isArray(response) ? response : []),
      catchError(this.handleError('Erreur lors de la récupération des documents du médecin'))
    );
  }

  /**
   * Adds a note to a document.
   * @param documentId The ID of the document.
   * @param doctorId The ID of the doctor adding the note.
   * @param note The note content.
   * @returns Observable of the server response.
   */
  addDocumentNote(documentId: string, doctorId: string, note: string): Observable<any> {
    if (!documentId || documentId === 'undefined') {
      return throwError(() => new Error('Document ID invalide'));
    }
    if (!doctorId || doctorId === 'undefined') {
      return throwError(() => new Error('Doctor ID invalide'));
    }
    if (!note.trim()) {
      return throwError(() => new Error('Note vide'));
    }
    const url = `${this.apiUrl}/documents/${documentId}/notes`;
    const body = { doctorId, note };
    return this.http.patch(url, body).pipe(
      catchError(this.handleError('Erreur lors de l\'ajout de la note'))
    );
  }

  /**
   * Adds a tag to a document.
   * @param documentId The ID of the document.
   * @param doctorId The ID of the doctor adding the tag.
   * @param tag The tag content.
   * @returns Observable of the server response.
   */
  addDocumentTag(documentId: string, doctorId: string, tag: string): Observable<any> {
    if (!documentId || documentId === 'undefined') {
      return throwError(() => new Error('Document ID invalide'));
    }
    if (!doctorId || doctorId === 'undefined') {
      return throwError(() => new Error('Doctor ID invalide'));
    }
    if (!tag.trim()) {
      return throwError(() => new Error('Tag vide'));
    }
    const url = `${this.apiUrl}/documents/${documentId}/tags`;
    const body = { doctorId, tag };
    return this.http.patch(url, body).pipe(
      catchError(this.handleError('Erreur lors de l\'ajout du tag'))
    );
  }

  /**
   * Updates the status of a document.
   * @param documentId The ID of the document.
   * @param status The new status ('non consulté' or 'consulté').
   * @returns Observable of the server response.
   */
  updateDocumentStatus(documentId: string, status: string): Observable<any> {
    if (!documentId || documentId === 'undefined') {
      return throwError(() => new Error('Document ID invalide'));
    }
    if (!['non consulté', 'consulté'].includes(status)) {
      return throwError(() => new Error('Statut invalide'));
    }
    const url = `${this.apiUrl}/documents/${documentId}/status`;
    const body = { status };
    return this.http.patch(url, body).pipe(
      catchError(this.handleError('Erreur lors de la mise à jour du statut', { documentId, status }))
    );
  }

  /**
   * Retrieves details of a specific consultation.
   * @param consultationId The ID of the consultation.
   * @returns Observable of the consultation details.
   */
  getConsultation(consultationId: string): Observable<any> {
    if (!consultationId || consultationId === 'undefined') {
      return throwError(() => new Error('Consultation ID invalide'));
    }
    const url = `${this.apiUrl}/consultations/${consultationId}`;
    return this.http.get<any>(url).pipe(
      catchError(this.handleError('Erreur lors de la récupération de la consultation'))
    );
  }

  /**
   * Deletes a document by its ID.
   * @param documentId The ID of the document to delete.
   * @returns Observable of the server response.
   */
  deleteDocument(documentId: string): Observable<any> {
    if (!documentId || documentId === 'undefined') {
      return throwError(() => new Error('Document ID invalide'));
    }
    const url = `${this.apiUrl}/documents/${documentId}`;
    return this.http.delete(url).pipe(
      catchError(this.handleError('Erreur lors de la suppression du document'))
    );
  }

  /**
   * Handles HTTP errors and returns an Observable with the error message.
   * @param operation The operation that failed.
   * @param context Optional context data for debugging.
   * @returns A function to handle the error.
   */
  private handleError(operation: string, context?: any) {
    return (error: any): Observable<never> => {
      console.error(`${operation}:`, {
        error: error,
        context: context || {}
      });
      let errorMessage = 'Une erreur est survenue';
      if (error.error && error.error.error) {
        errorMessage = error.error.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      return throwError(() => new Error(errorMessage));
    };
  }
}