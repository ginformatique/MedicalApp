import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController, NavController } from '@ionic/angular';
import { AuthService } from '../auth/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false
})
export class RegisterPage {
  lastName: string = '';
  firstName: string = '';
  email: string = '';
  role: string = 'patient';
  dateOfBirth: string = '';
  address: string = '';
  phone: string = '';
  password: string = '';
  confirmPassword: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private navController: NavController,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) {}

  async register() {
    // Validation du formulaire
    if (!this.validateForm()) {
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Inscription en cours...',
      spinner: 'crescent'
    });
    await loading.present();

    const userData = {
      lastName: this.lastName,
      firstName: this.firstName,
      email: this.email,
      role: this.role,
      dateOfBirth: this.dateOfBirth,
      address: this.address,
      phone: this.phone,
      password: this.password
    };

    this.authService.register(userData).subscribe({
      next: async (response) => {
        console.log('Register API response:', JSON.stringify(response, null, 2)); // Log détaillé
        await loading.dismiss();

        // Vérifier si la réponse indique une inscription réussie
        const isSuccess = response?.patient && response?.message?.toLowerCase().includes('réussie');
        if (isSuccess) {
          // Tenter la redirection avec NavController
          try {
            await this.navController.navigateRoot('/login', {
              queryParams: { registered: 'true' },
              replaceUrl: true
            });
            console.log('Navigation to /login successful with NavController');
          } catch (navError) {
            console.error('NavController navigation failed:', navError);
            // Fallback avec Router
            try {
              await this.router.navigate(['/login'], {
                queryParams: { registered: 'true' },
                replaceUrl: true
              });
              console.log('Navigation to /login successful with Router');
            } catch (routerError) {
              console.error('Router navigation failed:', routerError);
              await this.showErrorAlert('Erreur lors de la redirection vers la page de connexion.');
            }
          }
        } else {
          const errorMessage = response?.message || 'Échec de l\'inscription';
          await this.showErrorAlert(errorMessage);
        }
      },
      error: async (error: HttpErrorResponse) => {
        console.error('Register API error:', error); // Log détaillé
        await loading.dismiss();
        await this.handleRegistrationError(error);
      }
    });
  }

  private async handleRegistrationError(error: HttpErrorResponse): Promise<void> {
    console.error('Registration error details:', error);

    let errorMessage = 'Échec de l\'inscription. Veuillez réessayer.';

    if (error.status === 409) {
      errorMessage = 'Cet email est déjà utilisé';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (typeof error.error === 'string') {
      errorMessage = error.error;
    }

    await this.showErrorAlert(errorMessage);
  }

  private async showErrorAlert(message: string): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Erreur',
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  private validateForm(): boolean {
    // Validation des champs requis
    if (!this.lastName || !this.firstName || !this.email ||
        !this.dateOfBirth || !this.address || !this.phone ||
        !this.password || !this.confirmPassword) {
      this.showErrorAlert('Tous les champs sont obligatoires');
      return false;
    }

    // Validation de l'email
    if (!this.validateEmail(this.email)) {
      this.showErrorAlert('Veuillez entrer une adresse email valide');
      return false;
    }

    // Validation du mot de passe
    if (this.password !== this.confirmPassword) {
      this.showErrorAlert('Les mots de passe ne correspondent pas');
      return false;
    }

    if (this.password.length < 6) {
      this.showErrorAlert('Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }

    return true;
  }

  private validateEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }
}