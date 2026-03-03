import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SavedSearchService } from '../../../shared/services/saved-search.service';
import { SavedSearch } from '../../../shared/models/SavedSearch';
import { PropertyFiltersValue } from '../../../shared/models/Property';

@Component({
  selector: 'app-saved-searches',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './saved-searches.component.html',
  styleUrls: ['./saved-searches.component.scss']
})
export class SavedSearchesComponent implements OnInit {
  private savedSearchService = inject(SavedSearchService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  loading = signal(true);
  savedSearches = signal<SavedSearch[]>([]);
  private isLoading = false;

  ngOnInit(): void {
    this.loadSavedSearches();
  }

  loadSavedSearches(): void {
    if (this.isLoading) {
      console.log('Already loading saved searches, skipping...');
      return;
    }

    this.isLoading = true;
    this.loading.set(true);

    this.savedSearchService.getUserSavedSearches()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (searches) => {
          console.log('📥 Raw response from backend:', searches);
          console.log('📥 First search structure:', searches[0]);

          const mapped = searches.map(search => {
            if (!search.criteria && (search as any).filters) {
              console.log('⚠️ Mapping filters to criteria for:', search.name);
              return { ...search, criteria: (search as any).filters };
            }
            return search;
          });

          console.log('✅ Loaded saved searches:', mapped.length);
          this.savedSearches.set(mapped);
          this.loading.set(false);
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading saved searches:', err);
          this.loading.set(false);
          this.isLoading = false;
        }
      });
  }

  getFilterChips(search: SavedSearch): string[] {
    const chips: string[] = [];
    const criteria = search.criteria;

    if (!criteria) {
      console.warn('⚠️ No criteria found for search:', search.name);
      return chips;
    }

    if (criteria.mode) chips.push(criteria.mode === 'Vendita' ? '🏷️ Vendita' : '🏷️ Affitto');
    if (criteria.city) chips.push(`📍 ${criteria.city}`);
    if (criteria.propertyType && criteria.propertyType !== 'Tutti') chips.push(`🏠 ${criteria.propertyType}`);
    if (criteria.minRooms) chips.push(`🛏️ ${criteria.minRooms}+ camere`);

    if (criteria.minPrice && criteria.maxPrice) {
      chips.push(`💰 €${this.formatNumber(criteria.minPrice)} - €${this.formatNumber(criteria.maxPrice)}`);
    } else if (criteria.maxPrice) {
      chips.push(`💰 Max €${this.formatNumber(criteria.maxPrice)}`);
    } else if (criteria.minPrice) {
      chips.push(`💰 Min €${this.formatNumber(criteria.minPrice)}`);
    }

    if (criteria.minArea && criteria.maxArea) {
      chips.push(`📐 ${criteria.minArea}-${criteria.maxArea} m²`);
    } else if (criteria.minArea) {
      chips.push(`📐 Min ${criteria.minArea} m²`);
    } else if (criteria.maxArea) {
      chips.push(`📐 Max ${criteria.maxArea} m²`);
    }

    if (criteria.energyClass && criteria.energyClass !== 'Qualsiasi') chips.push(`⚡ Classe ${criteria.energyClass}`);
    if (criteria.hasElevator) chips.push('🛗 Con ascensore');

    console.log('🔖 Filter chips for', search.name, ':', chips);
    return chips;
  }

  formatNumber(num: number): string {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(0) + 'K';
    return num.toString();
  }

  executeSearch(search: SavedSearch): void {
    console.log('🔍 Executing search:', search.name, search.criteria);
    const criteria = search.criteria;
    const queryParams: Record<string, any> = {};

    if (criteria.city) queryParams['search'] = criteria.city;
    if (criteria.mode) queryParams['type'] = criteria.mode === 'Vendita' ? 'sale' : 'rent';
    if (criteria.propertyType && criteria.propertyType !== 'Tutti') queryParams['propertyType'] = criteria.propertyType;
    if (criteria.minPrice) queryParams['priceMin'] = criteria.minPrice;
    if (criteria.maxPrice) queryParams['priceMax'] = criteria.maxPrice;
    if (criteria.minRooms) queryParams['bedrooms'] = criteria.minRooms;
    if (criteria.minArea) queryParams['areaMin'] = criteria.minArea;
    if (criteria.maxArea) queryParams['areaMax'] = criteria.maxArea;
    if (criteria.energyClass && criteria.energyClass !== 'Qualsiasi') queryParams['energy'] = criteria.energyClass;
    if (criteria.hasElevator) queryParams['elevator'] = 'true';

    console.log('📤 Navigating with params:', queryParams);
    this.router.navigate(['/pages/properties-page'], { queryParams });
  }

  deleteSearch(search: SavedSearch): void {
    if (!confirm(`Sei sicuro di voler eliminare la ricerca "${search.name}"?`)) return;

    this.savedSearchService.deleteSavedSearch(search.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.savedSearches.update(list => list.filter(s => s.id !== search.id)),
        error: (err) => {
          console.error('Error deleting saved search:', err);
          alert('Errore durante l\'eliminazione della ricerca salvata');
        }
      });
  }

  goToSearch(): void {
    this.router.navigate(['/pages/properties-page']);
  }
}
