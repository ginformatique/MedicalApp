import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';

export interface Patient {
  password: any;
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  patientId: string;
  dateOfBirth?: string;
  address?: string;
  phone?: string;
  createdAt?: string;

  specialite?: string;   // Added for doctors
  note?: string;         // Added for doctors
  propos?: string;       // Added for doctors
  telephone?: string;    // Added for doctors
  image?: string;        // Added for doctors
}

export interface RegisterResponse {
  message: string;
  patient?: Patient;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user: Patient;
}

export interface UpdateProfileResponse {
  message: string;
  user: Patient;
}

export interface UploadImageResponse {
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:5000/api';
  private currentUserSubject = new BehaviorSubject<Patient | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.loadCurrentUser();
  }

  getImageBaseUrl(): string {
    return this.apiUrl;
  }

  private loadCurrentUser(): void {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        this.currentUserSubject.next(user);
      } catch (e) {
        console.error('Failed to parse user data', e);
        this.clearUserData();
      }
    }
  }

  register(patientData: any): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, patientData).pipe(
      tap((response: RegisterResponse) => {
        console.log('AuthService received response:', response);
        if (response.patient && response.message.toLowerCase().includes('réussie')) {
          const user = {
            ...response.patient,
            patientId: response.patient.id
          };
          this.storeUser(user);
        }
      }),
      catchError(this.handleError)
    );
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap((response) => {
        console.log('Login API response:', response);
        if (response.success && response.user) {
          this.storeUser(response.user);
          const userId = response.user.patientId || response.user.id;
          const role = response.user.role.toLowerCase();

          if (role === 'patient') {
            this.router.navigate([`/patient-profile/${userId}`], { replaceUrl: true });
          } else if (role === 'medecin') {
            this.router.navigate([`/doctor-prof/${userId}`], { replaceUrl: true });
          }
        }
      }),
      catchError(this.handleError)
    );
  }

  updateUserProfile(updatedData: Partial<Patient>): Observable<UpdateProfileResponse> {
    const user = this.getCurrentUser();
    if (!user) {
      return throwError(() => new Error('Aucun utilisateur connecté'));
    }

    const payload = {
      id: user.id,
      ...updatedData
    };

    return this.http.patch<UpdateProfileResponse>(`${this.apiUrl}/patients/${user.id}`, payload).pipe(
      tap((response) => {
        console.log('Update profile API response:', response);
        if (response.user) {
          const updatedUser = {
            ...response.user,
            patientId: response.user.id
          };
          this.storeUser(updatedUser);
        }
      }),
      catchError(this.handleError)
    );
  }

  uploadProfileImage(file: File): Observable<UploadImageResponse> {
    const user = this.getCurrentUser();
    if (!user) {
      return throwError(() => new Error('Aucun utilisateur connecté'));
    }

    const formData = new FormData();
    formData.append('image', file);

    return this.http.post<UploadImageResponse>(`${this.apiUrl}/patients/${user.id}/image`, formData).pipe(
      tap((response) => {
        console.log('Upload image API response:', response);
      }),
      catchError(this.handleError)
    );
  }

  private storeUser(user: Patient): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  logout(): void {
    this.clearUserData();
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  private clearUserData(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): Patient | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.getCurrentUser();
  }

  isPatient(): boolean {
    const user = this.getCurrentUser();
    return user ? user.role === 'patient' : false;
  }

  isDoctor(): boolean {
    const user = this.getCurrentUser();
    return user ? user.role === 'medecin' : false;
  }

  getPatientId(): string | null {
    const user = this.getCurrentUser();
    return user?.patientId || null;
  }

  private handleError(error: HttpErrorResponse) {
    console.error('AuthService error:', error);
    let errorMessage = 'Une erreur est survenue';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      errorMessage = error.error?.message || error.message || `Erreur ${error.status}`;
    }
    
    return throwError(() => new Error(errorMessage));
  }
}