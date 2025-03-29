import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage implements OnInit {
  email: string = '';
  password: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    // Initialize Google Auth
    GoogleAuth.initialize({
      clientId: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
      scopes: ['profile', 'email'],
      grantOfflineAccess: true
    });
  }

  // Standard email/password login
  async login() {
    if (!this.email || !this.password) {
      this.showAlert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }

    this.authService.login(this.email, this.password).subscribe(
      (response) => {
        console.log('Login successful', response);
        this.router.navigate(['/profile']);
        this.showAlert('Succès', 'Connexion réussie !');
      },
      (error) => {
        console.error('Login failed', error);
        this.showAlert('Erreur', 'Échec de la connexion. Vérifiez vos identifiants.');
      }
    );
  }

  // Google Sign-In method
  async googleSignIn() {
    try {
      const googleUser = await GoogleAuth.signIn();
      
      // Send the Google token to your backend for verification
      this.authService.googleLogin(googleUser.authentication.idToken).subscribe(
        (response: any) => {
          console.log('Google Login successful', response);
          this.router.navigate(['/profile']);
          this.showAlert('Succès', 'Connexion Google réussie !');
        },
        (error: any) => {
          console.error('Google Login failed', error);
          this.showAlert('Erreur', 'Échec de la connexion Google.');
        }
      );
    } catch (error) {
      console.error('Google Sign-In error', error);
      this.showAlert('Erreur', 'Problème de connexion Google.');
    }
  }

  // Method to show alerts
  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
}
