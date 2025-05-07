import { Component, OnInit } from '@angular/core';
import { MedecinService } from '../services/medecin.service';
import { AuthService } from '../auth/auth.service';
import { HttpClient } from '@angular/common/http';
import { AlertController, NavController } from '@ionic/angular';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-doctor-prof',
  templateUrl: './doctor-prof.page.html',
  styleUrls: ['./doctor-prof.page.scss'],
  standalone :  false 
})
export class DoctorProfPage implements OnInit {
  user: any = null;
  isEditMode = false;
  notifications: any[] = [];
  isLoadingNotifications = false;
  error: string | null = null;

  constructor(
    private medecinService: MedecinService,
    private authService: AuthService,
    private http: HttpClient,
    private alertController: AlertController,
    private navController: NavController
  ) {}

  ngOnInit(): void {
    this.loadDoctorProfile();
    this.refreshNotifications();
  }

  loadDoctorProfile(): void {
    const user = this.authService.getCurrentUser();
    if (!user || !user.id || user.role !== 'medecin') {
      this.error = 'Utilisateur non authentifié ou non autorisé';
      return;
    }

    this.medecinService.getMedecinById(user.id).pipe(
      tap(doctor => {
        this.user = {
          _id: doctor._id,
          prenom: doctor.prenom,
          nom: doctor.nom,
          email: doctor.email,
          telephone: doctor.telephone,
          adresse: doctor.adresse,
          specialite: doctor.specialite,
          propos: doctor.propos,
          image: doctor.image,
          note_moyenne: doctor.note_moyenne
        };
      }),
      catchError(err => {
        this.error = 'Erreur lors du chargement du profil: ' + (err.message || 'Erreur inconnue');
        return of(null);
      })
    ).subscribe();
  }

  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
  }

  async saveChanges(): Promise<void> {
    if (!this.user) return;

    const updateData = {
      firstName: this.user.prenom,
      lastName: this.user.nom,
      phone: this.user.telephone,
      email: this.user.email,
      address: this.user.adresse
    };

    this.medecinService.updateMedecinProfile(this.user._id, updateData).subscribe({
      next: async () => {
        this.isEditMode = false;
        const alert = await this.alertController.create({
          header: 'Succès',
          message: 'Profil mis à jour avec succès',
          buttons: ['OK']
        });
        await alert.present();
      },
      error: async (err) => {
        const alert = await this.alertController.create({
          header: 'Erreur',
          message: 'Échec de la mise à jour du profil: ' + (err.error?.error || 'Erreur inconnue'),
          buttons: ['OK']
        });
        await alert.present();
      }
    });
  }

  refreshNotifications(): void {
    this.isLoadingNotifications = true;
    this.http.get<any[]>(`http://localhost:5000/api/notifications/doctor/${this.authService.getCurrentUser()?.id}`).subscribe({
      next: (response) => {
        this.notifications = response || [];
        this.isLoadingNotifications = false;
      },
      error: () => {
        this.isLoadingNotifications = false;
        this.notifications = [];
      }
    });
  }

  getUnreadNotificationCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }

  markAsRead(notificationId: string): void {
    this.http.patch(`http://localhost:5000/api/notifications/${notificationId}/read`, {}).subscribe({
      next: () => {
        const notification = this.notifications.find(n => n._id === notificationId);
        if (notification) {
          notification.isRead = true;
        }
      },
      error: (err) => {
        console.error('Erreur lors du marquage de la notification:', err);
      }
    });
  }

  goBack(): void {
    this.navController.back();
  }

  async logout(): Promise<void> {
    this.authService.logout();
    this.navController.navigateRoot('/login');
  }
}