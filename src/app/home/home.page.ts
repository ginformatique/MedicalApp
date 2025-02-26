import { Component, OnInit } from '@angular/core';
import { HttpClientModule } from '@angular/common/http'; // Import HttpClientModule
import { MedecinService } from '../services/medecin.service'; // Import MedecinService

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss']
})
export class HomePage implements OnInit {

  currentIndex = 0; // Index de l'image actuelle
  totalItems = 3; // Nombre total d'images
  medecins: any[] = []; // Tableau pour stocker les médecins récupérés

  constructor(private medecinService: MedecinService) {} // Injecter MedecinService

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
    this.medecinService.getMedecins().subscribe(
      (data) => {
        this.medecins = data; // Stocke les médecins récupérés
      },
      (error) => {
        console.error('Erreur lors de la récupération des médecins', error);
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
}