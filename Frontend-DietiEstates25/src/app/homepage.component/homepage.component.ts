import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface Stat {
  label: string;
  value: string;
}

interface Feature {
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './homepage.component.html',
  styleUrl: './homepage.component.scss',
})

export class HomepageComponent {
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
  contractType: 'sale' | 'rent' | null = null;

  searchQuery = '';

  onSearch(): void {
    const searchParams = {
      query: this.searchQuery,
      type: this.contractType,
    };

    console.log('Search params:', searchParams);
  }

  selectType(type: 'sale' | 'rent'): void {
    this.contractType = type;
  }
}