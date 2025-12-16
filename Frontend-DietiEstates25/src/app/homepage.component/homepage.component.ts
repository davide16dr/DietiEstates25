import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.scss'],
})
export class HomepageComponent {
  searchQuery = '';

  onSearch(): void {
    console.log('Search:', this.searchQuery);
  }
}