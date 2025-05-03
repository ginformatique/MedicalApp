import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth/auth.service';
import { AlertController, NavController } from '@ionic/angular';

@Component({
  selector: 'app-medical-history',
  templateUrl: './medical-history.page.html',
  styleUrls: ['./medical-history.page.scss'],
  standalone :  false 
})
export class MedicalHistoryPage implements OnInit {
  patientId: string | null = null;
  appointments: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private authService: AuthService,
    private alertController: AlertController,
    private navController: NavController
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.patientId = params.get('patientId');
      const user = this.authService.getCurrentUser();
      if (!user || this.patientId !== (user.patientId || user.id)) {
        console.error('Unauthorized access to medical history, redirecting to login');
        this.showAlert('Erreur', 'Accès non autorisé.', () => {
          this.navController.navigateRoot('/login', { replaceUrl: true });
        });
        return;
      }
      this.loadAppointments();
    });
  }

  goBack() {
    this.navController.back();
  }

  loadAppointments() {
    if (this.patientId) {
      this.http.get<any[]>(`http://localhost:5000/api/patients/${this.patientId}/rendezvous`).subscribe({
        next: (appointments) => {
          this.appointments = appointments;
          console.log('Appointments loaded:', this.appointments);
        },
        error: (error) => {
          console.error('Error loading appointments:', error);
          this.showAlert('Erreur', 'Impossible de charger les rendez-vous.');
        }
      });
    }
  }

  async cancelAppointment(appointmentId: string) {
    const alert = await this.alertController.create({
      header: 'Confirmer l\'annulation',
      message: 'Voulez-vous vraiment annuler ce rendez-vous ?',
      buttons: [
        {
          text: 'Non',
          role: 'cancel'
        },
        {
          text: 'Oui',
          handler: () => {
            this.http.patch(`http://localhost:5000/api/rendezvous/${appointmentId}/cancel`, {
              patientId: this.patientId
            }).subscribe({
              next: () => {
                this.showAlert('Succès', 'Rendez-vous annulé avec succès.', () => {
                  this.loadAppointments(); // Recharger la liste
                });
              },
              error: (error) => {
                console.error('Error canceling appointment:', error);
                this.showAlert('Erreur', 'Impossible d\'annuler le rendez-vous.');
              }
            });
          }
        }
      ]
    });
    await alert.present();
  }

  async showAlert(header: string, message: string, onDismiss?: () => void) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: [{
        text: 'OK',
        handler: onDismiss
      }]
    });
    await alert.present();
  }
}