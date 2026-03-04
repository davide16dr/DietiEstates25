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

  // Mappa delle rotte autorizzate per ogni ruolo
  const roleRoutes: { [key: string]: string[] } = {
    'admin': ['home', 'admin-home', 'admin-managers', 'admin-agents', 'admin-agency-info'], 
    'agency_manager': ['home', 'manager-home', 'manager-agents', 'manager-properties'], 
    'agent': ['home', 'agent-properties', 'agent-visits', 'agent-offers'],
    'client': ['home', 'saved-searches', 'visits', 'offers', 'notifications']
  };

  // Ottieni le rotte autorizzate per il ruolo
  const allowedRoutes = roleRoutes[role] || [];
  
  // Se la rotta è autorizzata, permetti l'accesso
  if (allowedRoutes.includes(path)) {
    console.log(`✅ Accesso consentito a "${path}" per ruolo "${role}"`);
    return true;
  }
  
  // Se la rotta NON è autorizzata, reindirizza alla dashboard corretta
  console.warn(`⚠️ Accesso negato: l'utente con ruolo "${role}" sta tentando di accedere a "${path}"`);
  
  // Rotta di defaul
  let defaultRoute = '/dashboard/home';

  
  router.navigate([defaultRoute]);
  return false;
};
