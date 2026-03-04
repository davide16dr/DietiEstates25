import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Notification {
  id: number;
  type: 'PROPERTY_MATCH' | 'VISIT_CONFIRMED' | 'OFFER_UPDATE' | 'COUNTEROFFER' | 'SPECIAL_OFFER';
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  listingId?: number;
  savedSearchId?: number;
}

export interface Visit {
  id: number;
  propertyId: number;
  propertyTitle: string;
  propertyImage?: string;
  propertyAddress: string;
  status: 'REQUESTED' | 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'COMPLETED';
  scheduledDate: string;
  scheduledTime: string;
  agentName: string;
  clientName?: string;
  clientEmail?: string;
  note?: string;
}

export interface Offer {
  id: number;
  propertyId: number;
  propertyTitle: string;
  propertyImage?: string;
  propertyAddress: string;
  amount: number;
  currency?: string;
  status: 'SUBMITTED' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN' | 'COUNTEROFFER';
  counterOfferAmount?: number;
  message?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SavedSearch {
  id: number;
  name: string;
  filters: {
    location?: string;
    propertyType?: string;
    priceMin?: number;
    priceMax?: number;
    bedrooms?: number;
    hasGarden?: boolean;
    hasParking?: boolean;
    hasBalcony?: boolean;
  };
  notificationsEnabled: boolean;
  createdAt: string;
  resultsCount?: number;
}

export interface ClientStats {
  totalVisits: number;
  pendingVisits: number;
  completedVisits: number;
  favoriteProperties: number;
}

export interface AgentStats {
  totalVisits: number;
  pendingVisits: number;
  completedVisits: number;
  todayVisits: number;
  totalProperties: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/client/notifications`).pipe(
      timeout(3000),
      catchError(() => of([]))
    );
  }

  markNotificationAsRead(id: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/client/notifications/${id}/read`, {});
  }

  markAllNotificationsAsRead(): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/client/notifications/read-all`, {});
  }

  deleteNotification(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/client/notifications/${id}`);
  }

  getVisits(): Observable<Visit[]> {
    return this.http.get<Visit[]>(`${this.apiUrl}/client/visits`).pipe(
      timeout(3000),
      catchError(() => of([]))
    );
  }

  cancelVisit(id: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/client/visits/${id}/cancel`, {});
  }

  getOffers(): Observable<Offer[]> {
    return this.http.get<Offer[]>(`${this.apiUrl}/client/offers`).pipe(
      timeout(3000),
      catchError(() => of([]))
    );
  }

  acceptCounterOffer(offerId: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/client/offers/${offerId}/accept-counter`, {});
  }

  submitCounterOffer(offerId: number, amount: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/client/offers/${offerId}/counter`, { amount });
  }

  withdrawOffer(offerId: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/client/offers/${offerId}/withdraw`, {});
  }

  getSavedSearches(): Observable<SavedSearch[]> {
    return this.http.get<SavedSearch[]>(`${this.apiUrl}/client/saved-searches`).pipe(
      timeout(3000),
      catchError(() => of([]))
    );
  }

  toggleSearchNotifications(id: number, enabled: boolean): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/client/saved-searches/${id}/notifications`, { enabled });
  }

  deleteSavedSearch(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/client/saved-searches/${id}`);
  }

  createSavedSearch(search: Partial<SavedSearch>): Observable<SavedSearch> {
    return this.http.post<SavedSearch>(`${this.apiUrl}/client/saved-searches`, search);
  }

  // ============ STATISTICS ============

  getClientStats(): Observable<ClientStats> {
    return this.http.get<ClientStats>(`${this.apiUrl}/dashboard/client/stats`).pipe(
      timeout(3000),
      catchError(() => of({ totalVisits: 0, pendingVisits: 0, completedVisits: 0, favoriteProperties: 0 }))
    );
  }

  getAgentStats(): Observable<AgentStats> {
    return this.http.get<AgentStats>(`${this.apiUrl}/dashboard/agent/stats`).pipe(
      timeout(3000),
      catchError(() => of({ totalVisits: 0, pendingVisits: 0, completedVisits: 0, todayVisits: 0, totalProperties: 0 }))
    );
  }

  // ============ AGENT VISITS ============

  getAgentVisits(): Observable<Visit[]> {
    return this.http.get<Visit[]>(`${this.apiUrl}/agent/visits`).pipe(
      timeout(3000),
      catchError(() => of([]))
    );
  }

  // ============ CREATE VISIT ============

  createVisit(propertyId: string, date: string, time?: string, notes?: string): Observable<Visit> {
    // Convert date and time to ISO format (Instant)
    let scheduledFor: string;
    
    if (time) {
      scheduledFor = new Date(`${date}T${time}:00`).toISOString();
    } else {
      scheduledFor = new Date(`${date}T10:00:00`).toISOString();
    }

    return this.http.post<Visit>(`${this.apiUrl}/client/visits`, {
      listingId: propertyId,
      scheduledFor: scheduledFor,
      notes: notes
    });
  }

  confirmVisit(id: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/agent/visits/${id}/confirm`, {});
  }

  completeVisit(id: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/agent/visits/${id}/complete`, {});
  }

  rejectVisit(id: number, reason?: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/agent/visits/${id}/reject`, { reason });
  }
}
