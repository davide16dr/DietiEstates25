import { Component, signal, inject, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { GooglePlacesService, PlacePrediction } from '../../shared/services/google-places.service';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

interface Stat { label: string; value: string; }
interface Feature { icon: string; title: string; description: string; }

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './homepage.component.html',
  styleUrl: './homepage.component.scss',
})
export class HomepageComponent implements AfterViewInit, OnDestroy {
  private router = inject(Router);
  private googlePlacesService = inject(GooglePlacesService);

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  searchQuery = signal('');
  contractType = signal<'sale' | 'rent' | null>(null);

  
  searchSuggestions: PlacePrediction[] = [];
  showSearchSuggestions = false;
  private searchSubject = new Subject<string>();

  stats: Stat[] = [
    { value: '10,000+', label: 'Immobili' },
    { value: '500+', label: 'Agenti' },
    { value: '50+', label: 'Città' },
    { value: '98%', label: 'Soddisfazione' },
  ];

  features: Feature[] = [
    { icon: '🏠', title: 'Ampia Selezione', description: 'Migliaia di immobili in vendita e affitto in tutta Italia.' },
    { icon: '🛡️', title: 'Sicurezza Garantita', description: 'Transazioni sicure e agenti verificati.' },
    { icon: '📈', title: 'Prezzi Competitivi', description: 'Valutazioni di mercato accurate e trasparenti.' },
    { icon: '👨‍💼', title: 'Supporto Dedicato', description: 'Assistenza professionale in ogni fase.' },
  ];

  constructor() {
    
    this.searchSubject
      .pipe(
        debounceTime(200), 
        distinctUntilChanged(),
        switchMap(input => this.googlePlacesService.getAddressSuggestions(input))
      )
      .subscribe(suggestions => {
        this.searchSuggestions = suggestions;
        this.showSearchSuggestions = suggestions.length > 0;
      });
  }

  ngAfterViewInit(): void {
    
    document.addEventListener('click', this.handleClickOutside.bind(this));
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.handleClickOutside.bind(this));
    this.searchSubject.complete();
  }

  onSearchInput(event: Event): void {
    const input = (event.target as HTMLInputElement).value;
    this.searchQuery.set(input);
    
    if (input.length >= 2) {
      this.searchSubject.next(input);
    } else {
      this.searchSuggestions = [];
      this.showSearchSuggestions = false;
    }
  }

  selectSuggestion(prediction: PlacePrediction): void {
    
    this.searchQuery.set(prediction.structured_formatting.main_text);
    this.searchSuggestions = [];
    this.showSearchSuggestions = false;
    
    
    this.onSearch();
  }

  private handleClickOutside(event: MouseEvent): void {
    if (this.searchInput && !this.searchInput.nativeElement.contains(event.target as Node)) {
      const clickedSuggestion = (event.target as HTMLElement).closest('.search-suggestions');
      if (!clickedSuggestion) {
        this.showSearchSuggestions = false;
      }
    }
  }

  selectType(type: 'sale' | 'rent'): void {
    
    this.contractType.set(this.contractType() === type ? null : type);
  }

  onSearch(): void {
    this.showSearchSuggestions = false;
    this.router.navigate(['/pages/properties-page'], {
      queryParams: {
        search: this.searchQuery(),
        type: this.contractType(),
      }
    });
  }
}