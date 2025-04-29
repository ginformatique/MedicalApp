import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MedicalDocumentPage } from './medical-document.page';

const routes: Routes = [
  {
    path: '',
    component: MedicalDocumentPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MedicalDocumentPageRoutingModule {}
