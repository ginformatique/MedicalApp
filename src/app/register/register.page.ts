import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone :  false  
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

  async register() {
    // Validate form inputs
    if (!this.nom || !this.prenom || !this.email || !this.password || !this.confirmPassword) {
      this.showAlert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.showAlert('Erreur', 'Les mots de passe ne correspondent pas.');
      return;
    }

    // Prepare the registration data
    const userData = {
      nom: this.nom,
      prenom: this.prenom,
      email: this.email,
      password: this.password,
    };

    // Send the registration request to the backend
    this.http.post('http://127.0.0.1:5000/register', userData).subscribe(
      (response: any) => {
        console.log('Registration successful:', response);
        this.showAlert('Succès', 'Inscription réussie !');
        this.router.navigate(['/login']); // Redirect to the login page
      },
      (error) => {
        console.error('Registration failed:', error);
        this.showAlert('Erreur', "Échec de l'inscription. Veuillez réessayer.");
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