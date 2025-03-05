import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import * as L from 'leaflet';

interface TimeSlot {
  time: string;
  available: boolean;
}

@Component({
  selector: 'app-doctors',
  templateUrl: './doctors.page.html',
  styleUrls: ['./doctors.page.scss'],
  standalone: false,
})
export class DoctorsPage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('map', { static: false }) mapElement?: ElementRef;

  map: any;
  selectedTab = 'info';
  selectedDate: string = ''; // Date sélectionnée au format YYYY-MM-DD
  availableSlots: TimeSlot[] = []; // Créneaux disponibles

  constructor() {}

  ngOnInit() {
    this.availableSlots = [];
  }

  ngAfterViewInit() {
    if (this.selectedTab === 'location') {
      setTimeout(() => {
        this.loadMap();
      }, 300);
    }
  }

  ionViewDidEnter() {
    if (this.selectedTab === 'location') {
      this.loadMap();
    }
  }

  segmentChanged(ev: any) {
    if (ev && ev.detail) {
      this.selectedTab = ev.detail.value;

      if (this.selectedTab === 'location') {
        setTimeout(() => {
          this.loadMap();
        }, 300);
      }
    }
  }

  // Méthode appelée lorsque la date change
  onDateSelected(event: any) {
    this.selectedDate = event.target.value; // Récupère la date sélectionnée
    this.loadAvailableSlots(); // Charge les créneaux disponibles pour la date sélectionnée
  }

  // Méthode pour charger les créneaux disponibles
  loadAvailableSlots() {
    // Simule des créneaux disponibles
    const timeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];
    this.availableSlots = timeSlots.map((time) => ({
      time: time,
      available: Math.random() > 0.3, // 70% de disponibilité
    }));
  }

  // Méthode pour réserver un créneau
  bookAppointment(slot: TimeSlot) {
    if (!slot || !this.selectedDate) {
      console.error('Données de réservation incomplètes');
      return;
    }
    console.log(`Réservation effectuée pour le ${this.selectedDate} à ${slot.time}`);
    // Implémentez la logique de réservation ici
  }

  loadMap() {
    if (!this.mapElement || !this.mapElement.nativeElement) {
      console.error('Élément de carte non disponible');
      return;
    }

    try {
      // Coordonnées du cabinet médical (Paris)
      const position = {
        lat: 48.8738,
        lng: 2.2950,
      };

      // Création de la carte Leaflet
      if (this.map) {
        this.map.remove(); // Supprimer la carte existante s'il y en a une
      }

      this.map = L.map(this.mapElement.nativeElement).setView([position.lat, position.lng], 15);

      // Ajouter la couche OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(this.map);

      // Créer une icône personnalisée pour le marqueur
      const defaultIcon = L.icon({
        iconUrl: 'assets/marker-icon.png', // Assurez-vous d'avoir cette image dans vos assets
        shadowUrl: 'assets/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      // Ajouter un marqueur pour l'emplacement du cabinet
      const marker = L.marker([position.lat, position.lng], { icon: defaultIcon })
        .addTo(this.map)
        .bindPopup('Cabinet du Dr. Dupont')
        .openPopup();

      // Assurez-vous que la carte se redimensionne correctement
      setTimeout(() => {
        this.map.invalidateSize();
      }, 300);
    } catch (error) {
      console.error('Erreur lors du chargement de la carte:', error);
    }
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  // Méthode pour obtenir la date d'aujourd'hui au format YYYY-MM-DD
getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

// Méthode pour obtenir la date maximale (1 mois plus tard) au format YYYY-MM-DD
getMaxDate(): string {
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 1);
  return maxDate.toISOString().split('T')[0];
}
}