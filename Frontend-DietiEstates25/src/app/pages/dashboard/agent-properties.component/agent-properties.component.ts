import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AddPropertyModalComponent } from '../add-property-modal.component/add-property-modal.component';
import { PropertyDetailsModalComponent } from '../property-details-modal.component/property-details-modal.component';
import { EditPropertyModalComponent } from '../edit-property-modal.component/edit-property-modal.component';

interface Property {
  id: number;
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
export class AgentPropertiesComponent {
  // Modern Angular 21: signal() per stato reattivo
  showAddModal = signal(false);
  showDetailsModal = signal(false);
  showEditModal = signal(false);
  selectedProperty = signal<Property | null>(null);

  properties: Property[] = [
    {
      id: 1,
      title: 'Appartamento moderno',
      location: 'Milano Centro',
      price: 350000,
      type: 'vendita',
      status: 'disponibile',
      rooms: 3,
      bathrooms: 2,
      size: 120,
      floor: 3,
      elevator: true,
      energyClass: 'B',
      description: 'Elegante appartamento completamente ristrutturato nel cuore di Milano. Dotato di tutti i comfort moderni.',
      propertyType: 'Appartamento',
      address: 'Via Roma 15',
      city: 'Milano',
      image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400'
    },
    {
      id: 2,
      title: 'Villa con giardino',
      location: 'Roma Nord',
      price: 750000,
      type: 'vendita',
      status: 'disponibile',
      rooms: 5,
      bathrooms: 3,
      size: 250,
      elevator: false,
      energyClass: 'C',
      description: 'Splendida villa indipendente con ampio giardino e piscina. Zona residenziale tranquilla.',
      propertyType: 'Villa',
      address: 'Via dei Colli 42',
      city: 'Roma',
      image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400'
    },
    {
      id: 3,
      title: 'Attico panoramico',
      location: 'Napoli, Vomero',
      price: 2500,
      type: 'affitto',
      status: 'disponibile',
      rooms: 4,
      bathrooms: 2,
      size: 180,
      floor: 8,
      elevator: true,
      energyClass: 'A',
      description: 'Attico con vista mare mozzafiato. Terrazza di 60 mq. Completamente arredato.',
      propertyType: 'Attico',
      address: 'Via Scarlatti 100',
      city: 'Napoli',
      image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400'
    },
    {
      id: 4,
      title: 'Monolocale centro',
      location: 'Torino Centro',
      price: 180000,
      type: 'vendita',
      status: 'venduto',
      rooms: 1,
      bathrooms: 1,
      size: 45,
      floor: 2,
      elevator: false,
      energyClass: 'D',
      description: 'Monolocale ideale per studenti o prima casa. Ben collegato ai mezzi pubblici.',
      propertyType: 'Monolocale',
      address: 'Corso Vittorio 23',
      city: 'Torino',
      image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400'
    },
    {
      id: 5,
      title: 'Loft industriale',
      location: 'Milano, Navigli',
      price: 1800,
      type: 'affitto',
      status: 'affittato',
      rooms: 2,
      bathrooms: 1,
      size: 95,
      floor: 1,
      elevator: false,
      energyClass: 'C',
      description: 'Loft in stile industriale nella zona dei Navigli. Ambiente unico e caratteristico.',
      propertyType: 'Loft',
      address: 'Alzaia Naviglio Grande 8',
      city: 'Milano',
      image: 'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=400'
    },
    {
      id: 6,
      title: 'Casa indipendente',
      location: 'Firenze Collina',
      price: 520000,
      type: 'vendita',
      status: 'disponibile',
      rooms: 4,
      bathrooms: 2,
      size: 200,
      elevator: false,
      energyClass: 'B',
      description: 'Casa indipendente sulle colline fiorentine. Vista panoramica, tranquillità assoluta.',
      propertyType: 'Casa Indipendente',
      address: 'Via Senese 155',
      city: 'Firenze',
      image: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400'
    }
  ];

  get stats() {
    const totale = this.properties.length;
    const disponibili = this.properties.filter(p => p.status === 'disponibile').length;
    const venduti = this.properties.filter(p => p.status === 'venduto').length;
    const affittati = this.properties.filter(p => p.status === 'affittato').length;
    
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
    const newProperty: Property = {
      id: this.properties.length + 1,
      title: propertyData.listing.title,
      location: `${propertyData.property.city}`,
      price: propertyData.listing.price_amount,
      type: propertyData.listing.type === 'SALE' ? 'vendita' : 'affitto',
      status: 'disponibile',
      rooms: propertyData.property.rooms,
      bathrooms: propertyData.property.bathrooms,
      size: propertyData.property.area_m2,
      floor: propertyData.property.floor,
      elevator: propertyData.property.elevator,
      energyClass: propertyData.property.energy_class,
      description: propertyData.property.description,
      propertyType: propertyData.property.property_type,
      address: propertyData.property.address,
      city: propertyData.property.city,
      image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400'
    };

    this.properties.unshift(newProperty);
    this.closeAddModal();
    
    console.log('Nuovo immobile aggiunto:', newProperty);
    console.log('Immagini:', propertyData.images);
    // TODO: Inviare i dati al backend
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
    const index = this.properties.findIndex(p => p.id === updatedData.id);
    if (index !== -1) {
      this.properties[index] = {
        ...this.properties[index],
        title: updatedData.listing.title,
        location: `${updatedData.property.city}`,
        price: updatedData.listing.price_amount,
        type: updatedData.listing.type === 'SALE' ? 'vendita' : 'affitto',
        status: updatedData.listing.status,
        rooms: updatedData.property.rooms,
        bathrooms: updatedData.property.bathrooms,
        size: updatedData.property.area_m2,
        floor: updatedData.property.floor,
        elevator: updatedData.property.elevator,
        energyClass: updatedData.property.energy_class,
        description: updatedData.property.description,
        propertyType: updatedData.property.property_type,
        address: updatedData.property.address,
        city: updatedData.property.city
      };
    }
    
    this.closeEditModal();
    
    console.log('Immobile aggiornato:', updatedData);
    // TODO: Inviare i dati al backend
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
