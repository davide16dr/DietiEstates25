import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const dashboardRoleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const user = authService.currentUser();
  
  if (!user) {
    router.navigate(['/auth/login']);
    return false;
  }

  const role = user.role?.toLowerCase();

  // Se l'utente sta accedendo a /dashboard (root), reindirizza alla dashboard corretta
  if (state.url === '/dashboard' || state.url === '/dashboard/') {
    switch (role) {
      case 'admin':
        router.navigate(['/dashboard/admin-home']);
        return false;
      case 'agency_manager':
        router.navigate(['/dashboard/manager-home']);
        return false;
      case 'agent':
        router.navigate(['/dashboard/agent-properties']);
        return false;
      case 'client':
        router.navigate(['/dashboard/home']);
        return false;
      default:
        router.navigate(['/dashboard/home']);
        return false;
    }
  }

  return true;
};
