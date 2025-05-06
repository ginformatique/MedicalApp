import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RendezvousService {
  private apiUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  getAllRendezvous(medecinId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/medecins/${medecinId}/rendezvous`);
  }

  acceptRendezvous(medecinId: string, rendezvousId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/medecins/${medecinId}/rendezvous/${rendezvousId}/accept`, {});
  }

  rejectRendezvous(medecinId: string, rendezvousId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/medecins/${medecinId}/rendezvous/${rendezvousId}/reject`, {});
  }
}