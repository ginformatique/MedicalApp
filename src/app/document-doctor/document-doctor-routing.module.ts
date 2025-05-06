import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DocumentDoctorPage } from './document-doctor.page';

const routes: Routes = [
  {
    path: '',
    component: DocumentDoctorPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DocumentDoctorPageRoutingModule {}
