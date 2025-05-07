import { Component, OnInit } from '@angular/core';
import { DocumentService } from '../services/document.service';
import { ToastController, ModalController, LoadingController } from '@ionic/angular';
import { DocumentDetailDoctorPage } from '../document-detail-doctor/document-detail-doctor.page';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service'; // Adjust path as needed

@Component({
  selector: 'app-document-doctor',
  templateUrl: './document-doctor.page.html',
  styleUrls: ['./document-doctor.page.scss'],
  standalone :  false 
})
export class DocumentDoctorPage implements OnInit {
  documents: any[] = [];
  doctorId: string = '';
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private documentService: DocumentService,
    private toastCtrl: ToastController,
    private modalCtrl: ModalController,
    private loadingCtrl: LoadingController,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    // Try to get doctorId from AuthService
    const user = await this.authService.getCurrentUser();
    if (user && user.role === 'medecin' && user.id) {
      this.doctorId = user.id;
    } else {
      // Fallback to route parameter or navigation state
      this.doctorId = this.route.snapshot.paramMap.get('doctorId') || history.state.user?.id || '';
    }

    if (!this.doctorId || this.doctorId === 'undefined') {
      await this.showToast('ID médecin non trouvé. Veuillez vous connecter.', 'danger');
      this.router.navigate(['/login']);
      return;
    }

    await this.loadDocuments();
  }

  async loadDocuments() {
    this.isLoading = true;
    try {
      const docs = await this.documentService.getDoctorDocuments(this.doctorId).toPromise();
      this.documents = Array.isArray(docs) ? docs : [];
      console.log('Documents loaded:', this.documents);
    } catch (error) {
      console.error('Erreur chargement documents:', error);
      await this.showToast('Erreur lors du chargement des documents', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  async openDocumentModal(document: any) {
    if (!document || !document.id) {
      await this.showToast('Document invalide', 'danger');
      return;
    }

    const modal = await this.modalCtrl.create({
      component: DocumentDetailDoctorPage,
      componentProps: {
        document,
        doctorId: this.doctorId
      },
      cssClass: 'document-modal'
    });

    modal.onDidDismiss().then(async (result) => {
      if (result.data?.updated) {
        await this.loadDocuments();
      }
    });

    await modal.present();
  }

  getFileIcon(fileType: string): string {
    if (!fileType) return 'document-outline';
    if (fileType.includes('pdf')) return 'document-outline';
    if (fileType.includes('image')) return 'image-outline';
    return 'document-outline';
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }
}