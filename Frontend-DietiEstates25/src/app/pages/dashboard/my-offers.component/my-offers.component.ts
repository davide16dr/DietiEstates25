import { Component, OnInit, inject, signal, computed, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OfferService, OfferResponse } from '../../../shared/services/offer.service';
import { ToastService } from '../../../shared/services/toast.service';
import { WebSocketService, WebSocketNotification } from '../../../shared/services/websocket.service';

@Component({
  selector: 'app-my-offers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './my-offers.component.html',
  styleUrl: './my-offers.component.scss'
})
export class MyOffersComponent implements OnInit, OnDestroy {
  private offerService = inject(OfferService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private webSocketService = inject(WebSocketService);
  private ngZone = inject(NgZone);
  private notificationCallback?: (notification: WebSocketNotification) => void;

  offers = signal<OfferResponse[]>([]);
  loading = signal(true);
  activeTab = signal<'active' | 'closed'>('active');
  
  
  showCounterModal = signal(false);
  selectedOffer = signal<OfferResponse | null>(null);
  counterAmount = signal<number | null>(null);
  counterMessage = signal<string>('');

  ngOnInit(): void {
    console.log('🎯 MyOffersComponent inizializzato - setup WebSocket listener');
    this.loadOffers();
    
    
    this.notificationCallback = (notification: WebSocketNotification) => {
      console.log('🔔 Notifica WebSocket ricevuta (cliente):', notification);
      console.log('   - Type:', notification.type);
      console.log('   - Title:', notification.title);
      console.log('   - OfferId:', notification.offerId);
      
      
      if (notification.offerId || this.isOfferNotification(notification.type)) {
        console.log('💰 ✅ RICARICA offerte in tempo reale (cliente)...');
        this.ngZone.run(() => this.loadOffers());
      } else {
        console.log('💰 ⏭️ Notifica ignorata - non relativa alle offerte');
      }
    };
    
    this.webSocketService.onNotification(this.notificationCallback);
    console.log('✅ WebSocket listener registrato per MyOffersComponent');
  }
  
  ngOnDestroy(): void {
    console.log('🧹 MyOffersComponent distrutto - rimozione WebSocket listener');
    
    if (this.notificationCallback) {
      this.webSocketService.removeNotificationCallback(this.notificationCallback);
    }
  }

  loadOffers(): void {
    console.log('📥 Caricamento offerte...');
    this.loading.set(true);
    this.offerService.getMyOffers().subscribe({
      next: (offers) => {
        console.log('✅ Offerte caricate:', offers.length, 'offerte');
        this.offers.set(offers);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('❌ Errore caricamento offerte:', error);
        this.loading.set(false);
        
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
        propertyAddress: 'Via Roma 123, Napoli',
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
        propertyAddress: 'Via Verdi 45, Napoli',
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
    
    this.offerService.acceptCounterOffer(offer.id).subscribe({
        next: () => {
          this.loadOffers();
          this.toast.success(
            'Controproposta Accettata!',
            `Hai accettato la controproposta di ${this.formatCurrency(offer.counterOfferAmount!)}. L'agente ha ricevuto una notifica.`
          );
        },
        error: (error) => {
          console.error('Error accepting counter offer:', error);
          this.toast.error(
            'Errore',
            'Impossibile accettare la controproposta. Riprova più tardi.'
          );
        }
      });
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
        this.loadOffers();
        this.closeCounterModal();
        this.toast.success(
          'Controproposta Inviata!',
          `La tua controproposta di ${this.formatCurrency(amount)} è stata inviata. L'agente riceverà una notifica.`
        );
      },
      error: (error) => {
        console.error('Error submitting counter offer:', error);
        this.toast.error(
          'Errore',
          'Impossibile inviare la controproposta. Riprova più tardi.'
        );
        this.closeCounterModal();
      }
    });
  }

  withdrawOffer(offer: OfferResponse): void {
    this.offerService.withdrawOffer(offer.id).subscribe({
        next: () => {
          this.loadOffers();
          this.toast.success(
            'Offerta Ritirata',
            'La tua offerta è stata ritirata con successo.'
          );
        },
        error: (error) => {
          console.error('Error withdrawing offer:', error);
          this.toast.error(
            'Errore',
            'Impossibile ritirare l\'offerta. Riprova più tardi.'
          );
        }
      });
  }

  viewProperty(propertyId: string): void {
    this.router.navigate(['/pages/property-detail', propertyId]);
  }

  goToSearch(): void {
    this.router.navigate(['/pages/properties-page']);
  }

  



  private isOfferNotification(type: string): boolean {
    if (!type) return false;
    
    const typeUpper = type.toUpperCase();
    
    
    return typeUpper.includes('OFFER') || typeUpper.includes('COUNTER');
  }
}
