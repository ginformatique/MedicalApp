import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService, User, LoginResponse } from '../auth/auth.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage {
  email: string = '';
  password: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toastController: ToastController
  ) {}

  login() {
    // Ensure email and password are provided
    if (!this.email || !this.password) {
      this.presentToast('Veuillez entrer un email et un mot de passe', 'danger');
      return;
    }

    this.authService.login(this.email, this.password).subscribe({
      next: (response: LoginResponse) => {
        const user: User = response.user;
        if (user) {
          // Check for returnUrl
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || null;

          if (returnUrl) {
            // Redirect to returnUrl
            this.router.navigateByUrl(returnUrl);
          } else {
            // Redirect based on role
            if (user.role === 'patient') {
              this.router.navigateByUrl(`/patient/${user.id}`);
            } else if (user.role === 'doctor') {
              this.router.navigateByUrl('/doctors');
            }
          }
          this.presentToast('Connexion réussie !', 'success');
        } else {
          this.presentToast('Utilisateur non trouvé', 'danger');
        }
      },
      error: (error: any) => {
        this.presentToast(error.message || 'Erreur lors de la connexion', 'danger');
      }
    });
  }

  async presentToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}