import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { PropertyFiltersComponent } from '../../shared/components/properties/property-filters.component/property-filters.component.js';
import { PropertyFiltersValue } from '../../shared/models/Property.js';
import { PropertyCardComponent } from "../../shared/components/properties/property-card.component/property-card.component";
import { PropertyCard } from '../../shared/models/Property.js';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ViewToggleComponent } from '../../shared/components/view-toggle.component/view-toggle.component.js';
import { MapMarkerData, PropertyMapComponent } from '../../shared/components/properties/property-map.component/property-map.component.js';
import { ListingService, ListingResponse } from '../../shared/services/listing.service';

export type ViewMode = 'grid' | 'list' | 'map';

@Component({
  selector: 'app-properties-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    ViewToggleComponent,
    PropertyFiltersComponent,
    PropertyCardComponent,
    PropertyMapComponent
  ],
  templateUrl: './properties-page.component.html',
  styleUrls: ['./properties-page.component.scss'],
})

export class PropertiesPageComponent implements OnInit {
  viewMode = signal<ViewMode>('grid');
  
  // Segnale per gli annunci caricati dal backend
  listings = signal<PropertyCard[]>([]);
  
  // Segnale per lo stato di caricamento
  loading = signal<boolean>(true);

  // Paginazione
  readonly itemsPerPage = 6;
  currentPage = signal<number>(1);

  filtersValue = signal<PropertyFiltersValue>({
    mode: null,
    type: 'Tutti',
    city: '',
    priceMin: null,
    priceMax: null,
    roomsMin: 'Qualsiasi',
    areaMin: null,
    areaMax: null,
    energy: 'Qualsiasi',
    elevator: false,
  });

  constructor(
    private route: ActivatedRoute,
    private listingService: ListingService
  ) {}

  ngOnInit() {
    // Leggi i query parameters dall'URL
    this.route.queryParams.subscribe(params => {
      const search = params['search'];
      const mode = params['type'];

      if (search || mode) {
        // Aggiorna i filtri con i parametri ricevuti
        this.filtersValue.update(current => ({
          ...current,
          city: search || current.city,
          mode: mode === 'sale' ? 'Vendita' : mode === 'rent' ? 'Affitto' : current.mode
        }));
      }
      
      // Carica gli annunci dal backend
      this.loadListings();
    });
  }

  private loadListings() {
    this.loading.set(true);
    
    this.listingService.searchListings(this.filtersValue()).subscribe({
      next: (response) => {
        // Converto i dati del backend nel formato del frontend
        const properties = response.map(listing => this.mapToPropertyCard(listing));
        this.listings.set(properties);
        this.loading.set(false);
        this.currentPage.set(1); // Reset alla prima pagina quando si caricano nuovi annunci
        console.log(`✅ Caricati ${properties.length} annunci dal database`);
      },
      error: (error) => {
        console.error('❌ Errore nel caricamento degli annunci:', error);
        this.loading.set(false);
        this.listings.set([]);
      }
    });
  }

  private mapToPropertyCard(listing: ListingResponse): PropertyCard {
    return {
      id: listing.id,
      availability: listing.status === 'ACTIVE' ? 'Disponibile' : 
                   listing.status === 'SOLD' ? 'Venduto' : 'Affittato',
      mode: listing.type === 'SALE' ? 'Vendita' : 'Affitto',
      priceLabel: listing.type === 'SALE' 
        ? `${listing.price.toLocaleString('it-IT')} €`
        : `${listing.price.toLocaleString('it-IT')} €/mese`,
      title: listing.title,
      address: listing.address,
      rooms: listing.rooms,
      area: listing.area,
      floor: listing.floor,
      energy: listing.energyClass as any,
      city: listing.city,
      mapX: 50, // Non più necessario con coordinate reali
      mapY: 50,
      lat: listing.latitude,
      lng: listing.longitude,
    };
  }

  // Rimuovo i dati mockati - ora uso il segnale listings che contiene i dati dal backend
  filtered = computed(() => {
    const f = this.filtersValue();
    const city = f.city.trim().toLowerCase();

    return this.listings().filter((p) => {
      // Filtro per modalità (Vendita/Affitto)
      if (f.mode && p.mode !== f.mode) return false;

      if (f.type !== 'Tutti') {
        const t = f.type.toLowerCase();
        if (!p.title.toLowerCase().includes(t)) return false;
      }
      if (city) {
        const inAddr = p.address.toLowerCase().includes(city);
        const inCity = p.city.toLowerCase().includes(city);
        if (!inAddr && !inCity) return false;
      }

      const priceNum = this.extractPriceNumber(p.priceLabel);

      if (f.priceMin != null && priceNum < f.priceMin) return false;
      if (f.priceMax != null && priceNum > f.priceMax) return false;

      if (f.roomsMin !== 'Qualsiasi' && p.rooms < f.roomsMin) return false;

      if (f.areaMin != null && p.area < f.areaMin) return false;
      if (f.areaMax != null && p.area > f.areaMax) return false;

      if (f.energy !== 'Qualsiasi' && p.energy !== f.energy) return false;

      if (f.elevator && p.floor <= 1) return false;

      return true;
    });
  });

  // Calcola il numero totale di pagine
  totalPages = computed(() => {
    return Math.ceil(this.filtered().length / this.itemsPerPage);
  });

  // Annunci paginati per la pagina corrente
  paginatedListings = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filtered().slice(start, end);
  });

  // Array delle pagine per il template
  pages = computed(() => {
    const total = this.totalPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  });

  countLabel = computed(() => {
    if (this.loading()) {
      return 'Caricamento in corso...';
    }
    const total = this.filtered().length;
    const start = (this.currentPage() - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage() * this.itemsPerPage, total);
    
    if (total === 0) {
      return 'Nessun risultato trovato';
    }
    return `${start}-${end} di ${total} risultati`;
  });

  markers = computed<MapMarkerData[]>(() =>
    this.filtered().map((p) => ({
      id: p.id,
      label: this.mapLabelFromPrice(p.priceLabel),
      lat: p.lat,
      lng: p.lng,
    }))
  );

  onChangeView(mode: ViewMode) {
    this.viewMode.set(mode);
  }

  onFiltersSearch(value: PropertyFiltersValue) {
    this.filtersValue.set(value);
    this.currentPage.set(1); // Reset alla prima pagina
    this.loadListings(); // Ricarica gli annunci con i nuovi filtri
  }

  onFiltersReset(value: PropertyFiltersValue) {
    this.filtersValue.set(value);
    this.currentPage.set(1); // Reset alla prima pagina
    this.loadListings(); // Ricarica gli annunci dopo il reset
  }

  // Metodi per la paginazione
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  previousPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  onOpenProperty(id: string) {
    console.log('Open property:', id);
  }

  private extractPriceNumber(priceLabel: string): number {
    const digits = priceLabel.replace(/[^\d]/g, '');
    return digits ? Number(digits) : 0;
  }

  private mapLabelFromPrice(priceLabel: string): string {
    const n = this.extractPriceNumber(priceLabel);
    if (n >= 100000) return `€${Math.round(n / 1000)}K`;
    return `€${n}`;
  }
}
