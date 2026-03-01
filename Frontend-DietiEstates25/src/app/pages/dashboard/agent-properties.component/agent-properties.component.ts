import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AddPropertyModalComponent } from '../add-property-modal.component/add-property-modal.component';
import { PropertyDetailsModalComponent } from '../property-details-modal.component/property-details-modal.component';
import { EditPropertyModalComponent } from '../edit-property-modal.component/edit-property-modal.component';
import { ListingService, ListingResponse } from '../../../shared/services/listing.service';

interface Property {
  id: string;
  title: string;
  location: string;
  price: number;
  type: 'vendita' | 'affitto';
  status: 'disponibile' | 'venduto' | 'affittato';
  rooms: number;
  bathrooms?: number;
  size: number;
  floor?: number;
  elevator: boolean;
  energyClass?: string;
  description: string;
  propertyType: string;
  address: string;
  city: string;
  image: string;
}

@Component({
  selector: 'app-agent-properties',
  standalone: true,
  imports: [CommonModule, RouterModule, AddPropertyModalComponent, PropertyDetailsModalComponent, EditPropertyModalComponent],
  templateUrl: './agent-properties.component.html',
  styleUrl: './agent-properties.component.scss',
})
export class AgentPropertiesComponent implements OnInit {
  private listingService = inject(ListingService);
  
  // Modern Angular 21: signal() per stato reattivo
  showAddModal = signal(false);
  showDetailsModal = signal(false);
  showEditModal = signal(false);
  selectedProperty = signal<Property | null>(null);
  properties = signal<Property[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadMyProperties();
  }

  loadMyProperties(): void {
    this.isLoading.set(true);
    this.error.set(null);
    
    this.listingService.getMyListings().subscribe({
      next: (listings: ListingResponse[]) => {
        const mappedProperties = listings.map(listing => this.mapListingToProperty(listing));
        this.properties.set(mappedProperties);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Errore nel caricamento delle proprietà:', err);
        this.error.set('Errore nel caricamento delle proprietà. Riprova più tardi.');
        this.isLoading.set(false);
      }
    });
  }

  private mapListingToProperty(listing: ListingResponse): Property {
    return {
      id: listing.id,
      title: listing.title,
      location: listing.city,
      price: listing.price,
      type: listing.type === 'SALE' ? 'vendita' : 'affitto',
      status: this.mapStatus(listing.status),
      rooms: listing.rooms,
      size: listing.area,
      floor: listing.floor,
      elevator: listing.hasElevator,
      energyClass: listing.energyClass,
      description: listing.description,
      propertyType: listing.propertyType,
      address: listing.address,
      city: listing.city,
      image: listing.imageUrls && listing.imageUrls.length > 0 
        ? listing.imageUrls[0] 
        : 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400'
    };
  }

  private mapStatus(status: string): 'disponibile' | 'venduto' | 'affittato' {
    switch (status) {
      case 'ACTIVE': return 'disponibile';
      case 'SOLD': return 'venduto';
      case 'RENTED': return 'affittato';
      default: return 'disponibile';
    }
  }

  get stats() {
    const props = this.properties();
    const totale = props.length;
    const disponibili = props.filter(p => p.status === 'disponibile').length;
    const venduti = props.filter(p => p.status === 'venduto').length;
    const affittati = props.filter(p => p.status === 'affittato').length;
    
    return { totale, disponibili, venduti, affittati };
  }

  // ===== ADD PROPERTY MODAL =====
  
  openAddPropertyModal(): void {
    this.showAddModal.set(true);
  }

  closeAddModal(): void {
    this.showAddModal.set(false);
  }

  saveProperty(propertyData: any): void {
    console.log('Salvataggio immobile:', propertyData);
    this.listingService.createListing(propertyData).subscribe({
      next: (response) => {
        console.log('Immobile salvato con successo:', response);
        this.closeAddModal();
        this.loadMyProperties();
      },
      error: (err) => {
        console.error('Errore nel salvataggio dell\'immobile:', err);
        this.error.set('Errore nel salvataggio dell\'immobile. Riprova più tardi.');
      }
    });
  }

  // ===== DETAILS MODAL =====
  
  openDetailsModal(property: Property): void {
    this.selectedProperty.set(property);
    this.showDetailsModal.set(true);
  }

  closeDetailsModal(): void {
    this.showDetailsModal.set(false);
    this.selectedProperty.set(null);
  }

  onEditFromDetails(property: Property): void {
    this.closeDetailsModal();
    this.openEditModal(property);
  }

  // ===== EDIT MODAL =====
  
  openEditModal(property: Property): void {
    this.selectedProperty.set(property);
    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    this.selectedProperty.set(null);
  }

  updateProperty(updatedData: any): void {
    this.closeEditModal();
    this.loadMyProperties(); // Ricarica la lista dopo l'aggiornamento
    
    console.log('Immobile aggiornato:', updatedData);
    // TODO: Implementare l'aggiornamento reale al backend
  }

  // ===== HELPERS =====

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      disponibile: 'status-available',
      venduto: 'status-sold',
      affittato: 'status-rented'
    };
    return classes[status] || '';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      disponibile: 'Disponibile',
      venduto: 'Venduto',
      affittato: 'Affittato'
    };
    return labels[status] || status;
  }

  formatPrice(price: number, type: string): string {
    if (type === 'affitto') {
      return `€${price.toLocaleString('it-IT')}/mese`;
    }
    return `€${price.toLocaleString('it-IT')}`;
  }
}
