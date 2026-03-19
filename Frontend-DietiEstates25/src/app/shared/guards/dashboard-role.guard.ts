import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const dashboardRoleGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const user = authService.currentUser();
  
  if (!user) {
    router.navigate(['/auth/login']);
    return false;
  }

  const role = user.role?.toLowerCase();
  const path = route.routeConfig?.path || '';

  console.log(`🔒 Guard: ruolo=${role}, path=${path}, url=${state.url}`);

  
  const roleRoutes: { [key: string]: string[] } = {
    'admin': ['home', 'admin-home', 'admin-managers', 'admin-agents', 'admin-agency-info', 'admin-properties'], 
    'agency_manager': ['home', 'manager-home', 'manager-agents', 'manager-properties'], 
    'agent': ['home', 'agent-properties', 'agent-visits', 'agent-offers', 'notifications'],
    'client': ['home', 'saved-searches', 'visits', 'offers', 'notifications']
  };

  
  const allowedRoutes = roleRoutes[role] || [];
  
  
  if (allowedRoutes.includes(path)) {
    console.log(`✅ Accesso consentito a "${path}" per ruolo "${role}"`);
    return true;
  }
  
  
  console.warn(`⚠️ Accesso negato: l'utente con ruolo "${role}" sta tentando di accedere a "${path}"`);
  
  
  let defaultRoute = '/dashboard/home';

  
  router.navigate([defaultRoute]);
  return false;
};
