import { Component, input, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { PropertyType, EnergyClass, PropertyFiltersValue } from '../../../models/Property';

type FiltersForm = FormGroup<{
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
export class PropertyFiltersComponent implements OnInit {
  initialValue = input.required<PropertyFiltersValue>();

  search = output<PropertyFiltersValue>();
  reset = output<PropertyFiltersValue>();

  types: PropertyType[] = ['Tutti', 'Appartamento', 'Attico', 'Bilocale', 'Villa', 'Ufficio'];
  rooms: Array<number | 'Qualsiasi'> = ['Qualsiasi', 1, 2, 3, 4, 5, 6];
  energies: EnergyClass[] = ['Qualsiasi', 'A', 'B', 'C', 'D', 'E', 'F', 'G'];

  form: FiltersForm;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
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
  }

  ngOnInit(): void {
    this.form.reset(this.initialValue());
  }

  onSearch(): void {
    this.search.emit(this.form.getRawValue());
  }

  onReset(): void {
    const v: PropertyFiltersValue = {
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
