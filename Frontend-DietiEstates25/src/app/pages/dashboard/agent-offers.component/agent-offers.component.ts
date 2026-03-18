import { Component, OnInit, OnDestroy, inject, signal, computed, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OfferService, OfferResponse, OfferStats } from '../../../shared/services/offer.service';
import { ToastService } from '../../../shared/services/toast.service';
import { WebSocketService, WebSocketNotification } from '../../../shared/services/websocket.service';

@Component({
  selector: 'app-agent-offers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agent-offers.component.html',
  styleUrl: './agent-offers.component.scss',
})
export class AgentOffersComponent implements OnInit, OnDestroy {
  private offerService = inject(OfferService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private webSocketService = inject(WebSocketService);
  private ngZone = inject(NgZone);
  private notificationCallback?: (notification: WebSocketNotification) => void;

  offers = signal<OfferResponse[]>([]);
  stats = signal<OfferStats>({ total: 0, pending: 0, accepted: 0, rejected: 0, counteroffers: 0 });
  loading = signal(true);
  
  
  activeFilter = signal<'all' | 'pending' | 'counter' | 'accepted' | 'rejected' | 'withdrawn'>('all');
  
  
  showCounterModal = signal(false);
  selectedOffer = signal<OfferResponse | null>(null);
  counterAmount = signal<number | null>(null);
  counterMessage = signal<string>('');

  
  showRejectModal = signal(false);
  rejectReason = signal<string>('');

  ngOnInit(): void {
    console.log('🎯 AgentOffersComponent inizializzato - setup WebSocket listener');
    this.loadOffers();
    
    
    this.notificationCallback = (notification: WebSocketNotification) => {
      console.log('🔔 Notifica WebSocket ricevuta (agente):', notification);
      console.log('   - Type:', notification.type);
      console.log('   - Title:', notification.title);
      console.log('   - OfferId:', notification.offerId);
      
      
      if (notification.offerId || this.isOfferNotification(notification.type)) {
        console.log('💰 ✅ RICARICA offerte in tempo reale (agente)...');
        this.ngZone.run(() => this.loadOffers());
      } else {
        console.log('💰 ⏭️ Notifica ignorata - non relativa alle offerte');
      }
    };
    
    this.webSocketService.onNotification(this.notificationCallback);
    console.log('✅ WebSocket listener registrato per AgentOffersComponent');
  }

  ngOnDestroy(): void {
    console.log('🧹 AgentOffersComponent distrutto - rimozione WebSocket listener');
    
    if (this.notificationCallback) {
      this.webSocketService.removeNotificationCallback(this.notificationCallback);
    }
  }
  
  



  private isOfferNotification(type: string): boolean {
    if (!type) return false;
    
    const typeUpper = type.toUpperCase();
    
    
    return typeUpper.includes('OFFER') || typeUpper.includes('COUNTER');
  }

  loadOffers(): void {
    console.log('📥 Caricamento offerte ricevute...');
    this.loading.set(true);
    this.offerService.getReceivedOffers().subscribe({
      next: (offers) => {
        console.log('✅ Offerte ricevute caricate:', offers.length, 'offerte');
        this.offers.set(offers);
        
        this.updateStatsFromOffers();
        this.loading.set(false);
      },
      error: (error) => {
        console.error('❌ Errore caricamento offerte ricevute:', error);
        this.loading.set(false);
      }
    });
  }

  loadStats(): void {
    this.offerService.getOfferStats().subscribe({
      next: (stats) => {
        this.stats.set(stats);
      },
      error: (error) => {
        console.error('Error loading stats:', error);
        
        this.updateStatsFromOffers();
      }
    });
  }

  private updateStatsFromOffers(): void {
    const offers = this.offers();
    this.stats.set({
      total: offers.length,
      pending: offers.filter(o => o.status === 'SUBMITTED').length,
      accepted: offers.filter(o => o.status === 'ACCEPTED').length,
      rejected: offers.filter(o => o.status === 'REJECTED').length,
      counteroffers: offers.filter(o => o.status === 'COUNTEROFFER').length
    });
    console.log('📊 Statistiche aggiornate:', this.stats());
  }

  private getMockOffers(): OfferResponse[] {
    return [
      {
        id: '1',
        propertyId: '101',
        propertyTitle: 'Appartamento moderno',
        propertyAddress: 'Napoli Centro',
        propertyPrice: 350000,
        clientName: 'Mario Rossi',
        clientEmail: 'mario.rossi@email.com',
        amount: 330000,
        currency: 'EUR',
        status: 'SUBMITTED',
        message: 'Cliente molto interessato, prima casa',
        createdAt: '2026-02-10T10:00:00Z'
      },
      {
        id: '2',
        propertyId: '102',
        propertyTitle: 'Villa con giardino',
        propertyAddress: 'Roma Nord',
        propertyPrice: 750000,
        clientName: 'Laura Bianchi',
        clientEmail: 'laura.bianchi@email.com',
        amount: 700000,
        currency: 'EUR',
        status: 'COUNTEROFFER',
        counterOfferAmount: 730000,
        message: 'Offerta seria, cliente prequalificato',
        counterMessage: 'Controproposta inviata, in attesa di risposta',
        createdAt: '2026-02-08T10:00:00Z',
        updatedAt: '2026-02-09T14:00:00Z'
      },
      {
        id: '3',
        propertyId: '103',
        propertyTitle: 'Attico panoramico',
        propertyAddress: 'Firenze Centro',
        propertyPrice: 580000,
        clientName: 'Giuseppe Verdi',
        clientEmail: 'g.verdi@email.com',
        amount: 560000,
        currency: 'EUR',
        status: 'ACCEPTED',
        message: 'Ottima offerta',
        createdAt: '2026-02-05T10:00:00Z',
        updatedAt: '2026-02-06T16:00:00Z'
      }
    ];
  }

  pendingOffers = computed(() => {
    return this.offers().filter(o => o.status === 'SUBMITTED');
  });

  counterOffers = computed(() => {
    return this.offers().filter(o => o.status === 'COUNTEROFFER');
  });

  closedOffers = computed(() => {
    return this.offers().filter(o => ['ACCEPTED', 'REJECTED', 'WITHDRAWN'].includes(o.status));
  });

  
  filteredOffers = computed(() => {
    const allOffers = this.offers();
    const filter = this.activeFilter();

    switch (filter) {
      case 'pending':
        return allOffers.filter(o => o.status === 'SUBMITTED');
      case 'counter':
        return allOffers.filter(o => o.status === 'COUNTEROFFER');
      case 'accepted':
        return allOffers.filter(o => o.status === 'ACCEPTED');
      case 'rejected':
        return allOffers.filter(o => o.status === 'REJECTED');
      case 'withdrawn':
        return allOffers.filter(o => o.status === 'WITHDRAWN');
      default:
        return allOffers;
    }
  });

  
  setFilter(filter: 'all' | 'pending' | 'counter' | 'accepted' | 'rejected' | 'withdrawn'): void {
    this.activeFilter.set(filter);
  }

  formatCurrency(amount: number): string {
    return this.offerService.formatCurrency(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  getStatusLabel(status: string): string {
    return this.offerService.getStatusLabel(status);
  }

  getStatusClass(status: string): string {
    return this.offerService.getStatusClass(status);
  }

  getDifference(propertyPrice: number, offerAmount: number): number {
    return this.offerService.calculateDifference(propertyPrice, offerAmount);
  }

  getDifferencePercent(propertyPrice: number, offerAmount: number): number {
    return this.offerService.calculateDifferencePercent(propertyPrice, offerAmount);
  }

  acceptOffer(offer: OfferResponse): void {
    this.offerService.acceptOffer(offer.id).subscribe({
        next: () => {
          
          this.loadOffers();
          this.loadStats();
          this.toast.success(
            'Offerta Accettata!',
            `L'offerta di ${offer.clientName} è stata accettata. Il cliente ha ricevuto una notifica.`
          );
        },
        error: (error) => {
          console.error('Error accepting offer:', error);
          this.toast.error(
            'Errore',
            'Impossibile accettare l\'offerta. Riprova più tardi.'
          );
        }
      });
  }

  openRejectModal(offer: OfferResponse): void {
    this.selectedOffer.set(offer);
    this.rejectReason.set('');
    this.showRejectModal.set(true);
  }

  closeRejectModal(): void {
    this.showRejectModal.set(false);
    this.selectedOffer.set(null);
    this.rejectReason.set('');
  }

  confirmReject(): void {
    const offer = this.selectedOffer();
    const reason = this.rejectReason();
    
    if (!offer) return;

    this.offerService.rejectOffer(offer.id, reason || undefined).subscribe({
      next: () => {
        
        this.loadOffers();
        this.loadStats();
        this.closeRejectModal();
        this.toast.success(
          'Offerta Rifiutata',
          `L'offerta di ${offer.clientName} è stata rifiutata. Il cliente ha ricevuto una notifica.`
        );
      },
      error: (error) => {
        console.error('Error rejecting offer:', error);
        this.toast.error(
          'Errore',
          'Impossibile rifiutare l\'offerta. Riprova più tardi.'
        );
        this.closeRejectModal();
      }
    });
  }

  openCounterModal(offer: OfferResponse): void {
    this.selectedOffer.set(offer);
    
    const suggestedAmount = Math.round((offer.amount + offer.propertyPrice) / 2);
    this.counterAmount.set(suggestedAmount);
    this.counterMessage.set('');
    this.showCounterModal.set(true);
  }

  closeCounterModal(): void {
    this.showCounterModal.set(false);
    this.selectedOffer.set(null);
    this.counterAmount.set(null);
    this.counterMessage.set('');
  }

  submitCounterOffer(): void {
    const offer = this.selectedOffer();
    const amount = this.counterAmount();
    const message = this.counterMessage();
    
    if (!offer || !amount) return;

    
    if (amount <= offer.amount) {
      this.toast.warning(
        'Importo non valido',
        'La controproposta deve essere maggiore dell\'offerta ricevuta.'
      );
      return;
    }

    if (amount > offer.propertyPrice) {
      this.toast.warning(
        'Importo non valido',
        'La controproposta non può essere maggiore del prezzo richiesto.'
      );
      return;
    }

    this.offerService.makeCounterOffer(offer.id, amount, message || undefined).subscribe({
      next: () => {
        
        this.loadOffers();
        this.loadStats();
        this.closeCounterModal();
        this.toast.success(
          'Controproposta Inviata!',
          `La tua controproposta di ${this.formatCurrency(amount)} è stata inviata a ${offer.clientName}.`
        );
      },
      error: (error) => {
        console.error('Error making counter offer:', error);
        this.toast.error(
          'Errore',
          'Impossibile inviare la controproposta. Riprova più tardi.'
        );
        this.closeCounterModal();
      }
    });
  }

  viewProperty(propertyId: string): void {
    this.router.navigate(['/properties', propertyId]);
  }

  contactClient(email: string): void {
    window.location.href = `mailto:${email}`;
  }
}
