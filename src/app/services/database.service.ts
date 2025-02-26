import { Injectable } from '@angular/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor/sqlite';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private sqliteConnection: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;

  constructor() {
    this.sqliteConnection = new SQLiteConnection(CapacitorSQLite);
  }

  async openDatabase() {
    try {
      this.db = await this.sqliteConnection.createConnection('medecinsDB', false, 'no-encryption', 1);
      await this.db.open();
      console.log('Database opened');
      await this.createTables();
    } catch (error) {
      console.error('Error opening database', error);
    }
  }

  async createTables() {
    if (!this.db) return;
    const query = `
      CREATE TABLE IF NOT EXISTS medecins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT,
        specialite TEXT,
        disponibilite TEXT,
        image TEXT,
        statut TEXT
      );`;
    await this.db.execute(query);
  }

  async insertMedecin(nom: string, specialite: string, disponibilite: string, image: string, statut: string) {
    if (!this.db) return;
    const query = `INSERT INTO medecins (nom, specialite, disponibilite, image, statut) VALUES (?, ?, ?, ?, ?);`;
    await this.db.run(query, [nom, specialite, disponibilite, image, statut]);
  }

  async getMedecins() {
    if (!this.db) return [];
    const query = `SELECT * FROM medecins;`;
    const result = await this.db.query(query);
    return result.values || [];
  }
}
