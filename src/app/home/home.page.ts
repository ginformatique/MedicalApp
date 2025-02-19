import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone  :  false , 
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss']
})

export class HomePage {

  currentIndex = 0; // Index de l'image actuelle
  totalItems = 3; // Nombre total d'images

  constructor() {}

  ngOnInit() {
    setInterval(() => {
      this.nextSlide();
    }, 3000); // Change d'image toutes les 3 secondes
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



