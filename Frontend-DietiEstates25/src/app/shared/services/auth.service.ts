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
    return this.http.post<AuthResponse>(`${this.API}/login`, req).pipe(
      tap((res) => {
        console.log('🎯 Login response:', res); // DEBUG
        localStorage.setItem('token', res.accessToken); // Usa accessToken
        localStorage.setItem('currentUser', JSON.stringify(res));
        this.currentUserSignal.set(res);
        console.log('✅ User signal set to:', this.currentUserSignal()); // DEBUG
        console.log('🔐 Is authenticated after login:', this.isAuthenticated()); // DEBUG
      })
    );
  }

  register(req: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API}/register`, req).pipe(
      tap((res) => {
        localStorage.setItem('token', res.accessToken); // Usa accessToken
        localStorage.setItem('currentUser', JSON.stringify(res));
        this.currentUserSignal.set(res);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.currentUserSignal.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
}