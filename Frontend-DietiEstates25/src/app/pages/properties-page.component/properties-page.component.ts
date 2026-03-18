import { Component, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { PropertyFiltersComponent } from '../../shared/components/properties/property-filters.component/property-filters.component.js';
import { PropertyFiltersValue } from '../../shared/models/Property.js';
import { PropertyCardComponent } from "../../shared/components/properties/property-card.component/property-card.component";
import { PropertyCard } from '../../shared/models/Property.js';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ViewToggleComponent } from '../../shared/components/view-toggle.component/view-toggle.component.js';
import { MapMarkerData, PropertyMapComponent } from '../../shared/components/properties/property-map.component/property-map.component.js';
import { ListingService, ListingResponse } from '../../shared/services/listing.service';
import { SavedSearchService } from '../../shared/services/saved-search.service';
import { SavedSearchDTO, SavedSearchCriteria } from '../../shared/models/SavedSearch';
import { AuthService } from '../../auth/auth.service';
import { ToastService } from '../../shared/services/toast.service';

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

export class PropertiesPageComponent implements OnInit, OnDestroy {
  viewMode = signal<ViewMode>('grid');

  private readonly phoneMaxWidthPx = 640;
  private phoneMq: MediaQueryList | null = null;
  private phoneMqListener: ((e: MediaQueryListEvent) => void) | null = null;
  
  
  listings = signal<PropertyCard[]>([]);
  
  
  loading = signal<boolean>(true);

  
  readonly itemsPerPage = 6;
  currentPage = signal<number>(1);

  
  showSaveModal = signal<boolean>(false);
  searchName = signal<string>('');
  savingSearch = signal<boolean>(false);

  
  showFilters = signal<boolean>(false);
  toggleFilters() { this.showFilters.update(v => !v); }

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
    private authService: AuthService,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit() {
    this.initPhoneViewModeGuard();

    
    this.route.queryParams.subscribe(params => {
      const search = params['search'];
      const mode = params['type'];
      const priceMin = params['priceMin'] ? Number(params['priceMin']) : null;
      const priceMax = params['priceMax'] ? Number(params['priceMax']) : null;
      const propertyType = params['propertyType'];
      const bedrooms = params['bedrooms'] ? Number(params['bedrooms']) : null;

      if (search || mode || priceMin || priceMax || propertyType || bedrooms) {
        
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
      
      
      this.loadListings();
    });
  }

  ngOnDestroy(): void {
    if (this.phoneMq && this.phoneMqListener) {
      this.phoneMq.removeEventListener('change', this.phoneMqListener);
    }
  }

  private initPhoneViewModeGuard(): void {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    this.phoneMq = window.matchMedia(`(max-width: ${this.phoneMaxWidthPx}px)`);

    const apply = (isPhone: boolean) => {
      
      if (isPhone && this.viewMode() === 'grid') {
        this.viewMode.set('list');
      }
    };

    apply(this.phoneMq.matches);

    this.phoneMqListener = (e: MediaQueryListEvent) => apply(e.matches);
    this.phoneMq.addEventListener('change', this.phoneMqListener);
  }

  private loadListings() {
    this.loading.set(true);
    
    console.log('🔍 === DEBUG RICERCA IMMOBILI ===');
    console.log('📋 Filtri applicati:', this.filtersValue());
    
    this.listingService.searchListings(this.filtersValue()).subscribe({
      next: (response) => {
        console.log('📥 Risposta dal backend:', response);
        console.log('📊 Numero risultati dal backend:', response.length);
        
        
        response.forEach((listing, index) => {
          console.log(`  [${index}] ${listing.title}`);
          console.log(`      Città: "${listing.city}"`);
          console.log(`      Indirizzo: "${listing.address}"`);
          console.log(`      Tipo: ${listing.propertyType}`);
          console.log(`      Status: ${listing.status}`);
        });
        
        
        const properties = response.map(listing => this.mapToPropertyCard(listing));
        this.listings.set(properties);
        this.loading.set(false);
        this.currentPage.set(1);
        
        console.log(`✅ Caricati ${properties.length} annunci dal database`);
        console.log('🔍 === FINE DEBUG ===');
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
      propertyType: listing.propertyType, 
      rooms: listing.rooms,
      area: listing.area,
      floor: listing.floor,
      energy: listing.energyClass as any,
      city: listing.city,
      mapX: 50, 
      mapY: 50,
      lat: listing.latitude ?? 0, 
      lng: listing.longitude ?? 0, 
      imageUrl: listing.imageUrls && listing.imageUrls.length > 0 
        ? listing.imageUrls[0] 
        : undefined, 
    };
  }

  
  filtered = computed(() => {
    const f = this.filtersValue();
    const city = f.city.trim().toLowerCase();

    console.log('🔍 Filtering listings:', {
      totalListings: this.listings().length,
      filters: f
    });

    const result = this.listings().filter((p) => {
      
      if (f.mode && p.mode !== f.mode) {
        console.log(`❌ ${p.title}: mode mismatch - expected ${f.mode}, got ${p.mode}`);
        return false;
      }

      
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

  
  totalPages = computed(() => {
    return Math.ceil(this.filtered().length / this.itemsPerPage);
  });

  
  paginatedListings = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filtered().slice(start, end);
  });

  
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

  noResultsMessage = computed(() => {
    if (this.loading() || this.filtered().length > 0) {
      return '';
    }

    const city = this.filtersValue().city.trim();
    if (city) {
      return `Non sono stati trovati risultati per la citta \"${city}\". Prova ad ampliare la zona o a modificare i filtri.`;
    }

    if (this.hasActiveFilters()) {
      return 'Non sono stati trovati risultati con i filtri selezionati. Prova ad allargare i criteri di ricerca.';
    }

    return 'Al momento non ci sono immobili disponibili con i criteri impostati.';
  });

  markers = computed<MapMarkerData[]>(() =>
    this.filtered().map((p) => ({
      id: p.id,
      label: this.mapLabelFromPrice(p.priceLabel),
      lat: p.lat,
      lng: p.lng,
      
      title: p.title,
      address: `${p.address}, ${p.city}`,
      imageUrl: p.imageUrl,
      rooms: p.rooms,
      area: p.area,
      dealType: p.mode === 'Vendita' ? 'SALE' : 'RENT' 
    }))
  );

  onChangeView(mode: ViewMode) {
    
    if (this.phoneMq?.matches && mode === 'grid') {
      this.viewMode.set('list');
      return;
    }
    this.viewMode.set(mode);
  }

  onFiltersSearch(value: PropertyFiltersValue) {
    this.filtersValue.set(value);
    this.currentPage.set(1); 
    this.loadListings(); 
  }

  onFiltersReset(value: PropertyFiltersValue) {
    this.filtersValue.set(value);
    this.currentPage.set(1); 
    this.loadListings(); 
  }

  
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
    this.router.navigate(['/pages/property-detail', id]);
  }

  openSaveSearchModal() {
    
    if (!this.authService.isAuthenticated()) {
      this.toast.warning('Accesso richiesto', 'Devi effettuare il login per salvare una ricerca');
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
      this.toast.warning('Nome richiesto', 'Inserisci un nome per la ricerca');
      return;
    }

    this.savingSearch.set(true);
    
    
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
        this.toast.success('Ricerca salvata!');
        this.closeSaveSearchModal();
        this.savingSearch.set(false);
      },
      error: (err) => {
        console.error('❌ Error saving search:', err);
        this.toast.error('Errore salvataggio', 'Errore durante il salvataggio della ricerca: ' + (err.error?.error || err.message));
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
