import { Component, OnInit } from '@angular/core';
import { AuthService, Patient } from '../auth/auth.service';
import { AlertController, NavController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { NotificationService } from '../services/notification.service';

interface Notification {
  _id: string;
  patientId: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-patient-profile',
  templateUrl: './patient-profile.page.html',
  styleUrls: ['./patient-profile.page.scss'],
  standalone: false
})
export class PatientProfilePage implements OnInit {
  user: Patient | null = null;
  isEditMode: boolean = false;
  profileImageUrl: string | null = null;
  originalUser: Patient | null = null;
  notifications: Notification[] = [];
  isLoadingNotifications: boolean = false;

  constructor(
    private authService: AuthService,
    private navController: NavController,
    private alertController: AlertController,
    private route: ActivatedRoute,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.loadUserProfile();
    this.loadNotifications();
  }

  goBack() {
    this.navController.back();
  }

  toggleEditMode() {
    if (!this.isEditMode && this.user) {
      // Store original user data in case of cancel
      this.originalUser = { ...this.user } as Patient;
    }
    this.isEditMode = !this.isEditMode;
  }

  async saveChanges() {
    if (!this.user) return;

    try {
      // Prepare data to update
      const updatedData: Partial<Patient> = {
        firstName: this.user.firstName,
        lastName: this.user.lastName,
        phone: this.user.phone,
        email: this.user.email,
        address: this.user.address
      };

      // Update user profile
      await this.authService.updateUserProfile(updatedData).toPromise();
      
      this.isEditMode = false;
      this.showAlert('Succès', 'Profil mis à jour avec succès.');
      this.refreshNotifications(); // Refresh notifications in case profile update triggers any
    } catch (error) {
      console.error('Error updating profile:', error);
      this.showAlert('Erreur', 'Une erreur est survenue lors de la mise à jour du profil.');
    }
  }

  private loadUserProfile() {
    this.user = this.authService.getCurrentUser();
    if (!this.user) {
      console.error('No user found, redirecting to login');
      this.navController.navigateRoot('/login', { replaceUrl: true });
      return;
    }

    // Construct image URL based on patient ID
    this.profileImageUrl = `${this.authService.getImageBaseUrl()}/patients/${this.user.id}/image`;

    // Vérifier que l'ID dans l'URL correspond à l'utilisateur connecté
    this.route.paramMap.subscribe(params => {
      const patientId = params.get('id');
      if (patientId && patientId !== (this.user?.patientId || this.user?.id)) {
        console.error('Unauthorized access to patient profile, redirecting to login');
        this.showAlert('Erreur', 'Accès non autorisé à ce profil.');
        this.navController.navigateRoot('/login', { replaceUrl: true });
      }
    });
  }

  private loadNotifications() {
    const patientId = this.authService.getPatientId();
    if (patientId) {
      this.isLoadingNotifications = true;
      this.notificationService.getPatientNotifications(patientId).subscribe(
        (notifications: Notification[]) => {
          this.notifications = notifications || [];
          console.log('Notifications loaded:', this.notifications);
          this.isLoadingNotifications = false;
        },
        (error: any) => {
          console.error('Error fetching notifications:', error);
          this.notifications = [];
          this.isLoadingNotifications = false;
          this.showAlert('Erreur', 'Échec du chargement des notifications.');
        }
      );
    }
  }

  async markAsRead(notificationId: string) {
    try {
      await this.notificationService.markAsRead(notificationId).toPromise();
      // Update the notification's isRead status locally
      const notification = this.notifications.find(n => n._id === notificationId);
      if (notification) {
        notification.isRead = true;
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      this.showAlert('Erreur', 'Échec du marquage de la notification comme lue.');
    }
  }

  refreshNotifications() {
    this.loadNotifications();
  }

  async logout() {
    const alert = await this.alertController.create({
      header: 'Déconnexion',
      message: 'Voulez-vous vraiment vous déconnecter ?',
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
        {
          text: 'Confirmer',
          handler: () => {
            this.authService.logout();
          }
        }
      ]
    });
    await alert.present();
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }


  getUnreadNotificationCount(): number {
    const count = this.notifications.filter(n => !n.isRead).length;
    console.log('Unread count:', count);
    return count;
  }
}