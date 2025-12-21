import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ViewMode } from '../../../pages/properties-page.component/properties-page.component.js';

@Component({
  selector: 'app-view-toggle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './view-toggle.component.html',
  styleUrls: ['./view-toggle.component.scss'],
})
export class ViewToggleComponent {
  value = input.required<ViewMode>();
  valueChange = output<ViewMode>();
}
