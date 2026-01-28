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
  token: string;
  userId: string;
  email: string;
  role: string;
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
    
    // Controlla se esiste il token e se non è scaduto
    if (!token || !user) {
      return false;
    }
    
    // Verifica se il token è scaduto (decodifica il JWT)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isExpired = payload.exp * 1000 < Date.now();
      
      if (isExpired) {
        // Token scaduto, fai logout automatico
        this.logout();
        return false;
      }
      
      return true;
    } catch {
      // Token malformato
      this.logout();
      return false;
    }
  });

  constructor() {
    // Ripristina utente dal localStorage se esiste
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        this.currentUserSignal.set(user);
        
        // Verifica immediatamente se il token è valido
        if (!this.isAuthenticated()) {
          this.logout();
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
        localStorage.setItem('token', res.token);
        localStorage.setItem('currentUser', JSON.stringify(res));
        this.currentUserSignal.set(res);
      })
    );
  }

  register(req: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API}/register`, req).pipe(
      tap((res) => {
        localStorage.setItem('token', res.token);
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