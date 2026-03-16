import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PropertyDetailsModalComponent } from '../property-details-modal.component/property-details-modal.component';
import { EditPropertyModalComponent } from '../edit-property-modal.component/edit-property-modal.component';
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
  imageUrls?: string[]; // ✅ AGGIUNTO: array di tutte le immagini
  // Aggiunti campi per i modal
  location?: string;
  propertyType?: string;
  city?: string;
  floor?: number;
  elevator?: boolean;
  energyClass?: string;
  description?: string;
}

@Component({
  selector: 'app-manager-properties',
  standalone: true,
  imports: [CommonModule, RouterModule, PropertyDetailsModalComponent, EditPropertyModalComponent],
  templateUrl: './manager-properties.component.html',
  styleUrl: './manager-properties.component.scss',
})
export class ManagerPropertiesComponent implements OnInit {
  private listingService = inject(ListingService);

  searchQuery = signal('');
  filterStatus = signal<string>('tutti');
  filterType = signal<string>('tutti');

  // Signal per gestire i modal
  showDetailsModal = signal(false);
  showEditModal = signal(false);
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

    // Carica tutti gli immobili dell'agenzia
    this.listingService.getAllAgencyListings().subscribe({
      next: (listings: ListingResponse[]) => {
        console.log('📊 Immobili agenzia caricati:', listings);
        
        const mapped = listings.map(listing => this.mapListingToProperty(listing));
        this.properties.set(mapped);
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('❌ Errore nel caricamento degli immobili:', err);
        this.error.set('Errore nel caricamento degli immobili. Riprova più tardi.');
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
      bathrooms: listing.bathrooms || 0, // ✅ CORRETTO: legge dal backend invece di hardcodare 2
      surface: listing.area,
      image: listing.imageUrls?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400',
      imageUrls: listing.imageUrls || [], // ✅ AGGIUNTO: passa tutte le immagini
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
    // Trasforma la property per il modal details
    const propertyDetail: any = {
      id: property.id,
      title: property.title,
      location: property.address,
      price: property.price,
      type: property.type,
      status: property.status,
      rooms: property.rooms,
      bathrooms: property.bathrooms,
      size: property.surface, // ✅ surface → size
      floor: Math.floor(Math.random() * 10),
      elevator: Math.random() > 0.5,
      energyClass: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)],
      description: `${property.category} situato in ${property.address}. ${property.rooms} locali, ${property.bathrooms} bagni, ${property.surface} mq.`,
      propertyType: property.category,
      address: property.address,
      city: property.address.split(',')[1]?.trim() || 'Napoli',
      image: property.image
    };
    
    this.selectedProperty.set(propertyDetail);
    this.showDetailsModal.set(true);
  }

  editProperty(property: Property): void {
    // Trasforma la property per il modal edit
    const propertyToEdit: any = {
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
      description: property.description || `${property.category} situato in ${property.address}`,
      propertyType: property.category,
      address: property.address,
      city: property.city || property.address.split(',')[1]?.trim() || 'Napoli',
      image: property.image,
      imageUrls: property.imageUrls || [property.image] // ✅ CORRETTO: passa tutte le immagini
    };
    
    this.selectedProperty.set(propertyToEdit);
    this.showEditModal.set(true);
  }

  onCloseDetailsModal(): void {
    this.showDetailsModal.set(false);
    this.selectedProperty.set(null);
  }

  onCloseEditModal(): void {
    this.showEditModal.set(false);
    this.selectedProperty.set(null);
  }

  onEditFromDetails(property: any): void {
    this.showDetailsModal.set(false);
    this.showEditModal.set(true);
  }

  onSaveProperty(formData: any): void {
    const propertyId = this.selectedProperty()?.id;
    if (!propertyId) {
      console.error('❌ ID proprietà non trovato');
      this.error.set('Errore: ID proprietà non trovato');
      return;
    }

    console.log('📤 Salvataggio modifiche immobile ID:', propertyId);
    console.log('📦 Dati da inviare:', formData);
    
    this.listingService.updateListing(propertyId, formData).subscribe({
      next: (response: any) => {
        console.log('✅ Immobile aggiornato con successo:', response);
        this.showEditModal.set(false);
        this.selectedProperty.set(null);
        this.error.set(null);
        
        // Ricarica gli immobili dopo il salvataggio
        this.loadProperties();
      },
      error: (err: any) => {
        console.error('❌ Errore nell\'aggiornamento dell\'immobile:', err);
        this.error.set('Errore nell\'aggiornamento dell\'immobile. Riprova più tardi.');
      }
    });
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
