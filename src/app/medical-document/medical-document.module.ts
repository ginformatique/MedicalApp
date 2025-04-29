import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MedicalDocumentPageRoutingModule } from './medical-document-routing.module';

import { MedicalDocumentPage } from './medical-document.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MedicalDocumentPageRoutingModule
  ],
  declarations: [MedicalDocumentPage]
})
export class MedicalDocumentPageModule {}
