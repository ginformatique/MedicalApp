import { Component, Input, OnInit } from '@angular/core';
import { ModalController, ToastController, LoadingController } from '@ionic/angular';
import { DocumentService } from '../services/document.service';

@Component({
  selector: 'app-document-detail-doctor',
  templateUrl: './document-detail-doctor.page.html',
  styleUrls: ['./document-detail-doctor.page.scss'],
  standalone :  false 
})
export class DocumentDetailDoctorPage implements OnInit {
  @Input() document: any;
  @Input() doctorId: string = '';
  newNote: string = '';

  constructor(
    private modalCtrl: ModalController,
    private documentService: DocumentService,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {}

  ngOnInit() {
    if (!this.document || !this.document.id) {
      this.showToast('Document invalide', 'danger').then(() => {
        this.dismiss();
      });
    }
    if (!this.doctorId || this.doctorId === 'undefined') {
      this.showToast('ID médecin manquant', 'danger').then(() => {
        this.dismiss();
      });
    }
  }

  async dismiss(updated: boolean = false) {
    await this.modalCtrl.dismiss({ updated });
  }

  async addNote() {
    if (!this.newNote.trim()) {
      await this.showToast('La note ne peut pas être vide', 'warning');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Ajout de la note...'
    });
    await loading.present();

    try {
      console.log('Adding tag:', {
        documentId: this.document.id,
        doctorId: this.doctorId,
        tag: this.newNote
      });
      const tagResponse = await this.documentService.addDocumentTag(this.document.id, this.doctorId, this.newNote).toPromise();
      console.log('Tag response:', tagResponse);

      console.log('Updating status for document:', this.document.id);
      const statusResponse = await this.documentService.updateDocumentStatus(this.document.id, 'consulté').toPromise();
      console.log('Status update response:', statusResponse);

      await this.showToast('Note ajoutée avec succès', 'success');
      this.newNote = '';
      await this.dismiss(true);
    } catch (error: any) {
      console.error('Erreur lors de l\'ajout ou mise à jour:', {
        status: error.status,
        statusText: error.statusText,
        message: error.message,
        errorDetails: error.error,
        url: error.url
      });
      const errorMessage = error.error?.error || error.message || 'Échec de l\'ajout de la note ou mise à jour du statut';
      await this.showToast(errorMessage, 'danger');
    } finally {
      await loading.dismiss();
    }
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