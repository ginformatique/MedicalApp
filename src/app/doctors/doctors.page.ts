import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { DatabaseService } from '../services/database.service';

declare var google: any;

@Component({
  selector: 'app-doctors',
  templateUrl: './doctors.page.html',
  styleUrls: ['./doctors.page.scss'],
  standalone : false 
})
export class DoctorsPage implements OnInit {
  medecins: any[] = [];

  constructor(private dbService: DatabaseService) {}

  async ngOnInit() {
    await this.dbService.openDatabase();
    await this.loadMedecins();
  }

  async loadMedecins() {
    this.medecins = await this.dbService.getMedecins();
  }


  @ViewChild('map', { static: true }) mapElement!: ElementRef;
  map: any; // Objet Google Map
  selectedDate: string = ''; // Date sélectionnée
  availableSlots: { time: string, available: boolean }[] = []; // Créneaux disponibles

  

  

  ionViewDidEnter() {
    setTimeout(() => {
      this.loadMap();
    }, 500);
  }
  

  onDateSelected() {
    // Générer des créneaux horaires aléatoires
    const timeSlots = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
    ];

    this.availableSlots = timeSlots.map(time => ({
      time: time,
      available: Math.random() > 0.3 // 70% de disponibilité
    }));
  }

  bookAppointment(slot: { time: string, available: boolean }) {
    if (slot.available) {
      console.log(`Réservation effectuée pour le ${this.selectedDate} à ${slot.time}`);
      // Implémentez la logique de réservation ici
    } else {
      console.log(`Créneau ${slot.time} indisponible.`);
    }
  }

  loadMap() {
    // Vérifier que l'élément map existe
    if (!this.mapElement || !this.mapElement.nativeElement) {
      console.error('Élément map non trouvé.');
      return;
    }

    // Coordonnées du cabinet médical (Paris)
    const position = {
      lat: 48.8738,
      lng: 2.2950
    };

    // Options de la carte
    const mapOptions = {
      center: new google.maps.LatLng(position.lat, position.lng),
      zoom: 15,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };

    // Créer la carte
    this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);

  }


}