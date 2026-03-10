import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PropertyDetailsModalComponent } from '../property-details-modal.component/property-details-modal.component';
import { ListingService, ListingResponse } from '../../../shared/services/listing.service';

interface Property {
  id: string;
  title: string;
  address: string;
  price: number;
  type: 'vendita' | 'affitto';
  category: string;
  status: 'disponibile' | 'venduto' | 'affittato' | 'in_trattativa';
  agent: string;
  rooms: number;
  bathrooms: number;
  surface: number;
  image: string;
  imageUrls?: string[];
  location?: string;
  propertyType?: string;
  city?: string;
  floor?: number;
  elevator?: boolean;
  energyClass?: string;
  description?: string;
}

@Component({
  selector: 'app-admin-properties',
  standalone: true,
  imports: [CommonModule, RouterModule, PropertyDetailsModalComponent],
  templateUrl: './admin-properties.component.html',
  styleUrl: './admin-properties.component.scss',
})
export class AdminPropertiesComponent implements OnInit {
  private listingService = inject(ListingService);

  searchQuery = signal('');
  filterStatus = signal<string>('tutti');
  filterType = signal<string>('tutti');

  // Signal per gestire il modal
  showDetailsModal = signal(false);
  selectedProperty = signal<any>(null);

  // State management
  properties = signal<Property[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadProperties();
  }

  loadProperties(): void {
    this.isLoading.set(true);
    this.error.set(null);

    console.log('🔍 [Admin] Caricamento immobili agenzia...');

    // Carica tutti gli immobili dell'agenzia
    this.listingService.getAllAgencyListings().subscribe({
      next: (listings: ListingResponse[]) => {
        console.log('✅ [Admin] Immobili agenzia caricati:', listings);
        console.log('📊 [Admin] Numero immobili:', listings.length);
        
        const mapped = listings.map(listing => this.mapListingToProperty(listing));
        this.properties.set(mapped);
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('❌ [Admin] Errore nel caricamento degli immobili:', err);
        console.error('❌ [Admin] Status:', err.status);
        console.error('❌ [Admin] Message:', err.message);
        console.error('❌ [Admin] Error object:', err);
        
        let errorMessage = 'Errore nel caricamento degli immobili. Riprova più tardi.';
        
        if (err.status === 401) {
          errorMessage = 'Non sei autorizzato. Effettua nuovamente il login.';
        } else if (err.status === 403) {
          errorMessage = 'Non hai i permessi per visualizzare gli immobili.';
        } else if (err.status === 400 && err.error?.message) {
          errorMessage = err.error.message;
        }
        
        this.error.set(errorMessage);
        this.isLoading.set(false);
      }
    });
  }

  private mapListingToProperty(listing: ListingResponse): Property {
    return {
      id: listing.id,
      title: listing.title,
      address: `${listing.address}, ${listing.city}`,
      price: listing.price,
      type: listing.type === 'SALE' ? 'vendita' : 'affitto',
      category: listing.propertyType,
      status: this.mapStatus(listing.status),
      agent: listing.agentName || 'N/A',
      rooms: listing.rooms,
      bathrooms: listing.bathrooms || 0,
      surface: listing.area,
      image: listing.imageUrls?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400',
      imageUrls: listing.imageUrls || [],
      location: `${listing.address}, ${listing.city}`,
      propertyType: listing.propertyType,
      city: listing.city,
      floor: listing.floor,
      elevator: listing.hasElevator,
      energyClass: listing.energyClass,
      description: listing.description
    };
  }

  private mapStatus(status: string): 'disponibile' | 'venduto' | 'affittato' | 'in_trattativa' {
    const statusMap: { [key: string]: 'disponibile' | 'venduto' | 'affittato' | 'in_trattativa' } = {
      'ACTIVE': 'disponibile',
      'SOLD': 'venduto',
      'RENTED': 'affittato',
      'SUSPENDED': 'in_trattativa'
    };
    return statusMap[status] || 'disponibile';
  }

  get filteredProperties(): Property[] {
    let filtered = this.properties();

    // Filtro per stato
    if (this.filterStatus() !== 'tutti') {
      filtered = filtered.filter(p => p.status === this.filterStatus());
    }

    // Filtro per tipo
    if (this.filterType() !== 'tutti') {
      filtered = filtered.filter(p => p.type === this.filterType());
    }

    // Filtro per ricerca
    const query = this.searchQuery().toLowerCase();
    if (query) {
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(query) ||
        p.address.toLowerCase().includes(query) ||
        p.agent.toLowerCase().includes(query)
      );
    }

    return filtered;
  }

  get stats() {
    const props = this.properties();
    const totali = props.length;
    const disponibili = props.filter(p => p.status === 'disponibile').length;
    const venduti = props.filter(p => p.status === 'venduto').length;
    const affittati = props.filter(p => p.status === 'affittato').length;
    
    return { totali, disponibili, venduti, affittati };
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  onStatusFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.filterStatus.set(select.value);
  }

  onTypeFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.filterType.set(select.value);
  }

  viewPropertyDetails(property: Property): void {
    const propertyDetail: any = {
      id: property.id,
      title: property.title,
      location: property.address,
      price: property.price,
      type: property.type,
      status: property.status,
      rooms: property.rooms,
      bathrooms: property.bathrooms,
      size: property.surface,
      floor: property.floor || 0,
      elevator: property.elevator || false,
      energyClass: property.energyClass || 'D',
      description: property.description || `${property.category} situato in ${property.address}. ${property.rooms} locali, ${property.bathrooms} bagni, ${property.surface} mq.`,
      propertyType: property.category,
      address: property.address,
      city: property.city || property.address.split(',')[1]?.trim() || 'Milano',
      image: property.image,
      imageUrls: property.imageUrls || [property.image]
    };
    
    this.selectedProperty.set(propertyDetail);
    this.showDetailsModal.set(true);
  }

  onCloseDetailsModal(): void {
    this.showDetailsModal.set(false);
    this.selectedProperty.set(null);
  }

  getStatusClass(status: string): string {
    const statusClasses: Record<string, string> = {
      'disponibile': 'status-available',
      'venduto': 'status-sold',
      'affittato': 'status-rented',
      'in_trattativa': 'status-negotiation'
    };
    return statusClasses[status] || '';
  }

  getStatusLabel(status: string): string {
    const statusLabels: Record<string, string> = {
      'disponibile': 'Disponibile',
      'venduto': 'Venduto',
      'affittato': 'Affittato',
      'in_trattativa': 'In Trattativa'
    };
    return statusLabels[status] || status;
  }

  formatPrice(price: number, type: string): string {
    if (type === 'affitto') {
      return `€${price.toLocaleString('it-IT')}/mese`;
    }
    return `€${price.toLocaleString('it-IT')}`;
  }
}
