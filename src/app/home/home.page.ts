import { Component, OnInit } from '@angular/core';
import { MedecinService } from '../services/medecin.service';
import { InfiniteScrollCustomEvent } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  currentIndex = 0; 
  totalItems = 3; 
  medecins: any[] = [];
  loading = false; 
  page = 1;
  itemsPerPage = 4;
  hasMoreData = true; 

  constructor(private medecinService: MedecinService) {} 

  ngOnInit() {
    // Démarre le carrousel automatique
    setInterval(() => {
      this.nextSlide();
    }, 3000); // Change d'image toutes les 3 secondes

    // Récupère les médecins au chargement de la page
    this.loadMedecins();
  }

  // Récupère les médecins depuis le backend
  loadMedecins() {
    if (!this.hasMoreData || this.loading) return; // Ne pas charger si plus de données ou déjà en cours de chargement

    this.loading = true; // Active l'indicateur de chargement
    this.medecinService.getMedecins(this.page).subscribe(
      (data) => {
        if (data.length === 0) {
          this.hasMoreData = false; // Plus de médecins à charger
        } else {
          this.medecins = [...this.medecins, ...data]; // Ajoute les nouveaux médecins à la liste existante
          this.page++; // Incrémente la page pour la prochaine requête
        }
        this.loading = false; // Désactive l'indicateur de chargement
      },
      (error) => {
        console.error('Erreur lors de la récupération des médecins', error);
        this.loading = false; // Désactive l'indicateur de chargement en cas d'erreur
      }
    );
  }

  // Passer à l'image précédente
  prevSlide() {
    this.currentIndex = (this.currentIndex - 1 + this.totalItems) % this.totalItems;
    this.updateCarousel();
  }

  // Passer à l'image suivante
  nextSlide() {
    this.currentIndex = (this.currentIndex + 1) % this.totalItems;
    this.updateCarousel();
  }

  // Mettre à jour la position du carrousel
  updateCarousel() {
    const carouselInner = document.querySelector('.carousel-inner') as HTMLElement;
    if (carouselInner) {
      const offset = -this.currentIndex * 100; // Décalage en pourcentage
      carouselInner.style.transform = `translateX(${offset}%)`;
    }
  }

  // Méthode pour charger plus de médecins lors du défilement
  loadMore(event: InfiniteScrollCustomEvent) {
    // Vérifie si l'utilisateur a atteint le 4ème médecin
    if (this.medecins.length >= 4 && this.hasMoreData) {
      this.loadMedecins(); // Charge plus de médecins
    }
    setTimeout(() => {
      (event as InfiniteScrollCustomEvent).target.complete();
      if (!this.hasMoreData) {
        (event as InfiniteScrollCustomEvent).target.disabled = true;
      }
    }, 1000); 
  }
}