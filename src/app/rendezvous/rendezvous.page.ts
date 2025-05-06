import { Component, OnInit } from '@angular/core';
import { RendezvousService } from '../services/rendezvous.service';
import { AuthService } from '../auth/auth.service';
import { ToastController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-rendezvous',
  templateUrl: './rendezvous.page.html',
  styleUrls: ['./rendezvous.page.scss'],
  standalone: false
})
export class RendezvousPage implements OnInit {
  pendingAppointments: any[] = []; // Rendez-vous en attente
  confirmedAppointments: any[] = []; // Rendez-vous acceptés (Confirmé)
  rejectedAppointments: any[] = []; // Rendez-vous rejetés
  medecinId: string | null = null;

  constructor(
    private rendezvousService: RendezvousService,
    private authService: AuthService,
    private toastCtrl: ToastController,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadAppointments();
  }

  loadAppointments() {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser.role === 'medecin') {
      this.medecinId = currentUser.id;
      if (this.medecinId) {
        this.rendezvousService.getAllRendezvous(this.medecinId).subscribe(
          (data) => {
            // Filtrer les rendez-vous par statut
            this.pendingAppointments = data.filter(appointment => appointment.status.toLowerCase() === 'en attente');
            this.confirmedAppointments = data.filter(appointment => appointment.status.toLowerCase() === 'confirmé');
            this.rejectedAppointments = data.filter(appointment => appointment.status.toLowerCase() === 'rejeté');
          },
          async (error) => {
            console.error('Error fetching appointments:', error);
            const toast = await this.toastCtrl.create({
              message: 'Erreur lors du chargement des rendez-vous.',
              duration: 2000,
              color: 'danger'
            });
            await toast.present();
          }
        );
      } else {
        this.showToast('Utilisateur non valide.', 'danger');
      }
    } else {
      this.showToast('Vous devez être un médecin pour voir les rendez-vous.', 'danger');
    }
  }

  async acceptAppointment(rendezvousId: string) {
    if (this.medecinId) {
      this.rendezvousService.acceptRendezvous(this.medecinId, rendezvousId).subscribe(
        async (response) => {
          await this.showToast('Rendez-vous accepté avec succès !', 'success');
          this.loadAppointments(); // Rafraîchir les listes
          const acceptedRdv = this.pendingAppointments.find(a => a.id === rendezvousId);
          this.router.navigate(['/consultations', this.medecinId], { state: { rendezvous: acceptedRdv } });
        },
        async (error) => {
          await this.showToast('Erreur lors de l\'acceptation du rendez-vous : ' + error.message, 'danger');
        }
      );
    }
  }

  async rejectAppointment(rendezvousId: string) {
    if (this.medecinId) {
      this.rendezvousService.rejectRendezvous(this.medecinId, rendezvousId).subscribe(
        async (response) => {
          await this.showToast('Rendez-vous rejeté avec succès !', 'warning');
          this.loadAppointments(); // Rafraîchir les listes
        },
        async (error) => {
          await this.showToast('Erreur lors du rejet du rendez-vous : ' + error.message, 'danger');
        }
      );
    }
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 2000,
      color: color
    });
    await toast.present();
  }

  goToConsultation(rendezvous: any) {
    this.router.navigate(['/consultations', this.medecinId], { state: { rendezvous } });
  }
}