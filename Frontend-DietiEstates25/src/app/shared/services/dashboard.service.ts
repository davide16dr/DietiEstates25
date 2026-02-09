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
}
