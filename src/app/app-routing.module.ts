import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { DoctorGuard } from './doctor.guard'; // Import the DoctorGuard

const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then((m) => m.HomePageModule),
  },
  {
    path: 'register',
    loadChildren: () => import('./register/register.module').then((m) => m.RegisterPageModule),
  },
  {
    path: 'login',
    loadChildren: () => import('./login/login.module').then((m) => m.LoginPageModule),
  },
  {
    path: 'doctors',
    loadChildren: () => import('./doctors/doctors.module').then((m) => m.DoctorsPageModule),
    canActivate: [AuthGuard],
    data: { roles: ['medecin', 'patient'] }, // Changed 'doctor' to 'medecin'
  },
  {
    path: 'map',
    loadChildren: () => import('./map/map.module').then((m) => m.MapPageModule),
    canActivate: [AuthGuard],
    data: { roles: ['patient'] },
  },
  {
    path: 'booking-modal',
    loadChildren: () =>
      import('./booking-modal/booking-modal.module').then((m) => m.BookingModalModule),
    canActivate: [AuthGuard],
    data: { roles: ['patient'] },
  },
  {
    path: 'doctor-profile/:id',
    loadChildren: () =>
      import('./doctor-profile/doctor-profile.module').then((m) => m.DoctorProfilePageModule),
  },
  {
    path: 'patient/:id',
    loadChildren: () => import('./patient/patient.module').then((m) => m.PatientPageModule),
    canActivate: [AuthGuard],
    data: { roles: ['patient'] },
  },
  {
    path: 'medical-document/:patientId',
    loadChildren: () =>
      import('./medical-document/medical-document.module').then((m) => m.MedicalDocumentPageModule),
    canActivate: [AuthGuard],
    data: { roles: ['patient', 'medecin'] }, // Changed 'doctor' to 'medecin'
  },
  {
    path: 'document-details',
    loadChildren: () =>
      import('./document-details/document-details.module').then((m) => m.DocumentDetailsPageModule),
    canActivate: [AuthGuard],
    data: { roles: ['patient', 'medecin'] }, // Changed 'doctor' to 'medecin'
  },
  {
    path: 'patient-profile/:id',
    loadChildren: () => import('./patient-profile/patient-profile.module').then((m) => m.PatientProfilePageModule),
    canActivate: [AuthGuard],
    data: { roles: ['patient'] },
  },
  {
    path: 'medical-history/:patientId',
    loadChildren: () => import('./medical-history/medical-history.module').then((m) => m.MedicalHistoryPageModule),
    canActivate: [AuthGuard],
    data: { roles: ['patient'] },
  },
  {
    path: 'doctor-prof/:id',
    loadChildren: () => import('./doctor-prof/doctor-prof.module').then((m) => m.DoctorProfPageModule),
    canActivate: [DoctorGuard],
    data: { roles: ['medecin'] }, // Changed 'doctor' to 'medecin'
  },
  {
    path: 'consultation/:id',
    loadChildren: () => import('./consultation/consultation.module').then((m) => m.ConsultationPageModule),
    canActivate: [DoctorGuard], // Restrict to doctors only
  },
  {
    path: 'rendezvous/:id', // Updated to include :id parameter
    loadChildren: () => import('./rendezvous/rendezvous.module').then((m) => m.RendezvousPageModule),
    canActivate: [DoctorGuard], // Restrict to doctors only
  },
  {
    path: '**',
    redirectTo: 'home',
  },  {
    path: 'document-doctor',
    loadChildren: () => import('./document-doctor/document-doctor.module').then( m => m.DocumentDoctorPageModule)
  },

];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule],
})
export class AppRoutingModule {}