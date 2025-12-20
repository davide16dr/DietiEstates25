import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { PropertyFiltersComponent } from '../../shared/components/properties/property-filters.component/property-filters.component.js';
import { PropertyFiltersValue } from '../../shared/models/Property.js';
import { PropertyCardComponent } from "../../shared/components/properties/property-card.component/property-card.component";
import { PropertyCard } from '../../shared/models/Property.js';
import { RouterLink } from '@angular/router';

export type ViewMode = 'grid' | 'list' | 'map';

@Component({
  selector: 'app-properties-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    PropertyFiltersComponent,
    PropertyCardComponent
  ],
  templateUrl: './properties-page.component.html',
  styleUrls: ['./properties-page.component.scss'],
})
export class PropertiesPageComponent {
  viewMode = signal<ViewMode>('grid');

  // Filtri (ReactiveForms) gestiti nel child component, qui riceviamo value + azioni
  filtersValue = signal<PropertyFiltersValue>({
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

  private all = signal<PropertyCard[]>([
    {
      id: '1',
      availability: 'Disponibile',
      mode: 'Vendita',
      priceLabel: '450.000 €',
      title: 'Elegante Appartamento in Centro',
      address: 'Via Monte Napoleone 15, Milano',
      rooms: 4,
      area: 120,
      floor: 3,
      energy: 'A',
      city: 'Milano',
      mapX: 38,
      mapY: 70,
      lat: 45.4689,
      lng: 9.1963,
    },
    {
      id: '2',
      availability: 'Disponibile',
      mode: 'Vendita',
      priceLabel: '890.000 €',
      title: 'Attico con Terrazzo Panoramico',
      address: 'Piazza Duomo 1, Milano',
      rooms: 5,
      area: 180,
      floor: 8,
      energy: 'A',
      city: 'Milano',
      mapX: 44,
      mapY: 68,
      lat: 45.4689,
      lng: 9.1963,
    },
    {
      id: '3',
      availability: 'Disponibile',
      mode: 'Affitto',
      priceLabel: '1200 €/mese',
      title: 'Bilocale Moderno zona Navigli',
      address: 'Alzaia Naviglio Grande 42, Milano',
      rooms: 2,
      area: 55,
      floor: 2,
      energy: 'C',
      city: 'Milano',
      mapX: 57,
      mapY: 62,
      lat: 45.4689,
      lng: 9.1963,
    },
    {
      id: '4',
      availability: 'Disponibile',
      mode: 'Vendita',
      priceLabel: '520.000 €',
      title: 'Trilocale Ristrutturato',
      address: 'Corso Buenos Aires 10, Milano',
      rooms: 3,
      area: 98,
      floor: 4,
      energy: 'A',
      city: 'Milano',
      mapX: 34,
      mapY: 72,
      lat: 45.4689,
      lng: 9.1963,
    },
    {
      id: '5',
      availability: 'Disponibile',
      mode: 'Vendita',
      priceLabel: '750.000 €',
      title: 'Loft di Design',
      address: 'Via Tortona 30, Milano',
      rooms: 3,
      area: 140,
      floor: 1,
      energy: 'A',
      city: 'Milano',
      mapX: 62,
      mapY: 38,
      lat: 45.4689,
      lng: 9.1963,
    },
    {
      id: '6',
      availability: 'Disponibile',
      mode: 'Affitto',
      priceLabel: '950 €/mese',
      title: 'Monolocale in zona Porta Romana',
      address: 'Viale Sabotino 5, Milano',
      rooms: 1,
      area: 35,
      floor: 1,
      energy: 'B',
      city: 'Milano',
      mapX: 50,
      mapY: 70,
      lat: 45.4689,
      lng: 9.1963,
    },
  ]);

  filtered = computed(() => {
    const f = this.filtersValue();
    const city = f.city.trim().toLowerCase();

    return this.all().filter((p) => {
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

      // mock ascensore: se richiesto, solo piani > 1
      if (f.elevator && p.floor <= 1) return false;

      return true;
    });
  });

  countLabel = computed(() => `${this.filtered().length} risultati trovati`);

  onChangeView(mode: ViewMode) {
    this.viewMode.set(mode);
  }

  onFiltersSearch(value: PropertyFiltersValue) {
    // UI: pulsante "Cerca" come screenshot
    this.filtersValue.set(value);
  }

  onFiltersReset(value: PropertyFiltersValue) {
    this.filtersValue.set(value);
  }

  onOpenProperty(id: string) {
    // qui farai navigate(/immobili/:id)
    console.log('Open property:', id);
  }

  private extractPriceNumber(priceLabel: string): number {
    // "450.000 €" -> 450000 ; "1200 €/mese" -> 1200
    const digits = priceLabel.replace(/[^\d]/g, '');
    return digits ? Number(digits) : 0;
  }
}
