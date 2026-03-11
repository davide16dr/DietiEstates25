import { Component, input, output, inject, effect, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { PropertyType, EnergyClass, PropertyFiltersValue, ListingMode } from '../../../models/Property';
import { GooglePlacesService, PlacePrediction } from '../../../services/google-places.service';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

type FiltersForm = FormGroup<{
  mode: FormControl<ListingMode | null>;
  type: FormControl<PropertyType>;
  city: FormControl<string>;
  priceMin: FormControl<number | null>;
  priceMax: FormControl<number | null>;
  roomsMin: FormControl<number | 'Qualsiasi'>;
  areaMin: FormControl<number | null>;
  areaMax: FormControl<number | null>;
  energy: FormControl<EnergyClass>;
  elevator: FormControl<boolean>;
}>;

@Component({
  selector: 'app-property-filters',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './property-filters.component.html',
  styleUrls: ['./property-filters.component.scss'],
})
export class PropertyFiltersComponent implements AfterViewInit, OnDestroy {
  private fb = inject(FormBuilder);
  private googlePlacesService = inject(GooglePlacesService);

  @ViewChild('cityInput') cityInput!: ElementRef<HTMLInputElement>;

  initialValue = input.required<PropertyFiltersValue>();
  search = output<PropertyFiltersValue>();
  reset = output<PropertyFiltersValue>();

  modes: Array<ListingMode | 'Tutti'> = ['Tutti', 'Vendita', 'Affitto'];
  types: PropertyType[] = ['Tutti', 'Appartamento', 'Attico', 'Bilocale', 'Villa', 'Ufficio'];
  rooms: Array<number | 'Qualsiasi'> = ['Qualsiasi', 1, 2, 3, 4, 5, 6];
  energies: EnergyClass[] = ['Qualsiasi', 'A', 'B', 'C', 'D', 'E', 'F', 'G'];

  form: FiltersForm = this.fb.group({
    mode: this.fb.control<ListingMode | null>(null),
    type: this.fb.control<PropertyType>('Tutti', { nonNullable: true }),
    city: this.fb.control<string>('', { nonNullable: true }),
    priceMin: this.fb.control<number | null>(null),
    priceMax: this.fb.control<number | null>(null),
    roomsMin: this.fb.control<number | 'Qualsiasi'>('Qualsiasi', { nonNullable: true }),
    areaMin: this.fb.control<number | null>(null),
    areaMax: this.fb.control<number | null>(null),
    energy: this.fb.control<EnergyClass>('Qualsiasi', { nonNullable: true }),
    elevator: this.fb.control<boolean>(false, { nonNullable: true }),
  });

  // Autocomplete città
  citySuggestions: PlacePrediction[] = [];
  showCitySuggestions = false;
  private citySearchSubject = new Subject<string>();

  constructor() {
    // Ogni volta che initialValue cambia (incluso il primo valore),
    // aggiorna il form automaticamente — funziona con signal inputs
    effect(() => {
      this.form.reset(this.initialValue());
    });

    // Configura l'autocomplete per il campo città
    this.citySearchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(input => this.googlePlacesService.getCitySuggestions(input))
      )
      .subscribe(suggestions => {
        this.citySuggestions = suggestions;
        this.showCitySuggestions = suggestions.length > 0;
      });
  }

  ngAfterViewInit(): void {
    // Listener per chiudere i suggerimenti quando si clicca fuori
    document.addEventListener('click', this.handleClickOutside.bind(this));
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.handleClickOutside.bind(this));
    this.citySearchSubject.complete();
  }

  onCityInput(event: Event): void {
    const input = (event.target as HTMLInputElement).value;
    if (input.length >= 2) {
      this.citySearchSubject.next(input);
    } else {
      this.citySuggestions = [];
      this.showCitySuggestions = false;
    }
  }

  selectCity(prediction: PlacePrediction): void {
    // Usa solo il nome della città (main_text)
    this.form.patchValue({ city: prediction.structured_formatting.main_text });
    this.citySuggestions = [];
    this.showCitySuggestions = false;
  }

  private handleClickOutside(event: MouseEvent): void {
    if (this.cityInput && !this.cityInput.nativeElement.contains(event.target as Node)) {
      this.showCitySuggestions = false;
    }
  }

  onSearch(): void {
    this.search.emit(this.form.getRawValue());
  }

  onReset(): void {
    const v: PropertyFiltersValue = {
      mode: null,
      type: 'Tutti',
      city: '',
      priceMin: null,
      priceMax: null,
      roomsMin: 'Qualsiasi',
      areaMin: null,
      areaMax: null,
      energy: 'Qualsiasi',
      elevator: false,
    };
    this.form.reset(v);
    this.reset.emit(v);
  }
}
