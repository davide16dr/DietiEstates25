import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneE164: string;
  role: 'ADMIN' | 'AGENCY_MANAGER' | 'AGENT' | 'CLIENT';
  active: boolean;
  agencyId?: string;
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  phoneE164: string;
  role: 'ADMIN' | 'AGENCY_MANAGER' | 'AGENT' | 'CLIENT';
  agencyId?: string;
  password: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phoneE164?: string;
  active?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/users`;

  /**
   * Recupera tutti gli utenti di un'agenzia filtrati per ruolo
   */
  getUsersByRole(role: 'AGENCY_MANAGER' | 'AGENT'): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/by-role/${role}`);
  }

  /**
   * Recupera un utente per ID
   */
  getUserById(userId: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${userId}`);
  }

  /**
   * Crea un nuovo utente (manager o agente)
   */
  createUser(userData: CreateUserRequest): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}`, userData);
  }

  /**
   * Aggiorna un utente esistente
   */
  updateUser(userId: string, userData: UpdateUserRequest): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${userId}`, userData);
  }

  /**
   * Attiva o disattiva un utente
   */
  toggleUserStatus(userId: string): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${userId}/toggle-status`, {});
  }

  /**
   * Elimina un utente
   */
  deleteUser(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${userId}`);
  }

  /**
   * Recupera le statistiche per la dashboard del manager
   */
  getManagerStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/manager/stats`);
  }
}
