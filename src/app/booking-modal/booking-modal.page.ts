import { Component, Input, OnInit } from '@angular/core';
import { ModalController, AlertController, LoadingController, NavController } from '@ionic/angular';
import { AppointmentService } from '../services/appointment.service';
import { MedecinService } from '../services/medecin.service';
import { NotificationService } from '../services/notification.service';
import { AuthService } from '../auth/auth.service'; 
import { Router } from '@angular/router'; 

@Component({
  selector: 'app-booking-modal',
  templateUrl: './booking-modal.page.html',
  styleUrls: ['./booking-modal.page.scss'],
  standalone: false  
})
export class BookingModalPage implements OnInit {
  @Input() selectedDate: string = '';
  @Input() creneaux: { heure: string, statut: string }[] = [];
  @Input() doctorId: string = '';
  @Input() doctorName: string = '';
  
  selectedSlot: string = '';
  isProcessing: boolean = false;
  currentPatientId: string | null = null; // Initialize as null
  rendezvousId: string | null = null;
  isConfirmed: boolean = false;
  patientAppointments: any[] = [];

  constructor(
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private appointmentService: AppointmentService,
    private medecinService: MedecinService,
    private notificationService: NotificationService,
    private navCtrl: NavController,
    private authService: AuthService, // Add AuthService
    private router: Router // Add Router
  ) {}

  ngOnInit() {
    // Set patient ID from authenticated user
    this.currentPatientId = this.authService.getPatientId();
    
    console.log('Données reçues:', {
      doctorName: this.doctorName,
      doctorId: this.doctorId,
      date: this.selectedDate,
      creneaux: this.creneaux
    });
    if (!this.doctorId) {
      console.error('Doctor ID is missing');
      this.showAlert('Erreur', 'ID du médecin manquant');
    }
    if (this.currentPatientId) {
      this.loadPatientAppointments();
    } else {
      console.error('Patient ID is missing');
    }
  }

  loadPatientAppointments() {
    if (this.currentPatientId) {
      this.appointmentService.getPatientAppointments(this.currentPatientId).subscribe(
        (response: any) => {
          this.patientAppointments = response;
          console.log('Patient appointments:', this.patientAppointments);
        },
        (error: any) => {
          console.error('Error fetching patient appointments:', error);
        }
      );
    }
  }

  dismissModal() {
    this.modalCtrl.dismiss().catch(err => {
      console.error('Erreur fermeture modal:', err);
    });
  }

  selectTimeSlot(slot: string): void {
    if (!this.isSlotReserved(slot)) {
      this.selectedSlot = slot.trim();
      console.log('Selected slot:', this.selectedSlot);
    }
  }

  isSlotReserved(slot: string): boolean {
    if (!this.creneaux || !Array.isArray(this.creneaux)) {
      return false;
    }
    const creneau = this.creneaux.find(c => c.heure === slot);
    return creneau?.statut === 'réservé';
  }

  async confirmBooking() {
    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      // Redirect to login with return URL
      await this.modalCtrl.dismiss(); // Close the modal
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: '/booking-modal' } // Adjust return URL as needed
      });
      return;
    }

    if (!this.selectedSlot || this.isSlotReserved(this.selectedSlot)) {
      await this.showAlert('Erreur', 'Veuillez sélectionner un créneau valide.');
      return;
    }

    const confirm = await this.alertCtrl.create({
      header: 'Confirmation',
      message: `Confirmer le rendez-vous avec ${this.doctorName} le ${this.formatDate(this.selectedDate)} à ${this.selectedSlot} ?`,
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        { text: 'Confirmer', handler: () => this.processBooking() }
      ]
    });
    await confirm.present();
  }

  async cancelDuringBooking() {
    const confirm = await this.alertCtrl.create({
      header: 'Annuler la réservation',
      message: 'Êtes-vous sûr de vouloir annuler la sélection de ce rendez-vous ?',
      buttons: [
        { text: 'Non', role: 'cancel' },
        {
          text: 'Oui',
          handler: () => {
            this.selectedSlot = '';
            this.dismissModal();
          }
        }
      ]
    });
    await confirm.present();
  }

  private formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  }

  private async processBooking() {
    if (!this.doctorId) {
      await this.showAlert('Erreur', 'ID du médecin manquant');
      return;
    }

    if (!this.currentPatientId) {
      await this.showAlert('Erreur', 'Vous devez être connecté pour prendre un rendez-vous.');
      await this.modalCtrl.dismiss();
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: '/booking-modal' }
      });
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Traitement en cours...'
    });
    await loading.present();
    this.isProcessing = true;

    try {
      const medecin: any = await this.medecinService.getMedecinById(this.doctorId).toPromise();
      
      if (!medecin?.disponibilites?.creneaux) {
        throw new Error('Données de disponibilité invalides');
      }

      const creneauDisponible = medecin.disponibilites.creneaux.some(
        (c: any) => c.heure === this.selectedSlot && c.statut === 'libre'
      );

      if (!creneauDisponible) {
        throw new Error('Créneau non disponible');
      }

      const appointmentData = {
        patientId: this.currentPatientId,
        medecinId: this.doctorId,
        date: this.selectedDate.split('T')[0],
        heure: this.selectedSlot,
        status: 'Confirmé'
      };

      const appointment: any = await this.appointmentService.createAppointment(appointmentData).toPromise();
      console.log('Appointment response:', JSON.stringify(appointment, null, 2));

      this.rendezvousId = appointment.rendezvous?._id || appointment._id;
      if (!this.rendezvousId) {
        throw new Error('Failed to retrieve rendezvous ID from response');
      }
      this.isConfirmed = true;

      // Envoi de la notification
      const notificationMessage = `Rendez-vous confirmé avec Dr. ${this.doctorName} le ${this.formatDate(this.selectedDate)} à ${this.selectedSlot}`;
      await this.notificationService.createNotification(
        this.currentPatientId,
        notificationMessage
      ).toPromise();

      await loading.dismiss();
      await this.showAlert('Succès', 'Rendez-vous confirmé! Une notification a été ajoutée à votre profil.', () => {});
      this.loadPatientAppointments();
    } catch (error: any) {
      console.error('Erreur réservation:', error);
      await loading.dismiss();
      await this.showAlert('Erreur', error.error?.error || error.message || 'Échec de la réservation');
    } finally {
      this.isProcessing = false;
    }
  }

  async cancelBooking() {
    if (!this.rendezvousId) {
      await this.showAlert('Erreur', 'Aucun rendez-vous à annuler');
      return;
    }

    const confirm = await this.alertCtrl.create({
      header: 'Annulation',
      message: 'Êtes-vous sûr de vouloir annuler ce rendez-vous ?',
      buttons: [
        { text: 'Non', role: 'cancel' },
        {
          text: 'Oui',
          handler: async () => {
            const loading = await this.loadingCtrl.create({
              message: 'Suppression en cours...'
            });
            await loading.present();

            try {
              console.log('Canceling rendezvous:', this.rendezvousId, 'for patient:', this.currentPatientId);
              await this.appointmentService.cancelAppointment(this.rendezvousId!, this.currentPatientId!).toPromise();
              
              // Envoi de la notification d'annulation
              const notificationMessage = `Rendez-vous annulé avec Dr. ${this.doctorName} le ${this.formatDate(this.selectedDate)} à ${this.selectedSlot}`;
              await this.notificationService.createNotification(
                this.currentPatientId!,
                notificationMessage
              ).toPromise();

              await loading.dismiss();
              await this.showAlert('Succès', 'Rendez-vous supprimé avec succès ! Une notification a été ajoutée.', () => {
                this.dismissModal();
                this.navCtrl.navigateRoot('/home');
              });
              this.isConfirmed = false;
              this.rendezvousId = null;
              this.selectedSlot = '';
              this.loadPatientAppointments();
            } catch (error: any) {
              console.error('Full cancellation error:', JSON.stringify(error, null, 2));
              await loading.dismiss();
              await this.showAlert('Erreur', error.error?.error || error.message || 'Échec de la suppression');
            }
          }
        }
      ]
    });
    await confirm.present();
  }

  private async showAlert(header: string, message: string, handler?: () => void) {
    const buttons = handler ? [{ text: 'OK', handler }] : ['OK'];
    const alert = await this.alertCtrl.create({ header, message, buttons });
    await alert.present();
  }
}