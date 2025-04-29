import { Component, Input } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { DocumentService } from '../services/document.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-document-details',
  templateUrl: './document-details.page.html',
  styleUrls: ['./document-details.page.scss'],
  standalone  : false 
})
export class DocumentDetailsPage {
  @Input() document: any;
  @Input() patientId: string = '';

  documentTypes: { [key: string]: string } = {
    'prescription': 'Ordonnance',
    'report': 'Compte rendu',
    'scan': 'Scanner/IRM',
    'xray': 'Radiographie',
    'analysis': 'Analyse médicale',
    'other': 'Autre document'
  };

  constructor(
    private modalCtrl: ModalController,
    private documentService: DocumentService,
    private toastCtrl: ToastController,
    private alertCtrl : AlertController
  ) {}

  dismiss() {
    this.modalCtrl.dismiss();
  }

  getFileIcon(fileType: string): string {
    if (!fileType) return 'document-outline';
    if (fileType.includes('pdf')) return 'document-outline';
    if (fileType.includes('image')) return 'image-outline';
    return 'document-outline';
  }

  getDocumentTypeLabel(type: string): string {
    return this.documentTypes[type] || 'Autre document';
  }

  async downloadDocument() {
    try {
      // Implémentez la logique de téléchargement ici
      await this.showToast('Téléchargement démarré', 'success');
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      await this.showToast('Échec du téléchargement', 'danger');
    }
  }

  async confirmDelete() {
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
            try {
              await this.documentService.deleteDocument(this.document.id).toPromise();
              await this.showToast('Document supprimé avec succès', 'success');
              this.modalCtrl.dismiss({ deleted: true });
            } catch (error) {
              console.error('Erreur suppression:', error);
              await this.showToast('Échec de la suppression', 'danger');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    await toast.present();
  }
}