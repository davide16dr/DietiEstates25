import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PropertyDetailsModalComponent } from '../property-details-modal.component/property-details-modal.component';
import { EditPropertyModalComponent } from '../edit-property-modal.component/edit-property-modal.component';

interface Property {
  id: number;
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
  views: number;
  offers: number;
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
export class ManagerPropertiesComponent {
  searchQuery = signal('');
  filterStatus = signal<string>('tutti');
  filterType = signal<string>('tutti');

  // Signal per gestire i modal
  showDetailsModal = signal(false);
  showEditModal = signal(false);
  selectedProperty = signal<any>(null); // Usa 'any' per evitare problemi di tipo con il mapping

  properties: Property[] = [
    {
      id: 1,
      title: 'Appartamento Centro',
      address: 'Via Roma 45, Milano',
      price: 350000,
      type: 'vendita',
      category: 'Appartamento',
      status: 'disponibile',
      agent: 'Lucia Bianchi',
      rooms: 3,
      bathrooms: 2,
      surface: 95,
      image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400',
      views: 245,
      offers: 3
    },
    {
      id: 2,
      title: 'Villa con Giardino',
      address: 'Via dei Fiori 12, Monza',
      price: 680000,
      type: 'vendita',
      category: 'Villa',
      status: 'venduto',
      agent: 'Marco Colombo',
      rooms: 5,
      bathrooms: 3,
      surface: 220,
      image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400',
      views: 567,
      offers: 8
    },
    {
      id: 3,
      title: 'Bilocale Navigli',
      address: 'Alzaia Naviglio Grande 8, Milano',
      price: 1100,
      type: 'affitto',
      category: 'Appartamento',
      status: 'affittato',
      agent: 'Sara Romano',
      rooms: 2,
      bathrooms: 1,
      surface: 55,
      image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400',
      views: 189,
      offers: 5
    },
    {
      id: 4,
      title: 'Attico Panoramico',
      address: 'Corso Buenos Aires 89, Milano',
      price: 850000,
      type: 'vendita',
      category: 'Attico',
      status: 'in_trattativa',
      agent: 'Giuseppe Ferrara',
      rooms: 4,
      bathrooms: 3,
      surface: 180,
      image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400',
      views: 423,
      offers: 6
    },
    {
      id: 5,
      title: 'Loft Industriale',
      address: 'Via Tortona 31, Milano',
      price: 2200,
      type: 'affitto',
      category: 'Loft',
      status: 'disponibile',
      agent: 'Francesca Rizzo',
      rooms: 3,
      bathrooms: 2,
      surface: 120,
      image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400',
      views: 312,
      offers: 2
    },
    {
      id: 6,
      title: 'Trilocale Brera',
      address: 'Via Fiori Chiari 18, Milano',
      price: 520000,
      type: 'vendita',
      category: 'Appartamento',
      status: 'disponibile',
      agent: 'Roberto Greco',
      rooms: 3,
      bathrooms: 2,
      surface: 85,
      image: 'https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=400',
      views: 278,
      offers: 4
    }
  ];

  get filteredProperties(): Property[] {
    let filtered = this.properties;

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
    const totali = this.properties.length;
    const disponibili = this.properties.filter(p => p.status === 'disponibile').length;
    const venduti = this.properties.filter(p => p.status === 'venduto').length;
    const affittati = this.properties.filter(p => p.status === 'affittato').length;
    
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
      city: property.address.split(',')[1]?.trim() || 'Milano',
      image: property.image,
      views: property.views,
      favorites: property.offers
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
      size: property.surface, // ✅ surface → size
      floor: Math.floor(Math.random() * 10),
      elevator: Math.random() > 0.5,
      energyClass: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)],
      description: `${property.category} situato in ${property.address}. ${property.rooms} locali, ${property.bathrooms} bagni, ${property.surface} mq.`,
      propertyType: property.category,
      address: property.address,
      city: property.address.split(',')[1]?.trim() || 'Milano',
      image: property.image
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
    console.log('Saving property:', formData);
    // TODO: Chiamata API per salvare le modifiche
    
    // Aggiorna la property nella lista locale
    const index = this.properties.findIndex(p => p.id === formData.id);
    if (index !== -1) {
      this.properties[index] = {
        ...this.properties[index],
        title: formData.listing.title,
        price: formData.listing.price_amount,
        rooms: formData.property.rooms,
        bathrooms: formData.property.bathrooms,
        surface: formData.property.area_m2,
        address: `${formData.property.address}, ${formData.property.city}`,
        city: formData.property.city,
        type: formData.listing.type === 'SALE' ? 'vendita' : 'affitto',
        status: formData.listing.status as any,
        category: formData.property.property_type,
        floor: formData.property.floor,
        elevator: formData.property.elevator,
        energyClass: formData.property.energy_class,
        description: formData.property.description
      };
    }
    
    this.showEditModal.set(false);
    this.selectedProperty.set(null);
    
    // Mostra messaggio di successo
    alert('Immobile aggiornato con successo!');
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
