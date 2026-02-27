import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { DashboardService, Visit } from '../../../shared/services/dashboard.service';

@Component({
  selector: 'app-my-visits',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-visits.component.html',
  styleUrls: ['./my-visits.component.scss']
})
export class MyVisitsComponent implements OnInit {
  activeTab: 'upcoming' | 'past' = 'upcoming';
  loading = true;
  visits: Visit[] = [];

  constructor(
    private dashboardService: DashboardService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadVisits();
  }

  loadVisits(): void {
    this.visits = [
      {
        id: 1,
        propertyId: 101,
        propertyTitle: 'Appartamento Centro Storico',
        propertyAddress: 'Via Roma 45, Napoli',
        scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        scheduledTime: '10:00',
        status: 'CONFIRMED',
        agentName: 'Marco Rossi'
      },
      {
        id: 2,
        propertyId: 102,
        propertyTitle: 'Villa con Giardino',
        propertyAddress: 'Via dei Fiori 12, Napoli',
        scheduledDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        scheduledTime: '15:30',
        status: 'PENDING',
        agentName: 'Laura Bianchi'
      },
      {
        id: 3,
        propertyId: 103,
        propertyTitle: 'Monolocale Vomero',
        propertyAddress: 'Via Scarlatti 78, Napoli',
        scheduledDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        scheduledTime: '11:00',
        status: 'COMPLETED',
        agentName: 'Giovanni Verdi'
      },
      {
        id: 4,
        propertyId: 104,
        propertyTitle: 'Attico Panoramico',
        propertyAddress: 'Via Posillipo 200, Napoli',
        scheduledDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        scheduledTime: '16:00',
        status: 'CANCELLED',
        agentName: 'Anna Neri'
      }
    ];
    this.loading = false;
    
    // Prova a caricare dal backend (se disponibile)
    this.dashboardService.getVisits().subscribe({
      next: (visits) => {
        if (visits.length > 0) {
          this.visits = visits;
        }
      }
    });
  }

  get upcomingVisits(): Visit[] {
    const now = new Date();
    return this.visits.filter(v => 
      new Date(v.scheduledDate) >= now && 
      v.status !== 'CANCELLED' && 
      v.status !== 'COMPLETED'
    );
  }

  get pastVisits(): Visit[] {
    const now = new Date();
    return this.visits.filter(v => 
      new Date(v.scheduledDate) < now || 
      v.status === 'CANCELLED' || 
      v.status === 'COMPLETED'
    );
  }

  get displayedVisits(): Visit[] {
    return this.activeTab === 'upcoming' ? this.upcomingVisits : this.pastVisits;
  }

  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'CONFIRMED': 'status-confirmed',
      'PENDING': 'status-pending',
      'COMPLETED': 'status-completed',
      'CANCELLED': 'status-cancelled'
    };
    return statusMap[status] || 'status-pending';
  }

  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      'CONFIRMED': 'Confermata',
      'PENDING': 'In Attesa',
      'COMPLETED': 'Completata',
      'CANCELLED': 'Annullata'
    };
    return statusMap[status] || status;
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    };
    return date.toLocaleDateString('it-IT', options);
  }

  formatShortDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  }

  getDayOfWeek(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT', { weekday: 'short' }).toUpperCase();
  }

  getDayNumber(dateStr: string): string {
    const date = new Date(dateStr);
    return date.getDate().toString();
  }

  cancelVisit(visit: Visit): void {
    if (confirm('Sei sicuro di voler annullare questa visita?')) {
      this.dashboardService.cancelVisit(visit.id).subscribe({
        next: () => {
          visit.status = 'CANCELLED';
          this.visits = [...this.visits];
          this.cdr.detectChanges();
        },
        error: () => {
          visit.status = 'CANCELLED';
          this.visits = [...this.visits];
          this.cdr.detectChanges();
        }
      });
    }
  }

  goToProperty(propertyId: number): void {
    this.router.navigate(['/property', propertyId]);
  }

  goToSearch(): void {
    this.router.navigate(['/properties']);
  }
}
