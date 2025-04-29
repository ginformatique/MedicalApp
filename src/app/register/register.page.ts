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
  role: string = 'patient'; // Valeur par défaut
  password: string = '';
  confirmPassword: string = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private alertController: AlertController
  ) {}

  async register() {
    // Validate form inputs
    if (!this.nom || !this.prenom || !this.email || !this.role || !this.password || !this.confirmPassword) {
      this.showAlert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.showAlert('Erreur', 'Les mots de passe ne correspondent pas.');
      return;
    }

    // Prepare the registration data
    const userData = {
      firstName: this.prenom,
      lastName: this.nom,
      email: this.email,
      role: this.role,
      password: this.password,
    };

    // Send the registration request to the backend
    this.http.post('http://127.0.0.1:5000/api/register', userData).subscribe(
      async (response: any) => {
        console.log('Registration successful:', response);
        const alert = await this.alertController.create({
          header: 'Succès',
          message: 'Inscription réussie !',
          buttons: [{
            text: 'OK',
            handler: () => {
              this.router.navigate(['/login']);
            }
          }]
        });
        await alert.present();
      },
      (error) => {
        console.error('Registration failed:', error);
        this.showAlert('Erreur', error.error?.message || "Échec de l'inscription. Veuillez réessayer.");
      }
    );
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