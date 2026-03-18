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
  totalProperties?: number;
  activeProperties?: number;
  soldProperties?: number;
  rentedProperties?: number;
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
  private apiUrl = `${environment.apiUrl}/users`;

  


  getUsersByRole(role: 'AGENCY_MANAGER' | 'AGENT'): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/by-role/${role}`);
  }

  


  getUserById(userId: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${userId}`);
  }

  


  createUser(userData: CreateUserRequest): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}`, userData);
  }

  


  updateUser(userId: string, userData: UpdateUserRequest): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${userId}`, userData);
  }

  


  toggleUserStatus(userId: string): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${userId}/toggle-status`, {});
  }

  


  deleteUser(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${userId}`);
  }

  


  getManagerStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/manager/stats`);
  }

  


  getAgentsWithStats(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/agents-with-stats`);
  }
}
