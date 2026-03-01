import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OfferService, OfferResponse } from '../../../shared/services/offer.service';

@Component({
  selector: 'app-my-offers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './my-offers.component.html',
  styleUrl: './my-offers.component.scss'
})
export class MyOffersComponent implements OnInit {
  private offerService = inject(OfferService);
  private router = inject(Router);

  offers = signal<OfferResponse[]>([]);
  loading = signal(true);
  activeTab = signal<'active' | 'closed'>('active');
  
  // Counter offer modal
  showCounterModal = signal(false);
  selectedOffer = signal<OfferResponse | null>(null);
  counterAmount = signal<number | null>(null);
  counterMessage = signal<string>('');

  ngOnInit(): void {
    this.loadOffers();
  }

  loadOffers(): void {
    this.loading.set(true);
    this.offerService.getMyOffers().subscribe({
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

  private getMockOffers(): OfferResponse[] {
    return [
      {
        id: '1',
        propertyId: '101',
        propertyTitle: 'Appartamento Centro Storico',
        propertyAddress: 'Via Roma 123, Milano',
        propertyPrice: 890000,
        amount: 850000,
        currency: 'EUR',
        status: 'COUNTEROFFER',
        counterOfferAmount: 870000,
        message: 'Offerta per acquisto immediato.',
        counterMessage: 'Possiamo accordarci su questa cifra.',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-16T14:00:00Z'
      },
      {
        id: '2',
        propertyId: '102',
        propertyTitle: 'Villa con Giardino',
        propertyAddress: 'Via Verdi 45, Milano',
        propertyPrice: 750000,
        amount: 720000,
        currency: 'EUR',
        status: 'SUBMITTED',
        message: 'Disponibili a chiusura entro 60 giorni.',
        createdAt: '2024-01-20T10:00:00Z',
        updatedAt: '2024-01-20T10:00:00Z'
      },
      {
        id: '3',
        propertyId: '103',
        propertyTitle: 'Attico con Terrazza',
        propertyAddress: 'Corso Italia 88, Roma',
        propertyPrice: 1200000,
        amount: 1150000,
        currency: 'EUR',
        status: 'ACCEPTED',
        message: 'Ottimo prezzo per questa zona.',
        createdAt: '2024-01-10T10:00:00Z',
        updatedAt: '2024-01-18T16:00:00Z'
      }
    ];
  }

  activeOffers = computed(() => {
    return this.offers().filter(o => ['SUBMITTED', 'COUNTEROFFER'].includes(o.status));
  });

  closedOffers = computed(() => {
    return this.offers().filter(o => ['ACCEPTED', 'REJECTED', 'WITHDRAWN'].includes(o.status));
  });

  displayedOffers = computed(() => {
    return this.activeTab() === 'active' ? this.activeOffers() : this.closedOffers();
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

  acceptCounterOffer(offer: OfferResponse): void {
    if (!offer.counterOfferAmount) return;
    
    if (confirm(`Sei sicuro di voler accettare la controproposta di ${this.formatCurrency(offer.counterOfferAmount)}?`)) {
      this.offerService.acceptCounterOffer(offer.id).subscribe({
        next: () => {
          // Update local state
          const updated = this.offers().map(o => 
            o.id === offer.id ? { ...o, status: 'ACCEPTED' as const } : o
          );
          this.offers.set(updated);
        },
        error: (error) => {
          console.error('Error accepting counter offer:', error);
          alert('Errore nell\'accettazione della controproposta. Riprova più tardi.');
        }
      });
    }
  }

  openCounterModal(offer: OfferResponse): void {
    this.selectedOffer.set(offer);
    this.counterAmount.set(offer.counterOfferAmount || offer.amount);
    this.counterMessage.set('');
    this.showCounterModal.set(true);
  }

  closeCounterModal(): void {
    this.showCounterModal.set(false);
    this.selectedOffer.set(null);
    this.counterAmount.set(null);
    this.counterMessage.set('');
  }

  submitCounter(): void {
    const offer = this.selectedOffer();
    const amount = this.counterAmount();
    const message = this.counterMessage();
    
    if (!offer || !amount) return;

    this.offerService.submitCounterToCounter(offer.id, amount, message || undefined).subscribe({
      next: () => {
        // Update local state
        const updated = this.offers().map(o => 
          o.id === offer.id 
            ? { ...o, amount, message, status: 'SUBMITTED' as const, updatedAt: new Date().toISOString() }
            : o
        );
        this.offers.set(updated);
        this.closeCounterModal();
      },
      error: (error) => {
        console.error('Error submitting counter offer:', error);
        alert('Errore nell\'invio della controproposta. Riprova più tardi.');
      }
    });
  }

  withdrawOffer(offer: OfferResponse): void {
    if (confirm('Sei sicuro di voler ritirare questa offerta? Questa azione non può essere annullata.')) {
      this.offerService.withdrawOffer(offer.id).subscribe({
        next: () => {
          // Update local state
          const updated = this.offers().map(o => 
            o.id === offer.id ? { ...o, status: 'WITHDRAWN' as const } : o
          );
          this.offers.set(updated);
        },
        error: (error) => {
          console.error('Error withdrawing offer:', error);
          alert('Errore nel ritiro dell\'offerta. Riprova più tardi.');
        }
      });
    }
  }

  viewProperty(propertyId: string): void {
    this.router.navigate(['/pages/property-detail', propertyId]);
  }

  goToSearch(): void {
    this.router.navigate(['/pages/properties-page']);
  }
}
