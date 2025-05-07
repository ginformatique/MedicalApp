import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DocumentDetailDoctorPageRoutingModule } from './document-detail-doctor-routing.module';

import { DocumentDetailDoctorPage } from './document-detail-doctor.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DocumentDetailDoctorPageRoutingModule
  ],
  declarations: [DocumentDetailDoctorPage]
})
export class DocumentDetailDoctorPageModule {}
