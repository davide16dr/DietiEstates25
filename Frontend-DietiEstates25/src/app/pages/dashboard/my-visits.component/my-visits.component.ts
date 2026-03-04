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
    this.loading.set(true);
    
    this.dashboardService.getVisits().subscribe({
      next: (visits) => {
        this.visits.set(visits);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading visits:', err);
        this.visits.set([]);
        this.loading.set(false);
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
