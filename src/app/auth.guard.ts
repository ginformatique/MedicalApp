import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from './auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // Vérifier si l'utilisateur est authentifié
    if (!this.authService.isAuthenticated()) {
      console.log('AuthGuard: User not authenticated, redirecting to /login');
      this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    // Vérifier les rôles requis pour la route
    const requiredRoles = route.data['roles'] as string[];
    if (requiredRoles && requiredRoles.length > 0) {
      const isPatient = this.authService.isPatient();
      const isDoctor = this.authService.isDoctor();

      // Vérifier si l'utilisateur a l'un des rôles requis
      const hasRequiredRole = requiredRoles.some(role => 
        (role === 'patient' && isPatient) || (role === 'doctor' && isDoctor)
      );

      if (!hasRequiredRole) {
        console.log('AuthGuard: User does not have required role, redirecting to /home');
        this.router.navigate(['/home']);
        return false;
      }
    }

    // Vérifier l'ID pour la route patient-profile/:id
    if (route.routeConfig?.path === 'patient-profile/:id') {
      const patientId = route.paramMap.get('id');
      const currentUser = this.authService.getCurrentUser();
      if (patientId && currentUser && patientId !== (currentUser.patientId || currentUser.id)) {
        console.log('AuthGuard: User ID does not match profile ID, redirecting to /home');
        this.router.navigate(['/home']);
        return false;
      }
    }

    // Autoriser l'accès si toutes les conditions sont remplies
    return true;
  }
}