import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MedecinService {
  private apiUrl = 'http://localhost:5000/api/medecins';

  constructor(private http: HttpClient) {}



  getMedecins(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}`);
  }
  getMedecinById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  updateCreneauStatus(medecinId: string, heure: string, statut: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${medecinId}/creneaux`, { heure, statut });
  }

  searchMedecins(query: string, specialty?: string): Observable<any[]> {
    let params = new HttpParams().set('query', query);
    if (specialty) {
      params = params.set('specialty', specialty);
    }
    return this.http.get<any[]>(`${this.apiUrl}/search`, { params });
  }
  getSpecialties(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/medecins/specialties`);
  }

}
  