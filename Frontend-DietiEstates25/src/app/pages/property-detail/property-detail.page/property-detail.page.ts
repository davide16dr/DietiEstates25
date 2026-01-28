import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ListingService } from '../../../shared/services/listing.service';
import { MakeOfferModalComponent } from '../make-offer-modal.component/make-offer-modal.component';
import { BookVisitModalComponent } from '../book-visit-modal.component/book-visit-modal.component';

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
  imports: [CommonModule, RouterModule, MakeOfferModalComponent, BookVisitModalComponent],
  templateUrl: './property-detail.page.html',
  styleUrls: ['./property-detail.page.scss'],
})
export class PropertyDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private listingService = inject(ListingService);
  
  showMakeOfferModal = signal(false);
  showBookVisitModal = signal(false);

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
        next: (l) => {
          if (!l) return;
          const dto = this.mapListingToPropertyDetail(l);
          this.property.set(dto);
        },
        error: (err) => {
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

  onBookVisit(): void {
    this.showBookVisitModal.set(true);
  }

  closeBookVisitModal(): void {
    this.showBookVisitModal.set(false);
  }

  onMakeOffer(): void {
    this.showMakeOfferModal.set(true);
  }

  closeMakeOfferModal(): void {
    this.showMakeOfferModal.set(false);
  }

  onEmailAgent(): void {
    const p = this.property();
    window.location.href = `mailto:${p.agent.email}?subject=Info annuncio ${p.title}`;
  }

  private formatCurrency(value: number): string {
    return value.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  }
}