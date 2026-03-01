import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ListingService } from '../../../shared/services/listing.service';
import { OfferService, OfferRequest } from '../../../shared/services/offer.service';
import { MakeOfferModalComponent, MakeOfferPayload } from '../make-offer-modal.component/make-offer-modal.component';

type DealType = 'Vendita' | 'Affitto';
type Availability = 'Disponibile' | 'Non disponibile';

type Feature =
  | 'Con ascensore'
  | 'Aria condizionata'
  | 'Portineria'
  | 'Cantina';

type PropertyDetail = {
  id: string;
  dealType: DealType;
  availability: Availability;

  title: string;
  address: string;
  city: string;

  price: number;         
  rentPerMonth?: number; 

  rooms: number;
  areaMq: number;
  floorLabel: string;    
  energyClass: string;   

  description: string;
  features: Feature[];

  agent: {
    name: string;
    roleLabel: string;
    phone: string;
    email: string;
    initials: string;
  };

  images: string[];
};

@Component({
  selector: 'app-property-detail-page',
  standalone: true,
  imports: [CommonModule, RouterModule, MakeOfferModalComponent],
  templateUrl: './property-detail.page.html',
  styleUrls: ['./property-detail.page.scss'],
})
export class PropertyDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private listingService = inject(ListingService);
  private offerService = inject(OfferService);
  
  showMakeOfferModal = signal(false);
  submittingOffer = signal(false);

  // TODO: da sostituire
  private mock: PropertyDetail = {
    id: '1',
    dealType: 'Vendita',
    availability: 'Disponibile',
    title: 'Elegante Appartamento in Centro',
    address: 'Via Monte Napoleone 15',
    city: 'Milano',
    price: 450000,
    rooms: 4,
    areaMq: 120,
    floorLabel: 'Piano 3',
    energyClass: 'A2',
    description:
      'Splendido appartamento completamente ristrutturato nel cuore di Milano. Finiture di pregio, pavimenti in parquet, ampie finestre con vista sulla città.',
    features: ['Con ascensore', 'Aria condizionata', 'Portineria', 'Cantina'],
    agent: {
      name: 'Lucia Bianchi',
      roleLabel: 'Agente Immobiliare',
      phone: '+39 02 3456789',
      email: 'lucia.bianchi@dietiestates.it',
      initials: 'LB',
    },
    images: [
      '',
    ],
  };
  
  propertyId = computed(() => this.route.snapshot.paramMap.get('id') ?? this.mock.id);

  property = signal<PropertyDetail>(this.mock);

  constructor() {
    const navState = this.router.getCurrentNavigation()?.extras?.state as any;
    if (navState && navState.listing) {
      const l = navState.listing;
      const dto: PropertyDetail = {
        id: l.id,
        dealType: l.type === 'RENT' ? 'Affitto' : 'Vendita',
        availability: l.status === 'ACTIVE' ? 'Disponibile' : 'Non disponibile',
        title: l.title ?? '',
        address: l.address ?? '',
        city: l.city ?? '',
        price: l.price ?? 0,
        rentPerMonth: l.type === 'RENT' ? l.price : undefined,
        rooms: l.rooms ?? 0,
        areaMq: l.area ?? 0,
        floorLabel: l.floor != null ? `Piano ${l.floor}` : '—',
        energyClass: l.energyClass ?? '-',
        description: l.description ?? l.publicText ?? '',
        features: [],
        agent: {
          name: '',
          roleLabel: 'Agente Immobiliare',
          phone: '',
          email: '',
          initials: ''
        },
        images: Array.isArray(l.imageUrls) && l.imageUrls.length ? l.imageUrls : ['assets/placeholders/property-hero.jpg']
      };

      this.property.set(dto);
    }
  }

  ngOnInit(): void {
    const id = this.propertyId();
    if (!id) return;

    // Richiesta tramite service
    this.listingService.getById(id).subscribe({
      next: (l: any) => {
        if (!l) return;
        const dto = this.mapListingToPropertyDetail(l);
        this.property.set(dto);
      },
      error: (err: any) => {
        console.error('Impossibile caricare dettaglio proprietà', err);
      }
    });
  }

  private mapListingToPropertyDetail(l: any): PropertyDetail {
    return {
      id: l.id,
      dealType: l.type === 'RENT' ? 'Affitto' : 'Vendita',
      availability: l.status === 'ACTIVE' ? 'Disponibile' : 'Non disponibile',
      title: l.title ?? '',
      address: l.address ?? '',
      city: l.city ?? '',
      price: l.price ?? 0,
      rentPerMonth: l.type === 'RENT' ? l.price : undefined,
      rooms: l.rooms ?? 0,
      areaMq: l.area ?? 0,
      floorLabel: l.floor != null ? `Piano ${l.floor}` : '—',
      energyClass: l.energyClass ?? '-',
      description: l.description ?? l.publicText ?? '',
      features: [],
      agent: {
        name: l.agentName ?? '',
        roleLabel: 'Agente Immobiliare',
        phone: l.agentPhone ?? '',
        email: l.agentEmail ?? '',
        initials: ''
      },
      images: Array.isArray(l.imageUrls) && l.imageUrls.length ? l.imageUrls : ['assets/placeholders/property-hero.jpg']
    };
  }

  priceLabel = computed(() => {
    const p = this.property();
    if (p.dealType === 'Affitto') {
      const rent = p.rentPerMonth ?? 0;
      return `${this.formatCurrency(rent)}/mese`;
    }
    return this.formatCurrency(p.price);
  });

  onBack(): void {
    this.location.back();
  }

  onToggleFavorite(): void {
    console.log('favorite toggled');
  }

  onShare(): void {
    console.log('share');
  }

  onMakeOffer(): void {
    this.showMakeOfferModal.set(true);
  }

  closeMakeOfferModal(): void {
    this.showMakeOfferModal.set(false);
  }

  onOfferSubmitted(payload: MakeOfferPayload): void {
    const property = this.property();
    const propertyId = property.id; // Non convertiamo più in numero, manteniamo come stringa UUID

    if (!propertyId) {
      alert('ID proprietà non valido');
      return;
    }

    this.submittingOffer.set(true);

    const offerRequest: OfferRequest = {
      propertyId: propertyId, // Invia come stringa UUID
      amount: payload.amount,
      message: payload.notes
    };

    // DEBUG: Log per vedere cosa stiamo inviando
    console.log('🔍 Sending offer request:', offerRequest);
    console.log('Property ID:', propertyId);
    console.log('Amount:', payload.amount);
    console.log('Message:', payload.notes);

    this.offerService.submitOffer(offerRequest).subscribe({
      next: (response) => {
        console.log('✅ Offer submitted successfully:', response);
        this.submittingOffer.set(false);
        this.closeMakeOfferModal();
        
        // Show success message
        alert(`Offerta di ${this.formatCurrency(payload.amount)} inviata con successo!`);
        
        // Optionally navigate to my offers page
        if (confirm('Vuoi visualizzare le tue offerte?')) {
          this.router.navigate(['/dashboard/offers']);
        }
      },
      error: (error) => {
        this.submittingOffer.set(false);
        console.error('❌ Error submitting offer:', error);
        console.error('Error details:', error.error);
        console.error('Status:', error.status);
        
        // Handle specific error cases
        if (error.status === 409) {
          alert('Hai già inviato un\'offerta per questa proprietà.');
        } else if (error.status === 400) {
          const errorMsg = error.error?.message || error.error || 'Dati offerta non validi';
          alert(`Errore: ${errorMsg}`);
        } else if (error.status === 404) {
          alert('Proprietà non trovata.');
        } else {
          alert('Errore nell\'invio dell\'offerta. Riprova più tardi.');
        }
      }
    });
  }

  onEmailAgent(): void {
    const p = this.property();
    window.location.href = `mailto:${p.agent.email}?subject=Info annuncio ${p.title}`;
  }

  private formatCurrency(value: number): string {
    return value.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  }
}