import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ConsultationService } from '../services/consultation.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-consultation',
  templateUrl: './consultation.page.html',
  styleUrls: ['./consultation.page.scss'],
  standalone: false
})
export class ConsultationPage implements OnInit {
  medecinId: string | null = null;
  allRendezvous: any[] = [];
  selectedRendezvous: any = null;
  diagnostic: string = '';
  prescription: string = '';
  consultations: any[] = [];
  documents: File[] = []; // To store selected files

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private consultationService: ConsultationService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.medecinId = this.route.snapshot.paramMap.get('id');
    const stateRdv = history.state.rendezvous;
    if (this.medecinId) {
      this.loadAllRendezvous();
      this.loadConsultations();
      if (stateRdv && stateRdv.status === 'Confirmé') {
        this.selectedRendezvous = stateRdv;
      }
    }
  }

  loadAllRendezvous() {
    if (this.medecinId) {
      this.consultationService.getDoctorAppointments(this.medecinId).subscribe(
        (data) => {
          this.allRendezvous = data;
          if (!this.selectedRendezvous && data.length > 0) {
            const firstConfirmed = data.find(rdv => rdv.status === 'Confirmé');
            this.selectedRendezvous = firstConfirmed || null;
          }
        },
        async (error) => {
          console.error('Error fetching all rendezvous:', error);
          const toast = await this.toastCtrl.create({
            message: 'Erreur lors du chargement des rendez-vous.',
            duration: 2000,
            color: 'danger'
          });
          await toast.present();
        }
      );
    }
  }

  loadConsultations() {
    if (this.medecinId) {
      this.consultationService.getDoctorConsultations(this.medecinId).subscribe(
        (data) => {
          this.consultations = data;
        },
        async (error) => {
          console.error('Error fetching consultations:', error);
          const toast = await this.toastCtrl.create({
            message: 'Erreur lors du chargement des consultations.',
            duration: 2000,
            color: 'danger'
          });
          await toast.present();
        }
      );
    }
  }

  onRendezvousChange() {
    console.log('Selected rendezvous:', this.selectedRendezvous);
  }

  onFileChange(event: any) {
    const files: FileList = event.target.files;
    this.documents = [];
    for (let i = 0; i < files.length; i++) {
      this.documents.push(files[i]);
    }
    console.log('Selected documents:', this.documents);
  }

  async createConsultation() {
    if (!this.selectedRendezvous || !this.diagnostic || !this.prescription || this.selectedRendezvous.status !== 'Confirmé') {
      const toast = await this.toastCtrl.create({
        message: 'Veuillez sélectionner un rendez-vous confirmé et remplir tous les champs obligatoires.',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
      return;
    }

    try {
      // Upload des documents si présents
      const documentIds: string[] = [];
      if (this.documents.length > 0 && this.selectedRendezvous.patientId) {
        for (const file of this.documents) {
          const metadata = {
            doctorId: this.medecinId,
            type: 'consultation',
            description: `Document for consultation on ${this.selectedRendezvous.date} at ${this.selectedRendezvous.heure}`,
            tags: ['consultation'],
            isUrgent: false,
            metadata: {}
          };
          const docResponse = await this.consultationService.uploadDocument(
            this.selectedRendezvous.patientId,
            file,
            metadata
          ).toPromise();
          documentIds.push(docResponse.document._id);
        }
      }

      // Créer la consultation
      const consultationData = {
        rendezvousId: this.selectedRendezvous.id,
        medecinId: this.medecinId,
        patientId: this.selectedRendezvous.patientId,
        diagnostic: this.diagnostic,
        prescription: this.prescription,
        documents: documentIds
      };

      this.consultationService.createConsultation(consultationData).subscribe(
        async (response) => {
          const toast = await this.toastCtrl.create({
            message: 'Consultation créée avec succès ! Une notification a été envoyée au patient avec le diagnostic.',
            duration: 2000,
            color: 'success'
          });
          await toast.present();
          this.selectedRendezvous = null;
          this.diagnostic = '';
          this.prescription = '';
          this.documents = [];
          this.loadAllRendezvous();
          this.loadConsultations();
        },
        async (error) => {
          const toast = await this.toastCtrl.create({
            message: 'Erreur lors de la création de la consultation : ' + error.message,
            duration: 2000,
            color: 'danger'
          });
          await toast.present();
        }
      );
    } catch (error) {
      const toast = await this.toastCtrl.create({
        message: 'Erreur lors de l\'upload des documents : ',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    }
  }
}