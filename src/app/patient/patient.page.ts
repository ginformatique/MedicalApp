import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PatientService } from '../services/patient.service';
import { NotificationService } from '../services/notification.service';
import { AppointmentService } from '../services/appointment.service';
import { AppointService } from '../services/appoint.service';
import { HeaderService } from '../header.service';
import { NavController, LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-patient',
  templateUrl: './patient.page.html',
  styleUrls: ['./patient.page.scss'],
  standalone :  false 
})
export class PatientPage implements OnInit {
  patient: any = null;
  appointments: any[] = [];
  upcomingAppointments: any[] = [];
  pastAppointments: any[] = [];
  notifications: any[] = [];
  unreadNotifications: number = 0;
  showNotifications: boolean = false;
  isLoading: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private patientService: PatientService,
    private notificationService: NotificationService,
    private appointmentService: AppointmentService,
    private appointService: AppointService,
    private headerService: HeaderService,
    private navCtrl: NavController,
    private loadingCtrl: LoadingController
  ) {}

  ngOnInit() {
    this.headerService.hide();
    const patientId = this.route.snapshot.paramMap.get('id');
    if (patientId) {
      this.loadInitialData(patientId);
    } else {
      console.error('No patient ID found in URL');
      this.navCtrl.navigateBack('/');
    }
  }

  ngOnDestroy() {
    this.headerService.show();
  }

  async loadInitialData(patientId: string) {
    const loading = await this.loadingCtrl.create({
      message: 'Chargement des données...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      await Promise.all([
        this.loadPatient(patientId),
        this.loadAppointments(patientId),
        this.loadNotifications(patientId)
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      await loading.dismiss();
    }
  }

  async loadPatient(id: string) {
    try {
      const data = await this.patientService.getPatientById(id).toPromise();
      this.patient = data;
    } catch (err) {
      console.error('Error loading patient:', err);
      this.navCtrl.navigateBack('/');
    }
  }

  async loadAppointments(patientId: string) {
    const loading = await this.loadingCtrl.create({
      message: 'Chargement des rendez-vous...'
    });
    await loading.present();
  
    try {
      const data = await this.appointService.getPatientAppointments(patientId).toPromise();
      
      // Trier
      this.appointments = (data || []).sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });
  
      // Filtrer
      const now = new Date();
      this.upcomingAppointments = this.appointments.filter(appt => 
        new Date(`${appt.date}T${appt.time}`) >= now
      );
      this.pastAppointments = this.appointments.filter(appt => 
        new Date(`${appt.date}T${appt.time}`) < now
      );
  
    } catch (err) {
      console.error('Erreur:', err);
      this.resetAppointments();
    } finally {
      await loading.dismiss();
    }
  }
  
  private resetAppointments() {
    this.appointments = [];
    this.upcomingAppointments = [];
    this.pastAppointments = [];
  }

  async loadNotifications(patientId: string) {
    this.isLoading = true;
    try {
      const data = await this.notificationService.getPatientNotifications(patientId).toPromise();
      this.notifications = Array.isArray(data)
        ? data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        : [];
      this.updateUnreadCount();
    } catch (err) {
      console.error('Error loading notifications:', err);
      this.notifications = [];
      this.unreadNotifications = 0;
    } finally {
      this.isLoading = false;
    }
  }

  updateUnreadCount() {
    this.unreadNotifications = this.notifications.filter(n => !n.isRead).length;
  }

  async toggleNotifications() {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications && this.patient && this.notifications.length === 0) {
      await this.loadNotifications(this.patient.id);
    }
  }

  async markNotificationAsRead(notificationId: string) {
    if (!this.patient) return;

    try {
      await this.notificationService.markAsRead(notificationId).toPromise();
      const notification = this.notifications.find(n => n.id === notificationId);
      if (notification && !notification.isRead) {
        notification.isRead = true;
        this.unreadNotifications--;
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }

  async markAllAsRead() {
    if (!this.patient || this.unreadNotifications === 0) return;

    const unreadIds = this.notifications
      .filter(n => !n.isRead)
      .map(n => n.id);

    try {
      await this.notificationService.markAllAsRead(unreadIds).toPromise();
      this.notifications.forEach(n => n.isRead = true);
      this.unreadNotifications = 0;
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatTime(timeString: string): string {
    if (!timeString) return '';
    return timeString.substring(0, 5); // Format HH:mm
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  goBack() {
    this.navCtrl.back();
  }
}