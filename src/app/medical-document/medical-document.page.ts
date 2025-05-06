
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationExtras } from '@angular/router';
import { DocumentService } from '../services/document.service';
import { ToastController, NavController, AlertController, LoadingController, ModalController } from '@ionic/angular';
import { FilePicker } from '@capawesome/capacitor-file-picker';
import { DocumentDetailsPage } from '../document-details/document-details.page';

@Component({
  selector: 'app-medical-document',
  templateUrl: './medical-document.page.html',
  styleUrls: ['./medical-document.page.scss'],
  standalone: false
})
export class MedicalDocumentPage implements OnInit {
  documents: any[] = [];
  patientId: string = '';
  consultationId: string | null = null;
  selectedFile: File | null = null;
  isLoading = false;
  doctors: any[] = [];

  newDocument = {
    type: 'other',
    description: '',
    tags: '' as string | string[],
    isUrgent: false,
    doctorId: null as string | null,
    consultationId: null as string | null
  };

  constructor(
    private route: ActivatedRoute,
    private documentService: DocumentService,
    private toastCtrl: ToastController,
    private navCtrl: NavController,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private modalCtrl: ModalController
  ) {}

  async ngOnInit() {
    this.patientId = this.route.snapshot.paramMap.get('patientId') || '';
    this.consultationId = history.state.consultationId || null;

    console.log('Route params:', this.route.snapshot.paramMap);
    console.log('Consultation ID from state:', this.consultationId);
    if (!this.patientId || this.patientId === 'undefined') {
      console.error('Invalid or missing patientId:', this.patientId);
      await this.showToast('Patient ID non trouvé', 'danger');
      await this.navCtrl.navigateBack('/patients');
      return;
    }

    if (this.consultationId) {
      this.newDocument.consultationId = this.consultationId;
    }

    // Load doctors for selection if no consultationId
    if (!this.consultationId) {
      await this.loadDoctors();
    }

    await this.loadDocuments();
  }

  async goBack() {
    try {
      await this.navCtrl.back();
    } catch (error) {
      console.error('Error navigating back:', error);
      await this.navCtrl.navigateBack('/patients');
    }
  }

  async loadDoctors() {
    try {
      const doctors: any = await this.documentService.getDoctors().toPromise();
      this.doctors = Array.isArray(doctors) ? doctors : [];
      console.log('Doctors loaded:', this.doctors.map(d => ({ id: d.id, nom: d.nom, prenom: d.prenom })));
    } catch (error) {
      console.error('Erreur chargement médecins:', error);
      await this.showToast('Erreur lors du chargement des médecins', 'danger');
    }
  }

  async loadDocuments() {
    if (!this.patientId || this.patientId === 'undefined') {
      console.error('Cannot load documents: Invalid patientId');
      await this.showToast('Patient ID invalide', 'danger');
      this.documents = [];
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    try {
      console.log('Loading documents for patientId:', this.patientId, 'consultationId:', this.consultationId);
      const docs: any = await this.documentService.getPatientDocuments(this.patientId, this.consultationId).toPromise();
      this.documents = Array.isArray(docs) ? docs : [];
      console.log('Documents loaded:', this.documents);
    } catch (error) {
      console.error('Erreur chargement documents:', error);
      await this.showToast('Erreur lors du chargement des documents', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  async selectFile() {
    try {
      const result = await FilePicker.pickFiles({
        types: ['application/pdf', 'image/*'],
        readData: false
      });

      if (result.files.length > 0) {
        const file = result.files[0];
        const response = await fetch(file.path!);
        const blob = await response.blob();
        this.selectedFile = new File([blob], file.name, { type: blob.type });
        console.log('File selected:', {
          name: this.selectedFile.name,
          type: this.selectedFile.type,
          size: this.selectedFile.size
        });
      }
    } catch (error) {
      console.error('Erreur sélection fichier:', error);
      await this.showToast('Sélection annulée', 'warning');
    }
  }

  async uploadDocument() {
    if (!this.selectedFile) {
      await this.showToast('Veuillez sélectionner un fichier', 'warning');
      return;
    }

    // Require doctorId if no consultationId
    if (!this.newDocument.consultationId && !this.newDocument.doctorId) {
      await this.showToast('Veuillez sélectionner un médecin', 'warning');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Envoi en cours...'
    });
    await loading.present();

    try {
      const tags = typeof this.newDocument.tags === 'string'
        ? this.newDocument.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        : this.newDocument.tags;

      let doctorId = this.newDocument.doctorId;
      if (this.newDocument.consultationId) {
        try {
          console.log('Fetching consultation for ID:', this.newDocument.consultationId);
          const consultation = await this.documentService.getConsultation(this.newDocument.consultationId).toPromise();
          console.log('Consultation response:', consultation);
          if (!consultation || !consultation.medecinId) {
            throw new Error('Consultation invalide ou ID médecin manquant');
          }
          if (!/^[0-9a-fA-F]{24}$/.test(consultation.medecinId)) {
            throw new Error('ID médecin de la consultation invalide');
          }
          doctorId = consultation.medecinId;
        } catch (error) {
          console.error('Erreur lors de la récupération de la consultation:', error);
          throw new Error('Impossible de récupérer le médecin associé à la consultation');
        }
      }

      if (!doctorId) {
        throw new Error('ID médecin manquant');
      }

      // Validate doctorId format
      if (!/^[0-9a-fA-F]{24}$/.test(doctorId)) {
        console.error('Invalid doctorId format:', doctorId);
        throw new Error('ID médecin invalide');
      }

      const metadata = {
        type: this.newDocument.type,
        description: this.newDocument.description,
        tags,
        isUrgent: this.newDocument.isUrgent,
        doctorId,
        consultationId: this.newDocument.consultationId
      };

      console.log('Uploading document with payload:', {
        patientId: this.patientId,
        file: {
          name: this.selectedFile.name,
          type: this.selectedFile.type,
          size: this.selectedFile.size
        },
        metadata
      });

      const response = await this.documentService.uploadDocument(
        this.patientId,
        this.selectedFile,
        metadata
      ).toPromise();

      console.log('Upload response:', response);
      await this.showToast('Document envoyé avec succès', 'success');
      this.selectedFile = null;
      this.resetForm();
      await this.loadDocuments();
    } catch (error: any) {
      console.error('Erreur envoi document:', error);
      let errorMessage = 'Échec de l\'envoi';
      if (error.status === 400 && error.error && typeof error.error === 'object' && error.error.error) {
        errorMessage = `Échec de l'envoi: ${error.error.error}`;
      } else if (error.message) {
        errorMessage = `Échec de l'envoi: ${error.message}`;
      }
      await this.showToast(errorMessage, 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  async viewDocument(doc: any) {
    await this.openDocumentModal(doc);
  }

  async deleteDocument(docId: string) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmer la suppression',
      message: 'Êtes-vous sûr de vouloir supprimer ce document?',
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: 'Supprimer',
          handler: async () => {
            const loading = await this.loadingCtrl.create();
            await loading.present();
            try {
              await this.documentService.deleteDocument(docId).toPromise();
              await this.showToast('Document supprimé', 'success');
              await this.loadDocuments();
            } catch (error) {
              console.error('Erreur suppression:', error);
              await this.showToast('Échec de la suppression', 'danger');
            } finally {
              await loading.dismiss();
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async openDocumentModal(document: any) {
    if (!document || (!document.id && !document._id)) {
      console.error('Document invalide:', document);
      await this.showToast('Document invalide - identifiant manquant', 'danger');
      return;
    }

    try {
      const modal = await this.modalCtrl.create({
        component: DocumentDetailsPage,
        componentProps: {
          document: { ...document, id: document.id || document._id },
          patientId: this.patientId
        },
        cssClass: 'document-modal',
        backdropDismiss: false
      });

      modal.onDidDismiss().then((result) => {
        if (result.data?.deleted) {
          this.loadDocuments();
        }
      });

      await modal.present();
    } catch (error) {
      console.error('Erreur lors de l\'ouverture du modal:', error);
      await this.showToast('Erreur lors de l\'ouverture du document', 'danger');
    }
  }

  resetForm() {
    this.newDocument = {
      type: 'other',
      description: '',
      tags: '',
      isUrgent: false,
      doctorId: null,
      consultationId: this.consultationId
    };
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