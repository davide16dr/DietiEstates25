import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Offer {
  id: number;
  propertyTitle: string;
  propertyLocation: string;
  propertyPrice: number;
  clientName: string;
  clientEmail: string;
  offerAmount: number;
  status: 'in-attesa' | 'accettata' | 'rifiutata' | 'controproposta';
  counterOffer?: number;
  notes?: string;
  date: string;
}

@Component({
  selector: 'app-agent-offers',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './agent-offers.component.html',
  styleUrl: './agent-offers.component.scss',
})
export class AgentOffersComponent {
  offers: Offer[] = [
    {
      id: 1,
      propertyTitle: 'Appartamento moderno',
      propertyLocation: 'Milano Centro',
      propertyPrice: 350000,
      clientName: 'Mario Rossi',
      clientEmail: 'mario.rossi@email.com',
      offerAmount: 330000,
      status: 'in-attesa',
      notes: 'Cliente molto interessato, prima casa',
      date: '10 Febbraio 2026'
    },
    {
      id: 2,
      propertyTitle: 'Villa con giardino',
      propertyLocation: 'Roma Nord',
      propertyPrice: 750000,
      clientName: 'Laura Bianchi',
      clientEmail: 'laura.bianchi@email.com',
      offerAmount: 700000,
      status: 'controproposta',
      counterOffer: 730000,
      notes: 'Controproposta inviata, in attesa di risposta',
      date: '8 Febbraio 2026'
    }
  ];

  get stats() {
    const inAttesa = this.offers.filter(o => o.status === 'in-attesa').length;
    const accettate = this.offers.filter(o => o.status === 'accettata').length;
    const controproposte = this.offers.filter(o => o.status === 'controproposta').length;
    
    return { inAttesa, accettate, controproposte };
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'in-attesa': 'status-pending',
      'accettata': 'status-accepted',
      'rifiutata': 'status-rejected',
      'controproposta': 'status-counter'
    };
    return classes[status] || '';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'in-attesa': 'In Attesa',
      'accettata': 'Accettata',
      'rifiutata': 'Rifiutata',
      'controproposta': 'Controproposta'
    };
    return labels[status] || status;
  }

  formatPrice(price: number): string {
    return `€${price.toLocaleString('it-IT')}`;
  }

  acceptOffer(offerId: number): void {
    const offer = this.offers.find(o => o.id === offerId);
    if (offer) {
      offer.status = 'accettata';
    }
  }

  rejectOffer(offerId: number): void {
    const offer = this.offers.find(o => o.id === offerId);
    if (offer) {
      offer.status = 'rifiutata';
    }
  }

  makeCounterOffer(offerId: number): void {
    const offer = this.offers.find(o => o.id === offerId);
    if (offer) {
      // In una vera implementazione, qui si aprirebbe un modal per inserire la controproposta
      const counterAmount = prompt('Inserisci controproposta (€):');
      if (counterAmount) {
        offer.counterOffer = parseInt(counterAmount);
        offer.status = 'controproposta';
      }
    }
  }

  getDifference(propertyPrice: number, offerAmount: number): number {
    return propertyPrice - offerAmount;
  }

  getDifferencePercent(propertyPrice: number, offerAmount: number): number {
    return ((propertyPrice - offerAmount) / propertyPrice) * 100;
  }
}
