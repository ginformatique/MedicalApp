import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { AuthService } from '../auth/auth.service';

interface LoginResponse {
  success: boolean;
  message?: string;
  user?: {
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
    specialite?: string;
    note?: string;
    propos?: string;
    telephone?: string;
    image?: string;
  };
}

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false
})
export class LoginPage implements OnInit {
  email: string = '';
  password: string = '';
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    // Vérifier si l'utilisateur vient de s'inscrire
    this.route.queryParams.subscribe(params => {
      if (params['registered'] === 'true') {
        this.showAlert('Succès', 'Inscription réussie ! Veuillez vous connecter.');
      }
    });
  }

  async login() {
    if (!this.email || !this.password) {
      this.showAlert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    this.isLoading = true;

    try {
      const response = await this.authService.login(this.email, this.password).toPromise() as LoginResponse;
      
      if (response?.success && response.user) {
        const userId = response.user.patientId || response.user.id;
        const role = response.user.role.toLowerCase();

        if (role === 'patient') {
          await this.router.navigate([`/patient-profile/${userId}`], { replaceUrl: true });
        } 
        else if (role === 'medecin') {
          await this.router.navigate([`/doctor-prof/${userId}`], { replaceUrl: true });
        } else {
          this.showAlert('Erreur', 'Rôle non reconnu');
        }
      } else {
        this.showAlert('Erreur', response?.message || 'Échec de la connexion');
      }
    } catch (error) {
      console.error('Login error:', error);
      this.showAlert('Erreur', 'Email ou mot de passe incorrect');
    } finally {
      this.isLoading = false;
    }
  }

  navigateToRegister() {
    this.router.navigate(['/register']);
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }
}