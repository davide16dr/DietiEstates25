import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

interface PropertyDetail {
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
  createdAt?: Date;
  views?: number;
  favorites?: number;
}

@Component({
  selector: 'app-property-details-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './property-details-modal.component.html',
  styleUrl: './property-details-modal.component.scss',
})
export class PropertyDetailsModalComponent {
  // Modern Angular 21: input() e output()
  property = input.required<PropertyDetail>();
  close = output<void>();
  edit = output<PropertyDetail>();

  onClose(): void {
    this.close.emit();
  }

  onEdit(): void {
    this.edit.emit(this.property());
  }

  formatPrice(price: number, type: string): string {
    if (type === 'affitto') {
      return `€${price.toLocaleString('it-IT')}/mese`;
    }
    return `€${price.toLocaleString('it-IT')}`;
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      disponibile: 'Disponibile',
      venduto: 'Venduto',
      affittato: 'Affittato'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      disponibile: 'status-available',
      venduto: 'status-sold',
      affittato: 'status-rented'
    };
    return classes[status] || '';
  }
}
