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
import { SavedSearchService } from '../../shared/services/saved-search.service';
import { SavedSearchDTO, SavedSearchCriteria } from '../../shared/models/SavedSearch';
import { AuthService } from '../../auth/auth.service';

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
    PropertyCardComponent
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

  // Segnale per mostrare/nascondere il modal di salvataggio
  showSaveModal = signal<boolean>(false);
  searchName = signal<string>('');
  savingSearch = signal<boolean>(false);

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
    private listingService: ListingService,
    private savedSearchService: SavedSearchService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Leggi i query parameters dall'URL
    this.route.queryParams.subscribe(params => {
      const search = params['search'];
      const mode = params['type'];
      const priceMin = params['priceMin'] ? Number(params['priceMin']) : null;
      const priceMax = params['priceMax'] ? Number(params['priceMax']) : null;
      const propertyType = params['propertyType'];
      const bedrooms = params['bedrooms'] ? Number(params['bedrooms']) : null;

      if (search || mode || priceMin || priceMax || propertyType || bedrooms) {
        // Aggiorna i filtri con i parametri ricevuti
        this.filtersValue.update(current => ({
          ...current,
          city: search || current.city,
          mode: mode === 'sale' ? 'Vendita' : mode === 'rent' ? 'Affitto' : current.mode,
          priceMin: priceMin !== null ? priceMin : current.priceMin,
          priceMax: priceMax !== null ? priceMax : current.priceMax,
          type: propertyType || current.type,
          roomsMin: bedrooms !== null ? bedrooms : current.roomsMin
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
      propertyType: listing.propertyType, // AGGIUNTO: tipo di proprietà dal backend
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

    console.log('🔍 Filtering listings:', {
      totalListings: this.listings().length,
      filters: f
    });

    const result = this.listings().filter((p) => {
      // Filtro per modalità (Vendita/Affitto)
      if (f.mode && p.mode !== f.mode) {
        console.log(`❌ ${p.title}: mode mismatch - expected ${f.mode}, got ${p.mode}`);
        return false;
      }

      // Filtro per tipo di proprietà - CONFRONTO 1 a 1
      if (f.type !== 'Tutti') {
        if (p.propertyType !== f.type) {
          console.log(`❌ ${p.title}: propertyType mismatch - expected ${f.type}, got ${p.propertyType}`);
          return false;
        }
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

    console.log('✅ Filtered results:', result.length);
    return result;
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

  openSaveSearchModal() {
    // Verifica che l'utente sia autenticato
    if (!this.authService.isAuthenticated()) {
      alert('Devi effettuare il login per salvare una ricerca');
      return;
    }
    
    this.searchName.set('');
    this.showSaveModal.set(true);
  }

  closeSaveSearchModal() {
    this.showSaveModal.set(false);
    this.searchName.set('');
  }

  saveCurrentSearch() {
    const name = this.searchName().trim();
    
    if (!name) {
      alert('Inserisci un nome per la ricerca');
      return;
    }

    this.savingSearch.set(true);
    
    // Converti i filtri attuali in un oggetto Map per il backend
    const filters = this.filtersValue();
    const filtersMap: { [key: string]: any } = {};
    
    if (filters.mode) {
      filtersMap['mode'] = filters.mode;
    }
    if (filters.type && filters.type !== 'Tutti') {
      filtersMap['propertyType'] = filters.type;
    }
    if (filters.city) {
      filtersMap['city'] = filters.city;
    }
    if (filters.priceMin !== null && filters.priceMin !== undefined) {
      filtersMap['minPrice'] = filters.priceMin;
    }
    if (filters.priceMax !== null && filters.priceMax !== undefined) {
      filtersMap['maxPrice'] = filters.priceMax;
    }
    if (filters.roomsMin && filters.roomsMin !== 'Qualsiasi') {
      filtersMap['minRooms'] = filters.roomsMin;
    }
    if (filters.areaMin !== null && filters.areaMin !== undefined) {
      filtersMap['minArea'] = filters.areaMin;
    }
    if (filters.areaMax !== null && filters.areaMax !== undefined) {
      filtersMap['maxArea'] = filters.areaMax;
    }
    if (filters.energy && filters.energy !== 'Qualsiasi') {
      filtersMap['energyClass'] = filters.energy;
    }
    if (filters.elevator) {
      filtersMap['hasElevator'] = filters.elevator;
    }

    const savedSearchRequest = {
      name: name,
      filters: filtersMap
    };

    console.log('📤 Invio ricerca salvata:', savedSearchRequest);

    this.savedSearchService.createSavedSearch(savedSearchRequest as any).subscribe({
      next: () => {
        alert('✅ Ricerca salvata con successo!');
        this.closeSaveSearchModal();
        this.savingSearch.set(false);
      },
      error: (err) => {
        console.error('❌ Error saving search:', err);
        alert('❌ Errore durante il salvataggio della ricerca: ' + (err.error?.error || err.message));
        this.savingSearch.set(false);
      }
    });
  }

  hasActiveFilters(): boolean {
    const f = this.filtersValue();
    return !!(
      f.mode ||
      (f.type && f.type !== 'Tutti') ||
      f.city ||
      f.priceMin ||
      f.priceMax ||
      (f.roomsMin && f.roomsMin !== 'Qualsiasi') ||
      f.areaMin ||
      f.areaMax ||
      (f.energy && f.energy !== 'Qualsiasi') ||
      f.elevator
    );
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
