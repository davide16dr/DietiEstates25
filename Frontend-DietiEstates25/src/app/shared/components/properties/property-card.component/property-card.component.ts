import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PropertyCard } from '../../../models/Property';

@Component({
  selector: 'app-property-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './property-card.component.html',
  styleUrls: ['./property-card.component.scss'],
})
export class PropertyCardComponent {
  data = input.required<PropertyCard>();
  open = output<string>();
}
