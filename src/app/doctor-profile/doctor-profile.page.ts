import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MedecinService } from '../services/medecin.service';
import * as L from 'leaflet';
import { ModalController } from '@ionic/angular';
import { BookingModalPage } from '../booking-modal/booking-modal.page';

@Component({
  selector: 'app-doctor-profile',
  templateUrl: './doctor-profile.page.html',
  styleUrls: ['./doctor-profile.page.scss'],
  standalone: false 
})
export class DoctorProfilePage implements OnInit, AfterViewInit {
  medecin: any;
  selectedTab: string = 'info';
  minDate: string = new Date().toISOString();
  maxDate: string = new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString();
  selectedDate: string = '';
  fullStars: number[] = [];
  halfStar: boolean = false;

  @ViewChild('map', { static: false }) mapElement!: ElementRef;
  private map!: L.Map;

  constructor(
    private route: ActivatedRoute, 
    private medecinService: MedecinService,
    private modalCtrl: ModalController 
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.medecinService.getMedecinById(id).subscribe(
        (data) => {
          this.medecin = data;
          console.log('Medecin data:', this.medecin);
          console.log('Disponibilites:', this.medecin?.disponibilites);
          console.log('Jours:', this.medecin?.disponibilites?.jours);
          this.setStars();
        },
        (error) => {
          console.error('Erreur lors du chargement du médecin', error);
        }
      );
    } else {
      console.error('No medecin ID provided in route');
    }
  }

  ngAfterViewInit() {
    if (this.selectedTab === 'location') {
      this.loadMap();
    }
  }

  segmentChanged(event: any) {
    this.selectedTab = event.detail.value;
    if (this.selectedTab === 'location') {
      setTimeout(() => this.loadMap(), 200);
    }
  }

  loadMap() {
    if (!this.medecin || !this.medecin.localisation) {
      console.error('Localisation non disponible');
      return;
    }

    const { latitude, longitude } = this.medecin.localisation;

    if (this.map) {
      this.map.remove();
    }

    this.map = L.map(this.mapElement.nativeElement).setView([latitude, longitude], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    L.marker([latitude, longitude])
      .addTo(this.map)
      .bindPopup(`<b>${this.medecin.nom}</b><br>${this.medecin.localisation.adresse}`)
      .openPopup();
  }

  setStars() {
    const rating = this.medecin?.note || 0;
    this.fullStars = Array(Math.floor(rating)).fill(0);
    this.halfStar = rating % 1 !== 0;
  }

  isDateEnabled = (dateString: string): boolean => {
    console.log('isDateEnabled called with:', dateString);
    if (!this.medecin || !this.medecin.disponibilites || !this.medecin.disponibilites.jours) {
      console.warn('Données de disponibilité non disponibles');
      return false;
    }
    const date = new Date(dateString);
    const dayName = this.getDayName(date);
    console.log('Day:', dayName, 'Available days:', this.medecin.disponibilites.jours);
    return this.medecin.disponibilites.jours.some((jour: string) => jour.toLowerCase() === dayName.toLowerCase());
  };

  async onDateSelected(event: any) {
    this.selectedDate = event.detail.value;
    console.log('Selected Date:', this.selectedDate);

    if (!this.medecin || !this.medecin._id) {
      console.error('Medecin data not loaded or missing _id');
      return;
    }

    await this.openBookingModal();
  }

  async openBookingModal() {
    const modal = await this.modalCtrl.create({
      component: BookingModalPage,
      componentProps: {
        selectedDate: this.selectedDate,
        creneaux: this.medecin.disponibilites?.creneaux || [],
        doctorId: this.medecin._id,
        doctorName: this.medecin.nom
      }
    });
  
    await modal.present();
  }

  getDayName(date: Date): string {
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    return days[date.getDay()];
  }
}