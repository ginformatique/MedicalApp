import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DocumentDetailDoctorPage } from './document-detail-doctor.page';

const routes: Routes = [
  {
    path: '',
    component: DocumentDetailDoctorPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DocumentDetailDoctorPageRoutingModule {}
