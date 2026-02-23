import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface DashboardStats {
  agenti: { attivi: number; totali: number };
  immobili: { totali: number; disponibili: number };
  visite: { totali: number; variazione: string };
  offerte: { totali: number; periodo: string };
}

interface PropertyStatus {
  label: string;
  count: number;
  color: string;
}

interface RecentProperty {
  title: string;
  agent: string;
  status: string;
  statusColor: string;
  price: string;
}

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './manager-dashboard.component.html',
  styleUrl: './manager-dashboard.component.scss',
})
export class ManagerDashboardComponent {
  stats: DashboardStats = {
    agenti: { attivi: 6, totali: 8 },
    immobili: { totali: 45, disponibili: 32 },
    visite: { totali: 127, variazione: '+18% vs mese scorso' },
    offerte: { totali: 23, periodo: 'questo mese' }
  };

  propertyStatus: PropertyStatus[] = [
    { label: 'Disponibili', count: 32, color: '#10b981' },
    { label: 'Venduti', count: 8, color: '#6b7280' },
    { label: 'Affittati', count: 5, color: '#3b82f6' }
  ];

  recentProperties: RecentProperty[] = [
    {
      title: 'Appartamento Centro',
      agent: 'Lucia Bianchi',
      status: 'Disponibile',
      statusColor: '#10b981',
      price: '€350.000'
    },
    {
      title: 'Villa con Giardino',
      agent: 'Marco Colombo',
      status: 'Venduto',
      statusColor: '#6b7280',
      price: '€680.000'
    },
    {
      title: 'Bilocale Navigli',
      agent: 'Sara Romano',
      status: 'Affittato',
      statusColor: '#3b82f6',
      price: '€1100/mese'
    }
  ];

  navigateToAgents(): void {
    // TODO: Navigate to agents page
    console.log('Navigate to agents');
  }

  navigateToProperties(): void {
    // TODO: Navigate to properties page
    console.log('Navigate to properties');
  }
}
