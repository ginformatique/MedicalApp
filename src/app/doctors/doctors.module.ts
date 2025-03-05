import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { DoctorsPageRoutingModule } from './doctors-routing.module';
import { DoctorsPage } from './doctors.page';
import { FullCalendarModule } from '@fullcalendar/angular'; // Importer FullCalendarModule

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DoctorsPageRoutingModule,
    FullCalendarModule, // Ajouter FullCalendarModule ici
  ],
  declarations: [DoctorsPage],
})
export class DoctorsPageModule {}