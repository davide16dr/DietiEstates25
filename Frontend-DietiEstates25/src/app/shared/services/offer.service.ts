import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { environment } from '../../../environments/environment';


export type OfferStatus = 'SUBMITTED' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN' | 'COUNTEROFFER';

export interface OfferRequest {
  propertyId: string; 
  amount: number;
  message?: string;
}

export interface CounterOfferRequest {
  offerId: string; 
  amount: number;
  message?: string;
}

export interface OfferResponse {
  id: string; 
  propertyId: string; 
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
  private apiUrl = environment.apiUrl; 

  

  


  getMyOffers(): Observable<OfferResponse[]> {
    return this.http.get<OfferResponse[]>(`${this.apiUrl}/client/offers`).pipe(
      timeout(5000),
      catchError(() => of([]))
    );
  }

  


  submitOffer(request: OfferRequest): Observable<OfferResponse> {
    return this.http.post<OfferResponse>(`${this.apiUrl}/client/offers`, request).pipe(
      timeout(5000),
      catchError((error) => {
        console.error('Error submitting offer:', error);
        
        
        if (error.name === 'TimeoutError' || error.status === 0 || error.status === 404) {
          console.log('🔄 Backend non disponibile, uso mock data');
          
          
          const mockResponse: OfferResponse = {
            id: crypto.randomUUID(),
            propertyId: request.propertyId,
            propertyTitle: 'Proprietà #' + request.propertyId,
            propertyAddress: 'Indirizzo simulato',
            propertyPrice: request.amount * 1.1, 
            amount: request.amount,
            currency: 'EUR',
            status: 'SUBMITTED',
            message: request.message,
            createdAt: new Date().toISOString()
          };
          
          
          return new Observable<OfferResponse>(subscriber => {
            setTimeout(() => {
              subscriber.next(mockResponse);
              subscriber.complete();
            }, 500);
          });
        }
        
        
        throw error;
      })
    );
  }

  


  acceptCounterOffer(offerId: string): Observable<void> {
    console.log('✅ acceptCounterOffer - ID:', offerId);
    return this.http.patch<void>(`${this.apiUrl}/client/offers/${offerId}/accept-counter`, null).pipe(
      timeout(5000),
      catchError((error) => {
        console.error('❌ Error accepting counter offer:', error);
        throw error;
      })
    );
  }

  


  submitCounterToCounter(offerId: string, amount: number, message?: string): Observable<void> {
    const body: any = {
      amount,
      message: message || 'Controproposta del cliente' // Invia sempre un message valido
    };
    return this.http.post<void>(`${this.apiUrl}/client/offers/${offerId}/counter`, body).pipe(
      timeout(5000),
      catchError((error) => {
        console.error('Error submitting counter offer:', error);
        throw error;
      })
    );
  }

  


  withdrawOffer(offerId: string): Observable<void> {
    console.log('🔙 withdrawOffer - ID:', offerId);
    return this.http.patch<void>(`${this.apiUrl}/client/offers/${offerId}/withdraw`, null).pipe(
      timeout(5000),
      catchError((error) => {
        console.error('❌ Error withdrawing offer:', error);
        throw error;
      })
    );
  }

  

  


  getAgentOffers(): Observable<OfferResponse[]> {
    return this.http.get<OfferResponse[]>(`${this.apiUrl}/agent/offers`).pipe(
      timeout(5000),
      catchError(() => of([]))
    );
  }

  


  getReceivedOffers(): Observable<OfferResponse[]> {
    return this.getAgentOffers();
  }

  


  getPropertyOffers(propertyId: string): Observable<OfferResponse[]> {
    return this.http.get<OfferResponse[]>(`${this.apiUrl}/agent/properties/${propertyId}/offers`).pipe(
      timeout(5000),
      catchError(() => of([]))
    );
  }

  


  acceptOffer(offerId: string): Observable<void> {
    console.log('✅ acceptOffer - ID:', offerId);
    return this.http.patch<void>(`${this.apiUrl}/agent/offers/${offerId}/accept`, null).pipe(
      timeout(5000),
      catchError((error) => {
        console.error('❌ Error accepting offer:', error);
        console.error('   Status:', error.status);
        console.error('   StatusText:', error.statusText);
        throw error;
      })
    );
  }

  


  rejectOffer(offerId: string, reason?: string): Observable<void> {
    const body = {
      reason: reason || 'Offerta non idonea'
    };
    console.log('🔴 rejectOffer - ID:', offerId);
    console.log('📋 Body:', JSON.stringify(body));
    console.log('🌐 URL:', `${this.apiUrl}/agent/offers/${offerId}/reject`);
    
    return this.http.patch<void>(`${this.apiUrl}/agent/offers/${offerId}/reject`, body).pipe(
      timeout(5000),
      catchError((error) => {
        console.error('❌ Error rejecting offer:', error);
        console.error('   Status:', error.status);
        console.error('   StatusText:', error.statusText);
        console.error('   Message:', error.message);
        throw error;
      })
    );
  }

  


  makeCounterOffer(offerId: string, amount: number, message?: string): Observable<void> {
    const body: any = {
      amount,
      message: message || 'Controproposta dell\'agente' // Invia sempre un message valido
    };
    return this.http.post<void>(`${this.apiUrl}/agent/offers/${offerId}/counter`, body).pipe(
      timeout(5000),
      catchError((error) => {
        console.error('Error making counter offer:', error);
        throw error;
      })
    );
  }

  


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
