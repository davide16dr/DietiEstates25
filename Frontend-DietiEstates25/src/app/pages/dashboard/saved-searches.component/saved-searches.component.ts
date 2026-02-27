import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
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
export class SavedSearchesComponent implements OnInit, OnDestroy {
  loading = true;
  savedSearches: SavedSearch[] = [];
  private destroy$ = new Subject<void>();
  private isLoading = false;

  constructor(
    private savedSearchService: SavedSearchService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadSavedSearches();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSavedSearches(): void {
    // Previeni chiamate multiple simultanee
    if (this.isLoading) {
      console.log('Already loading saved searches, skipping...');
      return;
    }

    this.isLoading = true;
    this.loading = true;
    
    this.savedSearchService.getUserSavedSearches()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (searches) => {
          console.log('📥 Raw response from backend:', searches);
          console.log('📥 First search structure:', searches[0]);
          
          // Mappa i dati se necessario
          this.savedSearches = searches.map(search => {
            // Se criteria non esiste ma c'è filters, usa filters
            if (!search.criteria && (search as any).filters) {
              console.log('⚠️ Mapping filters to criteria for:', search.name);
              return {
                ...search,
                criteria: (search as any).filters
              };
            }
            return search;
          });
          
          console.log('✅ Loaded saved searches:', this.savedSearches.length);
          this.loading = false;
          this.isLoading = false;
          // Forza il rilevamento dei cambiamenti
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading saved searches:', err);
          this.loading = false;
          this.isLoading = false;
          // Forza il rilevamento dei cambiamenti anche in caso di errore
          this.cdr.detectChanges();
        }
      });
  }

  getFilterChips(search: SavedSearch): string[] {
    const chips: string[] = [];
    const criteria = search.criteria;
    
    // Controllo di sicurezza: se criteria è undefined, ritorna array vuoto
    if (!criteria) {
      console.warn('⚠️ No criteria found for search:', search.name);
      return chips;
    }

    // AGGIUNTO: Mostra la modalità (Vendita/Affitto)
    if (criteria.mode) {
      chips.push(criteria.mode === 'Vendita' ? '🏷️ Vendita' : '🏷️ Affitto');
    }

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
    if (criteria.minArea || criteria.maxArea) {
      if (criteria.minArea && criteria.maxArea) {
        chips.push(`📐 ${criteria.minArea}-${criteria.maxArea} m²`);
      } else if (criteria.minArea) {
        chips.push(`📐 Min ${criteria.minArea} m²`);
      } else if (criteria.maxArea) {
        chips.push(`📐 Max ${criteria.maxArea} m²`);
      }
    }
    if (criteria.energyClass && criteria.energyClass !== 'Qualsiasi') {
      chips.push(`⚡ Classe ${criteria.energyClass}`);
    }
    if (criteria.hasElevator) chips.push('🛗 Con ascensore');

    console.log('🔖 Filter chips for', search.name, ':', chips);
    return chips;
  }

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(0) + 'K';
    }
    return num.toString();
  }

  executeSearch(search: SavedSearch): void {
    console.log('🔍 Executing search:', search.name, search.criteria);
    
    const criteria = search.criteria;
    const queryParams: any = {};
    
    // Mappa i criteri ai query params che properties-page si aspetta
    if (criteria.city) {
      queryParams.search = criteria.city;
    }
    
    if (criteria.mode) {
      // Converti "Vendita" -> "sale", "Affitto" -> "rent"
      queryParams.type = criteria.mode === 'Vendita' ? 'sale' : 'rent';
    }
    
    if (criteria.propertyType && criteria.propertyType !== 'Tutti') {
      queryParams.propertyType = criteria.propertyType;
    }
    
    if (criteria.minPrice) {
      queryParams.priceMin = criteria.minPrice;
    }
    
    if (criteria.maxPrice) {
      queryParams.priceMax = criteria.maxPrice;
    }
    
    if (criteria.minRooms) {
      queryParams.bedrooms = criteria.minRooms;
    }
    
    if (criteria.minArea) {
      queryParams.areaMin = criteria.minArea;
    }
    
    if (criteria.maxArea) {
      queryParams.areaMax = criteria.maxArea;
    }
    
    if (criteria.energyClass && criteria.energyClass !== 'Qualsiasi') {
      queryParams.energy = criteria.energyClass;
    }
    
    if (criteria.hasElevator) {
      queryParams.elevator = 'true';
    }
    
    console.log('📤 Navigating with params:', queryParams);
    this.router.navigate(['/pages/properties-page'], { queryParams });
  }

  deleteSearch(search: SavedSearch): void {
    if (confirm(`Sei sicuro di voler eliminare la ricerca "${search.name}"?`)) {
      this.savedSearchService.deleteSavedSearch(search.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.savedSearches = this.savedSearches.filter(s => s.id !== search.id);
            // Forza il rilevamento dei cambiamenti dopo l'eliminazione
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Error deleting saved search:', err);
            alert('Errore durante l\'eliminazione della ricerca salvata');
          }
        });
    }
  }

  goToSearch(): void {
    this.router.navigate(['/pages/properties-page']);
  }
}
