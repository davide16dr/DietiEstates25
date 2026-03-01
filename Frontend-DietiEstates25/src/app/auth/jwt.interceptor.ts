import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../shared/services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();

  console.log('🔐 [JWT Interceptor] URL:', req.url);
  console.log('🔐 [JWT Interceptor] Token presente:', !!token);
  console.log('🔐 [JWT Interceptor] Token (primi 20 char):', token?.substring(0, 20));

  // Decodifica e verifica il token
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000; // Converti in secondi
      const isExpired = payload.exp < now;
      
      console.log('🕐 [JWT Interceptor] Token exp:', new Date(payload.exp * 1000).toLocaleString());
      console.log('🕐 [JWT Interceptor] Now:', new Date(now * 1000).toLocaleString());
      console.log('🕐 [JWT Interceptor] Token scaduto?', isExpired);
      console.log('👤 [JWT Interceptor] Subject (userId):', payload.sub);
      console.log('📋 [JWT Interceptor] Payload completo:', payload);
    } catch (e) {
      console.error('❌ [JWT Interceptor] Errore decodifica token:', e);
    }
  }

  // Non attaccare il token alle chiamate di login/register
  const isAuthEndpoint = req.url.includes('/auth/');

  if (token && !isAuthEndpoint) {
    console.log('✅ [JWT Interceptor] Aggiungo Authorization header');
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  } else {
    console.log('❌ [JWT Interceptor] NON aggiungo Authorization header');
  }

  return next(req);
};
