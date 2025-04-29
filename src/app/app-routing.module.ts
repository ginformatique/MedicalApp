import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth.guard';

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
    canActivate: [AuthGuard], // Protéger la route
    data: { roles: ['doctor', 'patient'] }, // Accessible aux deux rôles
  },
  {
    path: 'map',
    loadChildren: () => import('./map/map.module').then((m) => m.MapPageModule),
    canActivate: [AuthGuard],
    data: { roles: ['patient'] }, // Réservé aux patients
  },
  {
    path: 'booking-modal',
    loadChildren: () =>
      import('./booking-modal/booking-modal.module').then((m) => m.BookingModalModule),
    canActivate: [AuthGuard],
    data: { roles: ['patient'] }, // Réservé aux patients
  },
  {
    path: 'doctor-profile/:id',
    loadChildren: () =>
      import('./doctor-profile/doctor-profile.module').then((m) => m.DoctorProfilePageModule),
    canActivate: [AuthGuard],
    data: { roles: ['patient', 'doctor'] }, // Accessible aux deux rôles
  },
  {
    path: 'patient/:id',
    loadChildren: () => import('./patient/patient.module').then((m) => m.PatientPageModule),
    canActivate: [AuthGuard],
    data: { roles: ['patient'] }, // Réservé aux patients
  },
  {
    path: 'medical-document/:patientId',
    loadChildren: () =>
      import('./medical-document/medical-document.module').then((m) => m.MedicalDocumentPageModule),
    canActivate: [AuthGuard],
    data: { roles: ['patient', 'doctor'] }, // Accessible aux deux rôles
  },
  {
    path: 'document-details',
    loadChildren: () =>
      import('./document-details/document-details.module').then((m) => m.DocumentDetailsPageModule),
    canActivate: [AuthGuard],
    data: { roles: ['patient', 'doctor'] }, // Accessible aux deux rôles
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule],
})
export class AppRoutingModule {}