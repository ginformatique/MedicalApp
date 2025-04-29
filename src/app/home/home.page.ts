// home.page.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MedecinService } from '../services/medecin.service';
import { IonSearchbar } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false 
})
export class HomePage implements OnInit {
  medecins: any[] = [];
  loading: boolean = true;
  hasMoreData: boolean = true;
  fullStars: number[] = [];
  halfStar: boolean = false;
  currentIndex = 0; 
  totalItems = 3; 
  page = 1;
  itemsPerPage = 4;
  searchQuery: string = '';
  selectedSpecialty: string = '';

  constructor(private medecinService: MedecinService, private router: Router) {}

  ngOnInit() {
    this.loadMedecins();
  }

  loadMedecins() {
    this.loading = true;
    this.medecinService.getMedecins().subscribe(
      (data) => {
        this.medecins = data;
        this.loading = false;
      },
      (error) => {
        console.error('Erreur lors du chargement des médecins', error);
        this.loading = false;
      }
    );
  }

  // Nouvelle méthode pour la recherche
  searchMedecins(event?: any) {
    if (event) {
      this.searchQuery = event.target.value;
    }
    
    if (this.searchQuery.trim() === '' && !this.selectedSpecialty) {
      this.loadMedecins();
      return;
    }

    this.loading = true;
    this.medecinService.searchMedecins(this.searchQuery, this.selectedSpecialty).subscribe(
      (data) => {
        this.medecins = data;
        this.loading = false;
      },
      (error) => {
        console.error('Erreur lors de la recherche', error);
        this.loading = false;
      }
    );
  }

  // Gérer le changement de spécialité
  onSpecialtyChange(event: any) {
    this.selectedSpecialty = event.target.value;
    this.searchMedecins();
  }

  goToDoctorProfile(medecinId: string) {
    this.router.navigate(['/doctor-profile', medecinId]);
  }

  prevSlide() {
    this.currentIndex = (this.currentIndex - 1 + this.totalItems) % this.totalItems;
    this.updateCarousel();
  }

  nextSlide() {
    this.currentIndex = (this.currentIndex + 1) % this.totalItems;
    this.updateCarousel();
  }

  updateCarousel() {
    const carouselInner = document.querySelector('.carousel-inner') as HTMLElement;
    if (carouselInner) {
      const offset = -this.currentIndex * 100;
      carouselInner.style.transform = `translateX(${offset}%)`;
    }
  }
}