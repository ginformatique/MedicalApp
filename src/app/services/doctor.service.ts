import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root',
})
export class DoctorService {
  private _storage: Storage | null = null;

  constructor(private storage: Storage) {
    this.init();
  }

  async init() {
    this._storage = await this.storage.create();
    console.log('Storage initialisé:', this._storage); 

    await this._storage.clear(); // Réinitialiser le stockage (à utiliser uniquement pour le débogage)
    console.log('Stockage réinitialisé'); // Log la réinitialisation

    await this.addDoctor(1, 'Dr. Smith', 'Cardiologie');
    await this.addDoctor(2, 'Dr. Johnson', 'Dermatologie');
    await this.addDoctor(3, 'Dr. Williams', 'Neurologie');
    await this.addDoctor(4, 'Dr. Brown', 'Pédiatrie');
    console.log('Docteurs ajoutés'); // Log l'ajout des docteurs
  }

  async addDoctor(id: number, name: string, specialty: string) {
    const doctor = { id, name, specialty };
    await this._storage?.set(id.toString(), doctor);
  }

  async getAllDoctors(): Promise<any[]> {
    const doctors: any[] = [];
    if (this._storage) {
      await this._storage.forEach((value: any, key: string) => {
        console.log('Key:', key, 'Value:', value); // Log chaque entrée
        doctors.push(value);
      });
    }
    console.log('Docteurs récupérés:', doctors); // Log la liste des docteurs
    return doctors;
  }
}