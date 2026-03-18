import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserService } from '../../../shared/services/user.service';

interface DashboardStats {
  agenti: { attivi: number; totali: number };
  immobili: { totali: number; disponibili: number; venduti: number; affittati: number };
}

interface PropertyStatus {
  label: string;
  count: number;
  color: string;
}

interface RecentProperty {
  id: string;
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
export class ManagerDashboardComponent implements OnInit {
  private userService = inject(UserService);

  
  stats = signal<DashboardStats>({
    agenti: { attivi: 0, totali: 0 },
    immobili: { totali: 0, disponibili: 0, venduti: 0, affittati: 0 }
  });
  
  propertyStatus = signal<PropertyStatus[]>([]);
  recentProperties = signal<RecentProperty[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadManagerStats();
  }

  loadManagerStats(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.userService.getManagerStats().subscribe({
      next: (data: any) => {
        console.log('📊 Statistiche manager ricevute:', data);

        
        this.stats.set({
          agenti: {
            attivi: data.agenti.attivi || 0,
            totali: data.agenti.totali || 0
          },
          immobili: {
            totali: data.immobili.totali || 0,
            disponibili: data.immobili.disponibili || 0,
            venduti: data.immobili.venduti || 0,
            affittati: data.immobili.affittati || 0
          }
        });

        
        this.propertyStatus.set([
          { 
            label: 'Disponibili', 
            count: data.immobili.disponibili || 0, 
            color: '#10b981' 
          },
          { 
            label: 'Venduti', 
            count: data.immobili.venduti || 0, 
            color: '#6b7280' 
          },
          { 
            label: 'Affittati', 
            count: data.immobili.affittati || 0, 
            color: '#3b82f6' 
          }
        ]);

        
        const mapped = (data.immobiliRecenti || []).map((prop: any) => ({
          id: prop.id,
          title: prop.title,
          agent: prop.agentName,
          status: this.mapStatus(prop.status),
          statusColor: this.getStatusColor(prop.status),
          price: this.formatPrice(prop.price, prop.currency, prop.type)
        }));
        
        this.recentProperties.set(mapped);
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('❌ Errore nel caricamento delle statistiche:', err);
        this.error.set('Errore nel caricamento delle statistiche. Riprova più tardi.');
        this.isLoading.set(false);
      }
    });
  }

  private mapStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      'ACTIVE': 'Disponibile',
      'SOLD': 'Venduto',
      'RENTED': 'Affittato',
      'SUSPENDED': 'Sospeso'
    };
    return statusMap[status] || status;
  }

  private getStatusColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      'ACTIVE': '#10b981',
      'SOLD': '#6b7280',
      'RENTED': '#3b82f6',
      'SUSPENDED': '#ef4444'
    };
    return colorMap[status] || '#6b7280';
  }

  private formatPrice(price: number, currency: string, type: string): string {
    const formatted = `${currency === 'EUR' ? '€' : currency}${price.toLocaleString('it-IT')}`;
    return type === 'RENT' ? `${formatted}/mese` : formatted;
  }

  navigateToAgents(): void {
    console.log('Navigate to agents');
  }

  navigateToProperties(): void {
    console.log('Navigate to properties');
  }
}
