import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AdminStats {
  gestori: { totali: number; attivi: number };
  agenti: { totali: number; attivi: number };
  agencyInfo: {
    name: string;
    city: string;
    address: string;
    status: string;
  };
  recentManagers: Array<{
    id: string;
    name: string;
    email: string;
    status: string;
  }>;
  recentAgents: Array<{
    id: string;
    name: string;
    email: string;
    status: string;
  }>;
}

export interface AgencyDetails {
  id: string;
  name: string;
  vatNumber: string;
  email: string;
  phoneE164: string;
  address: string;
  city: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getAdminStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.apiUrl}/admin/stats`);
  }

  getAgencyDetails(): Observable<AgencyDetails> {
    return this.http.get<AgencyDetails>(`${this.apiUrl}/admin/agency`);
  }

  updateAgencyDetails(agencyId: string, data: Partial<AgencyDetails>): Observable<AgencyDetails> {
    return this.http.put<AgencyDetails>(`${this.apiUrl}/admin/agency/${agencyId}`, data);
  }
}
