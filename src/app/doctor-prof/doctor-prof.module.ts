import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DoctorProfPageRoutingModule } from './doctor-prof-routing.module';

import { DoctorProfPage } from './doctor-prof.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DoctorProfPageRoutingModule
  ],
  declarations: [DoctorProfPage]
})
export class DoctorProfPageModule {}
