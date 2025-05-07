import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, catchError, Observable, tap, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class MedecinService {
  private apiUrl = 'http://localhost:5000/api/medecins';
  private currentDoctorSubject = new BehaviorSubject<any>(null);
  currentDoctor$ = this.currentDoctorSubject.asObservable();

  constructor(private http: HttpClient, private authService: AuthService) {}

  getMedecins(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}`);
  }
  
  getMedecinById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`).pipe(
      tap(doctor => this.currentDoctorSubject.next(doctor))
    );
  }

  updateCreneauStatus(medecinId: string, heure: string, statut: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${medecinId}/creneaux`, { heure, statut });
  }

  searchMedecins(query: string, specialty?: string): Observable<any[]> {
    let params = new HttpParams().set('query', query);
    if (specialty) params = params.set('specialty', specialty);
    return this.http.get<any[]>(`${this.apiUrl}/search`, { params });
  }

  getSpecialties(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/medecins/specialties`);
  }
  
  updateMedecinProfile(medecinId: string, profileData: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${medecinId}`, profileData);
  }
 
  updateMedecin(id: string, updates: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, updates).pipe(
      tap(updatedDoctor => this.currentDoctorSubject.next(updatedDoctor))
    );
  }
  
  updateMedecinAvailability(medecinId: string, availabilityData: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${medecinId}/disponibilites`, availabilityData);
  }
  
  getMedecinAppointments(medecinId: string, dateFilter?: string): Observable<any[]> {
    let params = new HttpParams();
    if (dateFilter) params = params.set('date', dateFilter);
    return this.http.get<any[]>(`${this.apiUrl}/${medecinId}/rendezvous`, { params });
  }
  
  changePassword(medecinId: string, passwordData: { currentPassword: string, newPassword: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/${medecinId}/password`, passwordData);
  }

  addMedecin(medecinData: any): Observable<any> {
    const user = this.authService.getCurrentUser();
    if (!user || !user.id || !user.role) {
      console.error('User authentication failed:', user);
      return throwError(() => new Error('User not authenticated or missing id/role'));
    }
    const payload = {
      user: {
        id: user.id,
        role: user.role
      },
      medecin: medecinData // Ensure medecinData is wrapped correctly
    };
    console.log('Sending payload to backend:', JSON.stringify(payload, null, 2)); // Detailed logging
    return this.http.post(this.apiUrl, payload).pipe(
      catchError((error) => {
        console.error('Add doctor error:', error); // Line around 80
        const errorMsg = error.error?.message || error.message || 'Failed to add doctor';
        return throwError(() => new Error(errorMsg));
      })
    );
  }
}