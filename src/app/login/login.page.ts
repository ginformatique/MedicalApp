import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';

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
    private router: Router, // Service de routage
    private alertController: AlertController // Service pour afficher des alertes
  ) {}

  ngOnInit() {}

  // Méthode pour gérer la connexion
  async login() {
    // Vérifie que l'email et le mot de passe ne sont pas vides
    if (!this.email || !this.password) {
      this.showAlert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }

    // Appelle le service d'authentification pour se connecter
    this.authService.login(this.email, this.password).subscribe(
      (response) => {
        console.log('Login successful', response);

        // Redirige vers la page profile après une connexion réussie
        this.router.navigate(['/profile']);

        // Affiche un message de succès
        this.showAlert('Succès', 'Connexion réussie !');
          // Redirige vers la page profile après une connexion réussie
          this.router.navigate(['/profile']);
      },
      (error) => {
        console.error('Login failed', error);

        // Affiche un message d'erreur
        this.showAlert('Erreur', 'Échec de la connexion. Vérifiez vos identifiants.');
      }
    );
  }

  // Méthode pour afficher une alerte
  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header, // Titre de l'alerte
      message, // Message de l'alerte
      buttons: ['OK'] // Bouton pour fermer l'alerte
    });
    await alert.present(); // Affiche l'alerte
  }
}