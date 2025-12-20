import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { PropertyFiltersComponent } from '../../shared/components/properties/property-filters.component/property-filters.component.js';
import { PropertyFiltersValue } from '../../shared/models/Property.js';

export type ViewMode = 'grid' | 'list' | 'map';

@Component({
  selector: 'app-properties-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PropertyFiltersComponent,
  ],
  templateUrl: './properties-page.component.html',
  styleUrls: ['./properties-page.component.scss'],
})
export class PropertiesPageComponent {
  viewMode = signal<ViewMode>('grid');

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

  onFiltersSearch(value: PropertyFiltersValue) {
    this.filtersValue.set(value);
  }

  onFiltersReset(value: PropertyFiltersValue) {
    this.filtersValue.set(value);
  }
}
