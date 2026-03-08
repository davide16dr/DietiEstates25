import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'CLIENT' | 'AGENT' | 'AGENCY_MANAGER' | 'ADMIN';
}

export interface RegisterBusinessRequest {
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  vatNumber: string;
  city: string;
  address?: string;
  phoneE164: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  userId: string;
  email: string;
  role: string;
  firstName?: string;  // firstName opzionale
  lastName?: string;   // lastName opzionale
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private readonly API = 'http://localhost:8080/auth';

  // Uso signals invece di BehaviorSubject
  private currentUserSignal = signal<AuthResponse | null>(null);
  currentUser = this.currentUserSignal.asReadonly();
  
  // Computed signal per verificare l'autenticazione
  isAuthenticated = computed(() => {
    const user = this.currentUserSignal();
    const token = this.getToken();
    
    // Controlla se esiste il token e l'utente
    if (!token || !user) {
      return false;
    }
    
    // Verifica se il token è scaduto (decodifica il JWT)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isExpired = payload.exp * 1000 < Date.now();
      
      // Se scaduto, ritorna false
      if (isExpired) {
        return false;
      }
      
      return true;
    } catch {
      // Token malformato
      return false;
    }
  });

  constructor() {
    // Ripristina utente dal localStorage se esiste
    const stored = localStorage.getItem('currentUser');
    const token = localStorage.getItem('token');
    
    if (stored && token) {
      try {
        const user = JSON.parse(stored);
        
        // Verifica se il token è valido PRIMA di settare il signal
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const isExpired = payload.exp * 1000 < Date.now();
          
          if (!isExpired) {
            // Token valido, imposta l'utente
            this.currentUserSignal.set(user);
          } else {
            // Token scaduto, pulisco localStorage
            localStorage.removeItem('currentUser');
            localStorage.removeItem('token');
          }
        } catch {
          // Token malformato, pulisco localStorage
          localStorage.removeItem('currentUser');
          localStorage.removeItem('token');
        }
      } catch {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
      }
    }
  }

  login(req: LoginRequest): Observable<AuthResponse> {
    // Normalizza l'email a minuscolo
    const normalizedReq = {
      ...req,
      email: req.email.toLowerCase().trim()
    };
    
    console.log('📝 Login request:', normalizedReq);
    
    return this.http.post<AuthResponse>(`${this.API}/login`, normalizedReq).pipe(
      tap((res) => {
        console.log('✅ Login response:', res);
        localStorage.setItem('token', res.accessToken);
        localStorage.setItem('currentUser', JSON.stringify(res));
        this.currentUserSignal.set(res);
        console.log('✅ User signal set to:', this.currentUserSignal());
        console.log('🔐 Is authenticated after login:', this.isAuthenticated());
      })
    );
  }

  register(req: RegisterRequest): Observable<AuthResponse> {
    // Normalizza l'email a minuscolo
    const normalizedReq = {
      ...req,
      email: req.email.toLowerCase().trim()
    };
    
    return this.http.post<AuthResponse>(`${this.API}/register`, normalizedReq).pipe(
      tap((res) => {
        localStorage.setItem('token', res.accessToken);
        localStorage.setItem('currentUser', JSON.stringify(res));
        this.currentUserSignal.set(res);
      })
    );
  }

  registerBusiness(req: RegisterBusinessRequest): Observable<any> {
    // Normalizza l'email a minuscolo
    const normalizedReq = {
      ...req,
      email: req.email.toLowerCase().trim()
    };
    
    return this.http.post<any>(`${this.API}/register-business`, normalizedReq);
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.currentUserSignal.set(null);
  }

  getToken(): string | null {
    const token = localStorage.getItem('token');
    console.log('🔑 [AuthService.getToken()] Token recuperato:', token ? `${token.substring(0, 20)}...` : 'NULL');
    return token;
  }

  getCurrentUserId(): string | null {
    const user = this.currentUserSignal();
    return user?.userId ?? null;
  }

  /** Usato da OAuthService per aggiornare il signal dopo autenticazione social */
  setUserFromOAuth(res: AuthResponse): void {
    this.currentUserSignal.set(res);
  }

  changePassword(userId: string, data: { oldPassword: string; newPassword: string }): Observable<any> {
    return this.http.put(`http://localhost:8080/api/users/${userId}/password`, data);
  }
}