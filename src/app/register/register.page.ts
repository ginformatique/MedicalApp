import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false
})
export class RegisterPage {
  nom: string = '';
  prenom: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private alertController: AlertController
  ) {}

  // Comprehensive form validation
  validateForm(): boolean {
    // Check for empty fields
    if (!this.nom || !this.prenom || !this.email || !this.password || !this.confirmPassword) {
      this.showAlert('Erreur', 'Veuillez remplir tous les champs.');
      return false;
    }

    // Password match validation
    if (this.password !== this.confirmPassword) {
      this.showAlert('Erreur', 'Les mots de passe ne correspondent pas.');
      return false;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.showAlert('Erreur', 'Veuillez entrer une adresse email valide.');
      return false;
    }

    // Password strength validation
    if (this.password.length < 8) {
      this.showAlert('Erreur', 'Le mot de passe doit contenir au moins 8 caractères.');
      return false;
    }

    return true;
  }

  // Registration method
  register() {
    // Validate form before submission
    if (!this.validateForm()) {
      return;
    }

    // Prepare registration data
    const userData = {
      nom: this.nom,
      prenom: this.prenom,
      email: this.email,
      password: this.password,
    };

    // Send registration request
    this.http.post('http://127.0.0.1:5000/register', userData).subscribe(
      (response: any) => {
        console.log('Registration successful:', response);
        this.showAlert('Succès', 'Inscription réussie !');
        this.router.navigate(['/login']); // Redirect to login page
      },
      (error) => {
        console.error('Registration failed:', error);
        
        // Handle specific error scenarios
        const errorMessage = error.error?.message || 
          (error.status === 409 ? 'Un compte avec cet email existe déjà.' : 
          "Échec de l'inscription. Veuillez réessayer.");
        
        this.showAlert('Erreur', errorMessage);
      }
    );
  }

  // Helper function to display alerts
  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }
}