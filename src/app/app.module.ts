import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { IonicStorageModule } from '@ionic/storage-angular'; // Import IonicStorageModule
import { HttpClientModule } from '@angular/common/http'; // Import HttpClientModule
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; // Import FormsModule et ReactiveFormsModule

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { HomePageModule } from './home/home.module';
import { LoginPageModule } from './login/login.module';

import { DoctorService } from './services/doctor.service'; // Import DoctorService


@NgModule({
  declarations: [AppComponent], // Déclarations des composants
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    IonicStorageModule.forRoot(), // Configuration de IonicStorageModule
    AppRoutingModule,
    HttpClientModule, // HttpClientModule pour les requêtes HTTP
    FormsModule, // FormsModule pour les formulaires template-driven
    ReactiveFormsModule, // ReactiveFormsModule pour les formulaires réactifs
    HomePageModule,
    LoginPageModule,
  ],
  providers: [
    DoctorService,
    Geolocation, // Ajouter DoctorService aux providers
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }, // Stratégie de réutilisation des routes
  ],
  bootstrap: [AppComponent], // Composant racine
})
export class AppModule {}