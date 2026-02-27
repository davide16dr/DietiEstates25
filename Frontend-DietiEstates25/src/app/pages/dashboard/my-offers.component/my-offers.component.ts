import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DashboardService, Offer } from '../../../shared/services/dashboard.service';

@Component({
  selector: 'app-my-offers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './my-offers.component.html',
  styleUrl: './my-offers.component.scss'
})
export class MyOffersComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  offers: Offer[] = [];
  loading = true;
  activeTab: 'active' | 'closed' = 'active';
  
  // Counter offer modal
  showCounterModal = false;
  selectedOffer: Offer | null = null;
  counterAmount: number | null = null;

  // Mock data
  private mockOffers: Offer[] = [
    {
      id: 1,
      propertyId: 101,
      propertyTitle: 'Appartamento Centro Storico',
      propertyAddress: 'Via Roma 123, Milano',
      amount: 850000,
      currency: 'EUR',
      status: 'COUNTEROFFER',
      counterOfferAmount: 870000,
      message: 'Offerta per acquisto immediato.',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-16T14:00:00Z'
    },
    {
      id: 2,
      propertyId: 102,
      propertyTitle: 'Villa con Giardino',
      propertyAddress: 'Via Verdi 45, Milano',
      amount: 720000,
      currency: 'EUR',
      status: 'SUBMITTED',
      message: 'Disponibili a chiusura entro 60 giorni.',
      createdAt: '2024-01-20T10:00:00Z',
      updatedAt: '2024-01-20T10:00:00Z'
    }
  ];

  ngOnInit(): void {
    this.loadOffers();
  }

  loadOffers(): void {
    // Carica immediatamente i mock per sviluppo
    this.offers = this.mockOffers;
    this.loading = false;
    
    // Prova a caricare dal backend (se disponibile)
    this.dashboardService.getOffers().subscribe({
      next: (offers) => {
        if (offers.length > 0) {
          this.offers = offers;
        }
      }
    });
  }

  get activeOffers(): Offer[] {
    return this.offers.filter(o => ['SUBMITTED', 'COUNTEROFFER'].includes(o.status));
  }

  get closedOffers(): Offer[] {
    return this.offers.filter(o => ['ACCEPTED', 'REJECTED', 'WITHDRAWN'].includes(o.status));
  }

  get displayedOffers(): Offer[] {
    return this.activeTab === 'active' ? this.activeOffers : this.closedOffers;
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
      year: 'numeric'
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

  acceptCounterOffer(offer: Offer): void {
    if (confirm('Sei sicuro di voler accettare questa controproposta?')) {
      this.dashboardService.acceptCounterOffer(offer.id).subscribe({
        next: () => {
          offer.status = 'ACCEPTED';
          this.offers = [...this.offers];
          this.cdr.detectChanges();
        },
        error: () => {
          offer.status = 'ACCEPTED';
          this.offers = [...this.offers];
          this.cdr.detectChanges();
        }
      });
    }
  }

  openCounterModal(offer: Offer): void {
    this.selectedOffer = offer;
    this.counterAmount = null;
    this.showCounterModal = true;
  }

  closeCounterModal(): void {
    this.showCounterModal = false;
    this.selectedOffer = null;
    this.counterAmount = null;
  }

  submitCounter(): void {
    if (this.selectedOffer && this.counterAmount) {
      this.dashboardService.submitCounterOffer(this.selectedOffer.id, this.counterAmount).subscribe({
        next: () => {
          if (this.selectedOffer) {
            this.selectedOffer.amount = this.counterAmount!;
            this.selectedOffer.status = 'SUBMITTED';
            this.offers = [...this.offers];
            this.cdr.detectChanges();
          }
          this.closeCounterModal();
        },
        error: () => {
          if (this.selectedOffer) {
            this.selectedOffer.amount = this.counterAmount!;
            this.selectedOffer.status = 'SUBMITTED';
            this.offers = [...this.offers];
            this.cdr.detectChanges();
          }
          this.closeCounterModal();
        }
      });
    }
  }

  withdrawOffer(offer: Offer): void {
    if (confirm('Sei sicuro di voler ritirare questa offerta?')) {
      this.dashboardService.withdrawOffer(offer.id).subscribe({
        next: () => {
          offer.status = 'WITHDRAWN';
          this.offers = [...this.offers];
          this.cdr.detectChanges();
        },
        error: () => {
          offer.status = 'WITHDRAWN';
          this.offers = [...this.offers];
          this.cdr.detectChanges();
        }
      });
    }
  }

  goToSearch(): void {
    this.router.navigate(['/properties']);
  }
}
