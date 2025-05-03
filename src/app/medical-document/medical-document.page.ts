import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DocumentService } from '../services/document.service';
import { ToastController, NavController, AlertController, LoadingController, ModalController } from '@ionic/angular';
import { FilePicker } from '@capawesome/capacitor-file-picker';
import { DocumentDetailsPage } from '../document-details/document-details.page';

@Component({
  selector: 'app-medical-document',
  templateUrl: './medical-document.page.html',
  styleUrls: ['./medical-document.page.scss'],
  standalone  :  false 
})
export class MedicalDocumentPage implements OnInit {
  documents: any[] = [];
  patientId: string = '';
  selectedFile: File | null = null;
  isLoading = false;

  newDocument = {
    type: 'other',
    description: '',
    tags: '' as string | string[],
    isUrgent: false,
    doctorId: null as string | null
  };

  constructor(
    private route: ActivatedRoute,
    private documentService: DocumentService,
    private toastCtrl: ToastController,
    private navCtrl: NavController,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private modalCtrl: ModalController,
    private navController: NavController
  ) {}

  async ngOnInit() {
    this.patientId = this.route.snapshot.paramMap.get('patientId') || '';
    if (!this.patientId) {
      await this.showToast('Patient ID non trouvé', 'danger');
      this.navCtrl.navigateBack('/patients');
      return;
    }
    await this.loadDocuments();
  }

  
  goBack() {
    this.navController.back();
  }


  async loadDocuments() {
    this.isLoading = true;
    try {
      const docs: any = await this.documentService.getPatientDocuments(this.patientId).toPromise();
      this.documents = Array.isArray(docs) ? docs : [];
      console.log('Documents loaded:', this.documents); // Debug log
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
  
    const loading = await this.loadingCtrl.create({
      message: 'Envoi en cours...'
    });
    await loading.present();
  
    try {
      const tags = typeof this.newDocument.tags === 'string' 
        ? this.newDocument.tags.split(',').map(tag => tag.trim())
        : this.newDocument.tags;
  
      const doctorId = '67eee6a6685dac2701866e1b'; // À remplacer par l'ID réel
  
      await this.documentService.uploadDocument(
        this.patientId,
        this.selectedFile,
        {
          ...this.newDocument,
          tags,
          doctorId
        }
      ).toPromise();
  
      await this.showToast('Document envoyé avec succès', 'success');
      this.selectedFile = null;
      this.resetForm();
      await this.loadDocuments();
    } catch (error) {
      console.error('Erreur envoi document:', error);
      await this.showToast(`Échec de l'envoi`, 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  async viewDocument(doc: any) {
    console.log('Viewing document:', doc); // Debug log
    await this.openDocumentModal(doc);
  }

  async deleteDocument(docId: string) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmer la suppression',
      message: 'Êtes-vous sûr de vouloir supprimer ce document?',
      buttons: [
        {
          text: 'Annuler',
          role: 'cancel'
        },
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
          document: {
            ...document,
            id: document.id || document._id // Normalisation de l'ID
          },
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
      doctorId: null
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