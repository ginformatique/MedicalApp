import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser) {
      // Rediriger vers la page de connexion avec l'URL de retour
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: state.url },
      });
      return false;
    }

    // Vérifier si le rôle de l'utilisateur correspond aux rôles autorisés
    const expectedRoles = route.data['roles'] as string[];
    if (expectedRoles && !expectedRoles.includes(currentUser.role)) {
      // Rediriger vers une page non autorisée ou la page d'accueil
      this.router.navigate(['/home']);
      return false;
    }

    return true;
  }
}