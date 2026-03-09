import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ListingService } from '../../../shared/services/listing.service';
import { OfferService, OfferRequest } from '../../../shared/services/offer.service';
import { DashboardService } from '../../../shared/services/dashboard.service';
import { ToastService } from '../../../shared/services/toast.service';
import { AuthService } from '../../../auth/auth.service';
import { MakeOfferModalComponent, MakeOfferPayload } from '../make-offer-modal.component/make-offer-modal.component';
import { BookVisitModalComponent, BookVisitPayload } from '../book-visit-modal.component/book-visit-modal.component';
import { ImageLightboxComponent } from '../../../shared/components/image-lightbox.component/image-lightbox.component';

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
  bathrooms?: number;  // ✅ AGGIUNTO campo bagni
  areaMq: number;
  floorLabel: string;    
  energyClass: string;   

  description: string;
  features: Feature[];

  agent: {
    name: string;
    roleLabel: string;
    agency?: string;
    phone: string;
    email: string;
    initials: string;
  };

  images: string[];
};

@Component({
  selector: 'app-property-detail-page',
  standalone: true,
  imports: [CommonModule, RouterModule, MakeOfferModalComponent, BookVisitModalComponent, ImageLightboxComponent],
  templateUrl: './property-detail.page.html',
  styleUrls: ['./property-detail.page.scss'],
})
export class PropertyDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private listingService = inject(ListingService);
  private offerService = inject(OfferService);
  private dashboardService = inject(DashboardService);
  private toast = inject(ToastService);
  private authService = inject(AuthService);

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }
  
  showMakeOfferModal = signal(false);
  showBookVisitModal = signal(false);
  showLightbox = signal(false);
  submittingOffer = signal(false);
  submittingVisit = signal(false);
  
  // Gestione carosello immagini
  currentImageIndex = signal(0);

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

  // Computed per immagine corrente
  currentImage = computed(() => {
    const images = this.property().images;
    const index = this.currentImageIndex();
    return images && images.length > 0 ? images[index] : null;
  });

  // Computed per contatore immagini
  imageCounter = computed(() => {
    const images = this.property().images;
    const index = this.currentImageIndex();
    return images && images.length > 0 ? `${index + 1} / ${images.length}` : '';
  });

  // Naviga alla prossima immagine
  nextImage(): void {
    const images = this.property().images;
    if (images && images.length > 0) {
      const nextIndex = (this.currentImageIndex() + 1) % images.length;
      this.currentImageIndex.set(nextIndex);
    }
  }

  // Naviga all'immagine precedente
  previousImage(): void {
    const images = this.property().images;
    if (images && images.length > 0) {
      const prevIndex = this.currentImageIndex() - 1;
      const newIndex = prevIndex < 0 ? images.length - 1 : prevIndex;
      this.currentImageIndex.set(newIndex);
    }
  }

  // Vai a un'immagine specifica
  goToImage(index: number): void {
    this.currentImageIndex.set(index);
  }

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
        bathrooms: l.bathrooms,  // ✅ AGGIUNTO mapping bagni
        areaMq: l.area ?? 0,
        floorLabel: l.floor != null ? `Piano ${l.floor}` : '—',
        energyClass: l.energyClass ?? '-',
        description: l.description ?? l.publicText ?? '',
        features: [],
        agent: {
          name: l.agentName ?? 'Agente Immobiliare',
          roleLabel: 'Agente Immobiliare',
          agency: l.agencyName ?? 'DietiEstates25',
          phone: l.agentPhone ?? '+39 02 1234567',
          email: l.agentEmail ?? 'info@dietiestates.it',
          initials: this.getInitials(l.agentName)
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
      bathrooms: l.bathrooms,  // ✅ AGGIUNTO mapping bagni
      areaMq: l.area ?? 0,
      floorLabel: l.floor != null ? `Piano ${l.floor}` : '—',
      energyClass: l.energyClass ?? '-',
      description: l.description ?? l.publicText ?? '',
      features: [],
      agent: {
        name: l.agentName ?? 'Agente Immobiliare',
        roleLabel: 'Agente Immobiliare',
        agency: l.agencyName ?? 'DietiEstates25',
        phone: l.agentPhone ?? '+39 02 1234567',
        email: l.agentEmail ?? 'info@dietiestates.it',
        initials: this.getInitials(l.agentName)
      },
      images: Array.isArray(l.imageUrls) && l.imageUrls.length ? l.imageUrls : ['assets/placeholders/property-hero.jpg']
    };
  }

  private getInitials(name: string | null | undefined): string {
    if (!name) return 'AI';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
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
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    this.showMakeOfferModal.set(true);
  }

  closeMakeOfferModal(): void {
    this.showMakeOfferModal.set(false);
  }

  openLightbox(): void {
    this.showLightbox.set(true);
  }

  closeLightbox(): void {
    this.showLightbox.set(false);
  }

  onBookVisit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    this.showBookVisitModal.set(true);
  }

  closeBookVisitModal(): void {
    this.showBookVisitModal.set(false);
  }

  onVisitSubmitted(payload: BookVisitPayload): void {
    const property = this.property();
    const propertyId = property.id;

    if (!propertyId) {
      this.toast.error('ID non valido', 'ID proprietà non valido');
      return;
    }

    this.submittingVisit.set(true);

    this.dashboardService.createVisit(propertyId, payload.date, payload.time, payload.notes).subscribe({
      next: (response) => {
        console.log('✅ Visit booked successfully:', response);
        this.submittingVisit.set(false);
        this.closeBookVisitModal();
        
        this.toast.success('Visita prenotata!', `Richiesta di visita inviata con successo per il ${payload.date}.`);
      },
      error: (error) => {
        this.submittingVisit.set(false);
        console.error('❌ Error booking visit:', error);
        
        if (error.status === 404) {
          this.toast.error('Proprietà non trovata');
        } else if (error.status === 400) {
          this.toast.warning('Dati non validi', 'I dati della visita non sono validi.');
        } else {
          this.toast.error('Errore prenotazione', 'Errore nella prenotazione della visita. Riprova più tardi.');
        }
      }
    });
  }

  onOfferSubmitted(payload: MakeOfferPayload): void {
    const property = this.property();
    const propertyId = property.id; // Non convertiamo più in numero, manteniamo come stringa UUID

    if (!propertyId) {
      this.toast.error('ID non valido', 'ID proprietà non valido');
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
        
        this.toast.success(
          'Offerta inviata!',
          `Offerta di ${this.formatCurrency(payload.amount)} inviata con successo.`,
          6000,
          { label: 'Vedi le tue offerte', handler: () => this.router.navigate(['/dashboard/offers']) }
        );
      },
      error: (error) => {
        this.submittingOffer.set(false);
        console.error('❌ Error submitting offer:', error);
        console.error('Error details:', error.error);
        console.error('Status:', error.status);
        
        // Handle specific error cases
        if (error.status === 409) {
          this.toast.warning('Offerta già inviata', 'Hai già inviato un\'offerta per questa proprietà.');
        } else if (error.status === 400) {
          const errorMsg = error.error?.message || error.error || 'Dati offerta non validi';
          this.toast.error('Errore', errorMsg);
        } else if (error.status === 404) {
          this.toast.error('Proprietà non trovata');
        } else {
          this.toast.error('Errore invio offerta', 'Errore nell\'invio dell\'offerta. Riprova più tardi.');
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