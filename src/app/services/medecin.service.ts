import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MedecinService {
  private apiUrl = 'http://localhost:5000/api/medecins'; // URL de votre API

  constructor(private http: HttpClient) { }

  // Ajoutez un paramètre `page` pour la pagination
  getMedecins(page: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}?page=${page}`);
  }

   // Méthode pour récupérer les détails d'un médecin par son ID
   getMedecinById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }
  getDocuments() {
    const user = JSON.parse(localStorage.getItem('currentUser')!);
    return this.http.get(`${this.apiUrl}/documents?userId=${user.id}`);
  }
}