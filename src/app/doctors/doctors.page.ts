import { Component, OnInit } from '@angular/core';
import { MedecinService } from '../services/medecin.service';
import { ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-doctors',
  templateUrl: './doctors.page.html',
  styleUrls: ['./doctors.page.scss'],
  standalone :  false 
})
export class DoctorsPage implements OnInit {
  medecin: any = null;
  selectedTab = 'info';
  selectedDate: string = '';
  minDate: string = new Date().toISOString();
  maxDate: string = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  isLoading = true;
  error: any = null;

  constructor(
    private medecinService: MedecinService,
    private route: ActivatedRoute,
    private datePipe: DatePipe
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    console.log('ID reçu:', id); // Ajout pour le débogage
    
    if (id) {
      this.loadMedecin(id);
    } else {
      this.error = 'Aucun ID de médecin fourni';
      this.isLoading = false;
    }
  }

  loadMedecin(id: string) {
    this.isLoading = true;
    
    // Si l'ID commence par "ObjectId(", nous devons l'extraire
    if (id.startsWith('ObjectId(')) {
      id = id.substring(9, id.length - 2); // Extrait 'G7edcf8e3ecd47588f7fea2c'
    }
  
    this.medecinService.getMedecinById(id).subscribe({
      next: (data) => {
        console.log('Données reçues:', data); 
        this.medecin = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.error = err;
        this.isLoading = false;
      }
    });
  }
  segmentChanged(ev: any) {
    this.selectedTab = ev.detail.value;
  }

  onDateSelected(event: any) {
    this.selectedDate = event.detail.value;
  }

  formatDate(date: string): string {
    return this.datePipe.transform(date, 'fullDate') || '';
  }
}