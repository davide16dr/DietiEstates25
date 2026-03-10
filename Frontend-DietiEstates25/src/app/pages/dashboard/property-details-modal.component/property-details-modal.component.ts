import { Component, input, output, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageLightboxComponent } from '../../../shared/components/image-lightbox.component/image-lightbox.component';

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
  imageUrls?: string[];
  createdAt?: Date;
  views?: number;
  favorites?: number;
}

@Component({
  selector: 'app-property-details-modal',
  standalone: true,
  imports: [CommonModule, ImageLightboxComponent],
  templateUrl: './property-details-modal.component.html',
  styleUrl: './property-details-modal.component.scss',
})
export class PropertyDetailsModalComponent implements OnInit {
  property = input.required<PropertyDetail>();
  close = output<void>();
  edit = output<PropertyDetail>();

  currentIndex = signal(0);
  showLightbox = signal(false);

  images = computed(() => {
    const p = this.property();
    if (p.imageUrls && p.imageUrls.length > 0) return p.imageUrls;
    return p.image ? [p.image] : [];
  });

  currentImage = computed(() => this.images()[this.currentIndex()] ?? '');
  imageCounter = computed(() => `${this.currentIndex() + 1} / ${this.images().length}`);

  ngOnInit(): void {
    this.currentIndex.set(0);
  }

  nextImage(): void {
    this.currentIndex.update(i => (i + 1) % this.images().length);
  }

  previousImage(): void {
    this.currentIndex.update(i => (i - 1 + this.images().length) % this.images().length);
  }

  goToImage(i: number): void {
    this.currentIndex.set(i);
  }

  openLightbox(): void {
    this.showLightbox.set(true);
  }

  closeLightbox(): void {
    this.showLightbox.set(false);
  }

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
