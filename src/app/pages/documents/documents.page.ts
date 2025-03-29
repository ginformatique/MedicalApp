// documents.page.ts
import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { LoadingController, ToastController } from '@ionic/angular';
import { catchError, finalize, tap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

interface Document {
  id: number;
  nom: string;
  filename: string;
  uploadDate: string | null; // Permettre null
  status: 'en_attente' | 'consulté';
  fileSize: number;
  hidden?: boolean;
  visible: boolean; 
}

@Component({
  selector: 'app-documents',
  templateUrl: './documents.page.html',
  styleUrls: ['./documents.page.scss'],
  standalone:false
})
export class DocumentsPage implements OnInit {
  selectedFile: File | null = null;
  documents: Document[] = [];
  isLoading = false;
  deletedDocuments: Set<number> = new Set();

  constructor(
    private http: HttpClient,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.getDocuments();
  }

  ionViewWillEnter() {
    this.getDocuments();
  }

  uploadFile(event: any) {
    const file = event.target.files[0];
    if (file) {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        this.showToast('Fichier trop volumineux. Limite de 10 Mo.', 'danger');
        return;
      }
      this.selectedFile = file;
    }
  }

  // Format file size to human-readable format
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Octets';
    const k = 1024;
    const sizes = ['Octets', 'Ko', 'Mo', 'Go'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  formatDate(dateString: string | null): string {
    if (!dateString) return 'Date non disponible';
  
    // Convertit les dates PostgreSQL au format JS
    const date = new Date(dateString.includes(' ') ? dateString.replace(' ', 'T') : dateString);
    
    return isNaN(date.getTime()) 
      ? 'Date invalide' 
      : date.toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
  }

  // Submit document to server
  async submitDocument() {
    if (!this.selectedFile) {
      this.showToast('Veuillez sélectionner un fichier', 'warning');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Envoi du document...',
      cssClass: 'custom-loading'
    });
    await loading.present();

    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.http.post('http://localhost:5000/upload', formData)
      .pipe(
        tap(() => {
          this.showToast('Document envoyé avec succès', 'success');
          this.selectedFile = null;
          this.getDocuments();
        }),
        catchError(this.handleError('Erreur lors de l\'envoi du document')),
        finalize(() => loading.dismiss())
      )
      .subscribe();
  }

  // Fetch documents from server
  getDocuments() {
    this.isLoading = true;
    const hiddenDocs = JSON.parse(localStorage.getItem('hiddenDocs') || '[]');
  
    this.http.get<Document[]>('http://localhost:5000/documents')
      .pipe(
        tap(documents => {
          console.log('Raw API response:', documents);
  
          this.documents = documents
            .map(doc => {
              // Debug logging for each document
              console.log(`Processing doc ${doc.id}:`, {
                originalDate: doc.uploadDate,
                type: typeof doc.uploadDate
              });
  
              // Enhanced date processing
              let processedDate = null;
              if (doc.uploadDate) {
                // Handle multiple date formats
                let dateStr = doc.uploadDate;
                
                // Case 1: PostgreSQL format "YYYY-MM-DD HH:MM:SS"
                if (dateStr.includes(' ')) {
                  dateStr = dateStr.replace(' ', 'T');
                }
                // Case 2: Missing timezone - add UTC marker if needed
                else if (!dateStr.endsWith('Z') && dateStr.indexOf('T') !== -1) {
                  dateStr += 'Z';
                }
  
                const dateObj = new Date(dateStr);
                processedDate = isNaN(dateObj.getTime()) ? null : dateStr;
              }
  
              return {
                ...doc,
                uploadDate: processedDate,
                hidden: hiddenDocs.includes(doc.id),
                // Ensure visibility flag exists
                visible: doc.visible !== false
              };
            })
            .sort((a, b) => {
              // Fallback to name sorting if dates are equal or missing
              if ((!a.uploadDate && !b.uploadDate) || 
                  (a.uploadDate && b.uploadDate && 
                   new Date(a.uploadDate).getTime() === new Date(b.uploadDate).getTime())) {
                return a.nom.localeCompare(b.nom);
              }
              
              const dateA = a.uploadDate ? new Date(a.uploadDate).getTime() : 0;
              const dateB = b.uploadDate ? new Date(b.uploadDate).getTime() : 0;
              return dateB - dateA;
            });
  
          // Final verification log
          console.log('Processed documents:', this.documents.map(d => ({
            id: d.id,
            name: d.nom,
            date: d.uploadDate,
            formattedDate: this.formatDate(d.uploadDate),
            hidden: d.hidden
          })));
        }),
        catchError(this.handleError('Impossible de charger les documents')),
        finalize(() => this.isLoading = false)
      )
      .subscribe();
  }

  // Error handling method
  private handleError(message: string) {
    return (error: HttpErrorResponse): Observable<any> => {
      console.error('Erreur:', error);
      this.showToast(message, 'danger');
      return of(null);
    };
  }

  // Show toast notification
  private async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'danger') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
      cssClass: 'custom-toast'
    });
    await toast.present();
  }
}