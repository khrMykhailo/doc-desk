import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';


export const authGuard: CanActivateFn = (_, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const isAuthenticated = authService.isAuthenticated();
  
  if (isAuthenticated) {
    return true;
  }

  return router.createUrlTree(['/login'], { 
    queryParams: { returnUrl: state.url } 
  });
}; 