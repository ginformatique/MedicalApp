import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DocumentDoctorPageRoutingModule } from './document-doctor-routing.module';

import { DocumentDoctorPage } from './document-doctor.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DocumentDoctorPageRoutingModule
  ],
  declarations: [DocumentDoctorPage]
})
export class DocumentDoctorPageModule {}
