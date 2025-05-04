import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MedecinService } from '../services/medecin.service';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

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
  currentIndex = 0; 
  totalItems = 3; 
  page = 1;
  itemsPerPage = 4;
  searchQuery: string = '';
  selectedSpecialty: string = '';
  sortBy: string = 'note-desc'; // Par défaut, tri par note décroissante
  specialties: string[] = [];
  ads = [
    { image: 'assets/doctor1.webp', alt: 'Publicité 1' },
    { image: 'assets/doctor2.webp', alt: 'Publicité 2' },
    { image: 'assets/doctor3.webp', alt: 'Publicité 3' }
  ];

  private searchSubject = new Subject<string>();

  constructor(private medecinService: MedecinService, private router: Router) {}

  ngOnInit() {
    this.loadSpecialties();
    this.loadMedecins();
    this.setupSearch();
  }

  loadSpecialties() {
    this.medecinService.getSpecialties().subscribe(
      (data) => {
        this.specialties = data;
      },
      (error) => {
        console.error('Erreur lors du chargement des spécialités', error);
        this.specialties = ['Cardiologie', 'Généraliste', 'Pédiatrie', 'Dermatologie', 'Neurologie', 'Orthopédie'];
      }
    );
  }

  loadMedecins() {
    this.loading = true;
    this.medecinService.getMedecins().subscribe(
      (data) => {
        this.medecins = this.sortMedecinsData(data);
        this.loading = false;
      },
      (error) => {
        console.error('Erreur lors du chargement des médecins', error);
        this.loading = false;
      }
    );
  }

  setupSearch() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.searchMedecins();
    });
  }

  onSearchInput(event: any) {
    this.searchQuery = event.target.value || '';
    this.searchSubject.next(this.searchQuery);
  }

  searchMedecins() {
    // Validation de la spécialité
    if (this.selectedSpecialty && !this.specialties.includes(this.selectedSpecialty)) {
      console.warn(`Spécialité non valide: ${this.selectedSpecialty}. Réinitialisation.`);
      this.selectedSpecialty = '';
    }

    this.loading = true;

    // Si aucune recherche ni spécialité n'est sélectionnée, charger tous les médecins
    if (this.searchQuery.trim() === '' && !this.selectedSpecialty) {
      this.loadMedecins();
      return;
    }

    // Appeler l'API avec la requête de recherche et/ou la spécialité
    this.medecinService.searchMedecins(this.searchQuery.trim(), this.selectedSpecialty).subscribe(
      (data) => {
        this.medecins = this.sortMedecinsData(data);
        this.loading = false;
      },
      (error) => {
        console.error('Erreur lors de la recherche', error);
        this.medecins = [];
        this.loading = false;
      }
    );
  }

  clearSearch() {
    this.searchQuery = '';
    this.searchMedecins();
  }

  sortMedecins() {
    this.medecins = this.sortMedecinsData(this.medecins);
  }

  sortMedecinsData(data: any[]): any[] {
    return data.sort((a, b) => {
      if (this.sortBy === 'note-desc') {
        return b.note - a.note;
      } else if (this.sortBy === 'note-asc') {
        return a.note - b.note;
      } else if (this.sortBy === 'nom') {
        return a.nom.localeCompare(b.nom);
      } else if (this.sortBy === 'specialite') {
        return a.specialite.localeCompare(b.specialite);
      }
      return 0;
    });
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

  getFullStars(note: number): number[] {
    const fullStars = Math.floor(note);
    return Array(fullStars).fill(0);
  }

  hasHalfStar(note: number): boolean {
    return note % 1 >= 0.5;
  }

  getEmptyStars(note: number): number[] {
    const fullStars = Math.floor(note);
    const hasHalf = note % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - hasHalf;
    return Array(emptyStars).fill(0);
  }
}