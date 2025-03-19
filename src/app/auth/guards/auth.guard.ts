import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Guard to protect routes that are only accessible to authenticated users
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const isAuthenticated = authService.isAuthenticated();
  
  if (isAuthenticated) {
    return true;
  }
  
  // If user is not authenticated, redirect to login page
  // with a return URL for after authentication
  return router.createUrlTree(['/login'], { 
    queryParams: { returnUrl: state.url } 
  });
}; 