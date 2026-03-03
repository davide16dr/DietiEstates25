import { Component, signal, inject } from '@angular/core';
import { RouterModule, Router } from '@angular/router';

interface Stat { label: string; value: string; }
interface Feature { icon: string; title: string; description: string; }

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './homepage.component.html',
  styleUrl: './homepage.component.scss',
})
export class HomepageComponent {
  private router = inject(Router);

  searchQuery = signal('');
  contractType = signal<'sale' | 'rent' | null>(null);

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

  selectType(type: 'sale' | 'rent'): void {
    // Toggle: se già selezionato, deseleziona
    this.contractType.set(this.contractType() === type ? null : type);
  }

  onSearch(): void {
    this.router.navigate(['/pages/properties-page'], {
      queryParams: {
        search: this.searchQuery(),
        type: this.contractType(),
      }
    });
  }
}