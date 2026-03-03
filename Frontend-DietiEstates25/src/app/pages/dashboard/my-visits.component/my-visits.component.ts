import { Component, inject, signal, computed } from '@angular/core';
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
export class MyVisitsComponent {
  private dashboardService = inject(DashboardService);
  private router = inject(Router);

  activeTab = signal<'upcoming' | 'past'>('upcoming');
  loading = signal(true);
  visits = signal<Visit[]>([]);

  upcomingVisits = computed(() => {
    const now = new Date();
    return this.visits().filter(v =>
      new Date(v.scheduledDate) >= now &&
      v.status !== 'CANCELLED' &&
      v.status !== 'COMPLETED'
    );
  });

  pastVisits = computed(() => {
    const now = new Date();
    return this.visits().filter(v =>
      new Date(v.scheduledDate) < now ||
      v.status === 'CANCELLED' ||
      v.status === 'COMPLETED'
    );
  });

  displayedVisits = computed(() =>
    this.activeTab() === 'upcoming' ? this.upcomingVisits() : this.pastVisits()
  );

  constructor() {
    this.loadVisits();
  }

  loadVisits(): void {
    // Dati mock di fallback
    const mockVisits: Visit[] = [
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

    this.visits.set(mockVisits);
    this.loading.set(false);

    this.dashboardService.getVisits().subscribe({
      next: (visits) => {
        if (visits.length > 0) this.visits.set(visits);
      }
    });
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      CONFIRMED: 'status-confirmed',
      PENDING: 'status-pending',
      COMPLETED: 'status-completed',
      CANCELLED: 'status-cancelled'
    };
    return map[status] ?? 'status-pending';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      CONFIRMED: 'Confermata',
      PENDING: 'In Attesa',
      COMPLETED: 'Completata',
      CANCELLED: 'Annullata'
    };
    return map[status] ?? status;
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('it-IT', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  formatShortDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  }

  getDayOfWeek(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('it-IT', { weekday: 'short' }).toUpperCase();
  }

  getDayNumber(dateStr: string): string {
    return new Date(dateStr).getDate().toString();
  }

  cancelVisit(visit: Visit): void {
    if (!confirm('Sei sicuro di voler annullare questa visita?')) return;

    const doCancel = () => {
      this.visits.update(list =>
        list.map(v => v.id === visit.id ? { ...v, status: 'CANCELLED' } : v)
      );
    };

    this.dashboardService.cancelVisit(visit.id).subscribe({
      next: doCancel,
      error: doCancel
    });
  }

  goToProperty(propertyId: number): void {
    this.router.navigate(['/property', propertyId]);
  }

  goToSearch(): void {
    this.router.navigate(['/properties']);
  }
}
