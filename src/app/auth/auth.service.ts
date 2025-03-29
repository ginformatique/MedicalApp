import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Connexion via Google
  googleLogin(idToken: string): Observable<any> {
    // Assurez-vous que votre serveur peut traiter cette requête
    return this.http.post(`${this.apiUrl}/google-login`, { token: idToken });
  }
// New Logout method
logout(): Observable<any> {
  // This typically involves invalidating the token on the server
  const token = localStorage.getItem('token');
  return this.http.post(`${this.apiUrl}/logout`, { token });
}

  // Connexion standard par email et mot de passe
  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { email, password });
  }
}
