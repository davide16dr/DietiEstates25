import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OfferService, OfferResponse, OfferStats } from '../../../shared/services/offer.service';

@Component({
  selector: 'app-agent-offers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agent-offers.component.html',
  styleUrl: './agent-offers.component.scss',
})
export class AgentOffersComponent implements OnInit {
  private offerService = inject(OfferService);
  private router = inject(Router);

  offers = signal<OfferResponse[]>([]);
  stats = signal<OfferStats>({ total: 0, pending: 0, accepted: 0, rejected: 0, counteroffers: 0 });
  loading = signal(true);
  
  // Counter offer modal
  showCounterModal = signal(false);
  selectedOffer = signal<OfferResponse | null>(null);
  counterAmount = signal<number | null>(null);
  counterMessage = signal<string>('');

  // Reject modal
  showRejectModal = signal(false);
  rejectReason = signal<string>('');

  ngOnInit(): void {
    this.loadOffers();
    this.loadStats();
  }

  loadOffers(): void {
    this.loading.set(true);
    this.offerService.getAgentOffers().subscribe({
      next: (offers) => {
        this.offers.set(offers);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading offers:', error);
        this.loading.set(false);
        // Use mock data for development
        this.offers.set(this.getMockOffers());
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
        // Calculate from loaded offers
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
  }

  private getMockOffers(): OfferResponse[] {
    return [
      {
        id: '1',
        propertyId: '101',
        propertyTitle: 'Appartamento moderno',
        propertyAddress: 'Milano Centro',
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
    if (confirm(`Sei sicuro di voler accettare l'offerta di ${this.formatCurrency(offer.amount)} da ${offer.clientName}?`)) {
      this.offerService.acceptOffer(offer.id).subscribe({
        next: () => {
          // Update local state
          const updated = this.offers().map(o => 
            o.id === offer.id ? { ...o, status: 'ACCEPTED' as const, updatedAt: new Date().toISOString() } : o
          );
          this.offers.set(updated);
          this.updateStatsFromOffers();
        },
        error: (error) => {
          console.error('Error accepting offer:', error);
          alert('Errore nell\'accettazione dell\'offerta. Riprova più tardi.');
        }
      });
    }
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
        // Update local state
        const updated = this.offers().map(o => 
          o.id === offer.id ? { ...o, status: 'REJECTED' as const, updatedAt: new Date().toISOString() } : o
        );
        this.offers.set(updated);
        this.updateStatsFromOffers();
        this.closeRejectModal();
      },
      error: (error) => {
        console.error('Error rejecting offer:', error);
        alert('Errore nel rifiuto dell\'offerta. Riprova più tardi.');
      }
    });
  }

  openCounterModal(offer: OfferResponse): void {
    this.selectedOffer.set(offer);
    // Suggest a counter offer between their offer and asking price
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

    // Validate counter offer amount
    if (amount <= offer.amount) {
      alert('La controproposta deve essere maggiore dell\'offerta ricevuta.');
      return;
    }

    if (amount > offer.propertyPrice) {
      alert('La controproposta non può essere maggiore del prezzo richiesto.');
      return;
    }

    this.offerService.makeCounterOffer(offer.id, amount, message || undefined).subscribe({
      next: () => {
        // Update local state
        const updated = this.offers().map(o => 
          o.id === offer.id 
            ? { 
                ...o, 
                status: 'COUNTEROFFER' as const, 
                counterOfferAmount: amount,
                counterMessage: message,
                updatedAt: new Date().toISOString() 
              }
            : o
        );
        this.offers.set(updated);
        this.updateStatsFromOffers();
        this.closeCounterModal();
      },
      error: (error) => {
        console.error('Error making counter offer:', error);
        alert('Errore nell\'invio della controproposta. Riprova più tardi.');
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
