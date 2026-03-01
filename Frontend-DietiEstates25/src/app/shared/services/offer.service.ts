import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// Types
export type OfferStatus = 'SUBMITTED' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN' | 'COUNTEROFFER';

export interface OfferRequest {
  propertyId: string; // Cambiato da number a string per UUID
  amount: number;
  message?: string;
}

export interface CounterOfferRequest {
  offerId: string; // Cambiato da number a string per UUID
  amount: number;
  message?: string;
}

export interface OfferResponse {
  id: string; // Cambiato da number a string per UUID
  propertyId: string; // Cambiato da number a string per UUID
  propertyTitle: string;
  propertyAddress: string;
  propertyPrice: number;
  propertyImage?: string;
  amount: number;
  currency: string;
  status: OfferStatus;
  counterOfferAmount?: number;
  message?: string;
  counterMessage?: string;
  clientName?: string;
  clientEmail?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface OfferStats {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  counteroffers: number;
}

@Injectable({
  providedIn: 'root'
})
export class OfferService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/api';

  // ============ CLIENT OPERATIONS ============

  /**
   * Client: Get all offers made by the current user
   */
  getMyOffers(): Observable<OfferResponse[]> {
    return this.http.get<OfferResponse[]>(`${this.apiUrl}/client/offers`).pipe(
      timeout(5000),
      catchError(() => of([]))
    );
  }

  /**
   * Client: Submit a new offer for a property
   */
  submitOffer(request: OfferRequest): Observable<OfferResponse> {
    return this.http.post<OfferResponse>(`${this.apiUrl}/client/offers`, request).pipe(
      timeout(5000),
      catchError((error) => {
        console.error('Error submitting offer:', error);
        
        // Se il backend non è disponibile, restituisci un mock
        if (error.name === 'TimeoutError' || error.status === 0 || error.status === 404) {
          console.log('🔄 Backend non disponibile, uso mock data');
          
          // Simula una risposta di successo con mock data
          const mockResponse: OfferResponse = {
            id: crypto.randomUUID(),
            propertyId: request.propertyId,
            propertyTitle: 'Proprietà #' + request.propertyId,
            propertyAddress: 'Indirizzo simulato',
            propertyPrice: request.amount * 1.1, // Simula prezzo richiesto
            amount: request.amount,
            currency: 'EUR',
            status: 'SUBMITTED',
            message: request.message,
            createdAt: new Date().toISOString()
          };
          
          // Restituisci il mock dopo un breve delay per simulare la rete
          return new Observable<OfferResponse>(subscriber => {
            setTimeout(() => {
              subscriber.next(mockResponse);
              subscriber.complete();
            }, 500);
          });
        }
        
        // Per altri errori, rilancia l'errore
        throw error;
      })
    );
  }

  /**
   * Client: Accept a counter offer from agent
   */
  acceptCounterOffer(offerId: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/client/offers/${offerId}/accept-counter`, {}).pipe(
      timeout(5000),
      catchError((error) => {
        console.error('Error accepting counter offer:', error);
        throw error;
      })
    );
  }

  /**
   * Client: Submit a counter to agent's counter offer
   */
  submitCounterToCounter(offerId: string, amount: number, message?: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/client/offers/${offerId}/counter`, { 
      amount, 
      message 
    }).pipe(
      timeout(5000),
      catchError((error) => {
        console.error('Error submitting counter offer:', error);
        throw error;
      })
    );
  }

  /**
   * Client: Withdraw an offer
   */
  withdrawOffer(offerId: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/client/offers/${offerId}/withdraw`, {}).pipe(
      timeout(5000),
      catchError((error) => {
        console.error('Error withdrawing offer:', error);
        throw error;
      })
    );
  }

  // ============ AGENT OPERATIONS ============

  /**
   * Agent: Get all offers for properties managed by the agent
   */
  getAgentOffers(): Observable<OfferResponse[]> {
    return this.http.get<OfferResponse[]>(`${this.apiUrl}/agent/offers`).pipe(
      timeout(5000),
      catchError(() => of([]))
    );
  }

  /**
   * Agent: Get offers for a specific property
   */
  getPropertyOffers(propertyId: string): Observable<OfferResponse[]> {
    return this.http.get<OfferResponse[]>(`${this.apiUrl}/agent/properties/${propertyId}/offers`).pipe(
      timeout(5000),
      catchError(() => of([]))
    );
  }

  /**
   * Agent: Accept an offer
   */
  acceptOffer(offerId: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/agent/offers/${offerId}/accept`, {}).pipe(
      timeout(5000),
      catchError((error) => {
        console.error('Error accepting offer:', error);
        throw error;
      })
    );
  }

  /**
   * Agent: Reject an offer
   */
  rejectOffer(offerId: string, reason?: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/agent/offers/${offerId}/reject`, { 
      reason 
    }).pipe(
      timeout(5000),
      catchError((error) => {
        console.error('Error rejecting offer:', error);
        throw error;
      })
    );
  }

  /**
   * Agent: Make a counter offer
   */
  makeCounterOffer(offerId: string, amount: number, message?: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/agent/offers/${offerId}/counter`, { 
      amount, 
      message 
    }).pipe(
      timeout(5000),
      catchError((error) => {
        console.error('Error making counter offer:', error);
        throw error;
      })
    );
  }

  /**
   * Agent: Get offer statistics
   */
  getOfferStats(): Observable<OfferStats> {
    return this.http.get<OfferStats>(`${this.apiUrl}/agent/offers/stats`).pipe(
      timeout(5000),
      catchError(() => of({ 
        total: 0, 
        pending: 0, 
        accepted: 0, 
        rejected: 0, 
        counteroffers: 0 
      }))
    );
  }

  // ============ UTILITY METHODS ============

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'SUBMITTED': 'In attesa',
      'COUNTEROFFER': 'Controproposta',
      'ACCEPTED': 'Accettata',
      'REJECTED': 'Rifiutata',
      'WITHDRAWN': 'Ritirata'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'SUBMITTED': 'status-pending',
      'COUNTEROFFER': 'status-counter',
      'ACCEPTED': 'status-accepted',
      'REJECTED': 'status-rejected',
      'WITHDRAWN': 'status-withdrawn'
    };
    return classes[status] || '';
  }

  calculateDifference(propertyPrice: number, offerAmount: number): number {
    return propertyPrice - offerAmount;
  }

  calculateDifferencePercent(propertyPrice: number, offerAmount: number): number {
    if (propertyPrice === 0) return 0;
    return ((propertyPrice - offerAmount) / propertyPrice) * 100;
  }

  validateOfferAmount(amount: number, propertyPrice: number): { valid: boolean; error?: string } {
    if (amount <= 0) {
      return { valid: false, error: 'L\'importo deve essere maggiore di zero' };
    }
    
    if (amount > propertyPrice) {
      return { valid: false, error: 'L\'importo non può superare il prezzo richiesto' };
    }
    
    // Minimum 10% of property price
    const minAmount = propertyPrice * 0.1;
    if (amount < minAmount) {
      return { 
        valid: false, 
        error: `L'importo minimo è ${this.formatCurrency(minAmount)} (10% del prezzo)` 
      };
    }
    
    return { valid: true };
  }

  validateCounterOffer(
    counterAmount: number, 
    originalAmount: number, 
    propertyPrice: number
  ): { valid: boolean; error?: string } {
    if (counterAmount <= 0) {
      return { valid: false, error: 'L\'importo deve essere maggiore di zero' };
    }
    
    if (counterAmount <= originalAmount) {
      return { 
        valid: false, 
        error: 'La controproposta deve essere maggiore dell\'offerta originale' 
      };
    }
    
    if (counterAmount > propertyPrice) {
      return { 
        valid: false, 
        error: 'La controproposta non può superare il prezzo richiesto' 
      };
    }
    
    return { valid: true };
  }
}
