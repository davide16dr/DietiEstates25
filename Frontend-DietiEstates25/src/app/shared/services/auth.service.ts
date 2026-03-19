import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

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
  firstName?: string;  
  lastName?: string;   
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/auth`;

  
  private currentUserSignal = signal<AuthResponse | null>(null);
  currentUser = this.currentUserSignal.asReadonly();
  
  
  isAuthenticated = computed(() => {
    const user = this.currentUserSignal();
    const token = this.getToken();
    
    
    if (!token || !user) {
      return false;
    }
    
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isExpired = payload.exp * 1000 < Date.now();
      
      
      if (isExpired) {
        return false;
      }
      
      return true;
    } catch {
      
      return false;
    }
  });

  constructor() {
    
    const stored = localStorage.getItem('currentUser');
    const token = localStorage.getItem('token');
    
    if (stored && token) {
      try {
        const user = JSON.parse(stored);
        
        
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const isExpired = payload.exp * 1000 < Date.now();
          
          if (!isExpired) {
            
            this.currentUserSignal.set(user);
          } else {
            
            localStorage.removeItem('currentUser');
            localStorage.removeItem('token');
          }
        } catch {
          
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

  
  setUserFromOAuth(res: AuthResponse): void {
    this.currentUserSignal.set(res);
  }

  changePassword(userId: string, data: { oldPassword: string; newPassword: string }): Observable<any> {
    return this.http.put(`${environment.apiUrl}/users/${userId}/password`, data);
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API}/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API}/reset-password`, { token, newPassword });
  }
}