import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DashboardService, SavedSearch } from '../../../shared/services/dashboard.service';

@Component({
  selector: 'app-saved-searches',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './saved-searches.component.html',
  styleUrls: ['./saved-searches.component.scss']
})
export class SavedSearchesComponent implements OnInit {
  loading = true;
  savedSearches: SavedSearch[] = [];

  constructor(
    private dashboardService: DashboardService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadSavedSearches();
  }

  loadSavedSearches(): void {
    this.savedSearches = [
      {
        id: 1,
        name: 'Appartamento Centro Napoli',
        filters: {
          location: 'Napoli Centro',
          priceMin: 150000,
          priceMax: 300000,
          propertyType: 'Appartamento',
          bedrooms: 2
        },
        notificationsEnabled: true,
        createdAt: new Date().toISOString(),
        resultsCount: 12
      },
      {
        id: 2,
        name: 'Villa zona collinare',
        filters: {
          location: 'Vomero, Napoli',
          priceMin: 400000,
          priceMax: 700000,
          propertyType: 'Villa',
          bedrooms: 4,
          hasGarden: true
        },
        notificationsEnabled: false,
        createdAt: new Date().toISOString(),
        resultsCount: 5
      },
      {
        id: 3,
        name: 'Monolocale studenti',
        filters: {
          location: 'Fuorigrotta, Napoli',
          priceMax: 120000,
          propertyType: 'Monolocale'
        },
        notificationsEnabled: true,
        createdAt: new Date().toISOString(),
        resultsCount: 8
      }
    ];
    this.loading = false;
    
    this.dashboardService.getSavedSearches().subscribe({
      next: (searches) => {
        if (searches.length > 0) {
          this.savedSearches = searches;
        }
      }
    });
  }

  getFilterChips(search: SavedSearch): string[] {
    const chips: string[] = [];
    const filters = search.filters;

    if (filters.location) chips.push(filters.location);
    if (filters.propertyType) chips.push(filters.propertyType);
    if (filters.bedrooms) chips.push(`${filters.bedrooms} camere`);
    if (filters.priceMin && filters.priceMax) {
      chips.push(`€${this.formatNumber(filters.priceMin)} - €${this.formatNumber(filters.priceMax)}`);
    } else if (filters.priceMax) {
      chips.push(`Max €${this.formatNumber(filters.priceMax)}`);
    } else if (filters.priceMin) {
      chips.push(`Min €${this.formatNumber(filters.priceMin)}`);
    }
    if (filters.hasGarden) chips.push('Con giardino');
    if (filters.hasParking) chips.push('Con parcheggio');
    if (filters.hasBalcony) chips.push('Con balcone');

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

  toggleNotifications(search: SavedSearch): void {
    const newValue = !search.notificationsEnabled;
    this.dashboardService.toggleSearchNotifications(search.id, newValue).subscribe({
      next: () => {
        search.notificationsEnabled = newValue;
      },
      error: () => {
        // Per sviluppo, aggiorna comunque
        search.notificationsEnabled = newValue;
      }
    });
  }

  executeSearch(search: SavedSearch): void {
    const queryParams: any = {};
    const filters = search.filters;
    
    if (filters.location) queryParams.location = filters.location;
    if (filters.priceMin) queryParams.priceMin = filters.priceMin;
    if (filters.priceMax) queryParams.priceMax = filters.priceMax;
    if (filters.propertyType) queryParams.type = filters.propertyType;
    if (filters.bedrooms) queryParams.bedrooms = filters.bedrooms;
    
    this.router.navigate(['/properties'], { queryParams });
  }

  deleteSearch(search: SavedSearch): void {
    if (confirm(`Sei sicuro di voler eliminare la ricerca "${search.name}"?`)) {
      this.dashboardService.deleteSavedSearch(search.id).subscribe({
        next: () => {
          this.savedSearches = this.savedSearches.filter(s => s.id !== search.id);
        },
        error: () => {
          this.savedSearches = this.savedSearches.filter(s => s.id !== search.id);
        }
      });
    }
  }

  goToSearch(): void {
    this.router.navigate(['/properties']);
  }
}
