import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface Property {
  id: number;
  title: string;
  location: string;
  price: number;
  type: 'vendita' | 'affitto';
  status: 'disponibile' | 'venduto' | 'affittato';
  rooms: number;
  size: number;
  image: string;
}

@Component({
  selector: 'app-agent-properties',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './agent-properties.component.html',
  styleUrl: './agent-properties.component.scss',
})
export class AgentPropertiesComponent {
  properties: Property[] = [
    {
      id: 1,
      title: 'Appartamento moderno',
      location: 'Milano Centro',
      price: 350000,
      type: 'vendita',
      status: 'disponibile',
      rooms: 3,
      size: 120,
      image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400'
    },
    {
      id: 2,
      title: 'Villa con giardino',
      location: 'Roma Nord',
      price: 750000,
      type: 'vendita',
      status: 'disponibile',
      rooms: 5,
      size: 250,
      image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400'
    },
    {
      id: 3,
      title: 'Attico panoramico',
      location: 'Napoli, Vomero',
      price: 2500,
      type: 'affitto',
      status: 'disponibile',
      rooms: 4,
      size: 180,
      image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400'
    },
    {
      id: 4,
      title: 'Monolocale centro',
      location: 'Torino Centro',
      price: 180000,
      type: 'vendita',
      status: 'venduto',
      rooms: 1,
      size: 45,
      image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400'
    },
    {
      id: 5,
      title: 'Loft industriale',
      location: 'Milano, Navigli',
      price: 1800,
      type: 'affitto',
      status: 'affittato',
      rooms: 2,
      size: 95,
      image: 'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=400'
    },
    {
      id: 6,
      title: 'Casa indipendente',
      location: 'Firenze Collina',
      price: 520000,
      type: 'vendita',
      status: 'disponibile',
      rooms: 4,
      size: 200,
      image: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400'
    }
  ];

  get stats() {
    const totale = this.properties.length;
    const disponibili = this.properties.filter(p => p.status === 'disponibile').length;
    const venduti = this.properties.filter(p => p.status === 'venduto').length;
    const affittati = this.properties.filter(p => p.status === 'affittato').length;
    
    return { totale, disponibili, venduti, affittati };
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      disponibile: 'status-available',
      venduto: 'status-sold',
      affittato: 'status-rented'
    };
    return classes[status] || '';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      disponibile: 'Disponibile',
      venduto: 'Venduto',
      affittato: 'Affittato'
    };
    return labels[status] || status;
  }

  formatPrice(price: number, type: string): string {
    if (type === 'affitto') {
      return `€${price.toLocaleString('it-IT')}/mese`;
    }
    return `€${price.toLocaleString('it-IT')}`;
  }
}
