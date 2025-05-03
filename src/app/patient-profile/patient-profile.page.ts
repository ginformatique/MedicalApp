import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { AuthService, Patient } from '../auth/auth.service';
import { AlertController, NavController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';

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
  selectedFile: File | null = null;

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private authService: AuthService,
    private navController: NavController,
    private alertController: AlertController,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.loadUserProfile();
  }

  goBack() {
    this.navController.back();
  }

  toggleEditMode() {
    if (!this.isEditMode) {
      // Store original user data in case of cancel
      this.originalUser = { ...this.user } as Patient;
    }
    this.isEditMode = !this.isEditMode;
  }

  async saveChanges() {
    if (!this.user) return;

    try {
      // Update user profile
      await this.authService.updateUserProfile(this.user).toPromise();
      
      // If there's a new profile image, upload it
      if (this.selectedFile) {
        await this.authService.uploadProfileImage(this.selectedFile).toPromise();
        // Update profileImageUrl to reflect new image
        this.profileImageUrl = `${this.authService.getImageBaseUrl()}/patients/${this.user.id}/image?ts=${Date.now()}`;
      }

      this.isEditMode = false;
      this.selectedFile = null;
      this.showAlert('Succès', 'Profil mis à jour avec succès.');
    } catch (error) {
      console.error('Error updating profile:', error);
      this.showAlert('Erreur', 'Une erreur est survenue lors de la mise à jour du profil.');
    }
  }

  selectProfileImage() {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.profileImageUrl = e.target?.result as string;
      };
      reader.readAsDataURL(file);
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
}