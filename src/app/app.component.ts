import { Component, OnInit } from '@angular/core';
import { AuthService } from './auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false
})
export class AppComponent implements OnInit {
  userId: string | null = null;
  isAuthenticated: boolean = false;
  isPatient: boolean = false;
  isDoctor: boolean = false;

  constructor(private authService: AuthService, public router: Router) {}

  ngOnInit() {
    // Initialize user data
    this.updateUserData();

    // Subscribe to user changes
    this.authService.currentUser$.subscribe(() => {
      this.updateUserData();
    });
  }

  private updateUserData() {
    const user = this.authService.getCurrentUser();
    this.userId = user ? (user.patientId || user.id) : null;
    this.isAuthenticated = this.authService.isAuthenticated();
    this.isPatient = this.authService.isPatient();
    this.isDoctor = this.authService.isDoctor();
    console.log('User ID:', this.userId, 'Is Patient:', this.isPatient, 'Is Doctor:', this.isDoctor);
  }

  logout() {
    this.authService.logout();
    this.userId = null;
    this.isAuthenticated = false;
    this.isPatient = false;
    this.isDoctor = false;
    this.router.navigateByUrl('/home');
  }
}