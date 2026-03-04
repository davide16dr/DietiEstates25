import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService, Visit } from '../../../shared/services/dashboard.service';

type FilterType = 'all' | 'confirmed' | 'cancelled' | 'past';

@Component({
  selector: 'app-agent-visits',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './agent-visits.component.html',
  styleUrl: './agent-visits.component.scss',
})
export class AgentVisitsComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  
  loading = signal(true);
  visits = signal<Visit[]>([]);
  activeFilter = signal<FilterType>('all');

  stats = computed(() => {
    const allVisits = this.visits();
    const inAttesa = allVisits.filter(v => v.status === 'REQUESTED').length;
    const confermate = allVisits.filter(v => v.status === 'CONFIRMED').length;
    const completate = allVisits.filter(v => v.status === 'COMPLETED').length;
    const rifiutate = allVisits.filter(v => v.status === 'CANCELLED').length;
    const passate = allVisits.filter(v => this.isPastVisit(v)).length;
    
    return { inAttesa, confermate, completate, rifiutate, passate };
  });

  filteredVisits = computed(() => {
    const allVisits = this.visits();
    const filter = this.activeFilter();

    switch (filter) {
      case 'confirmed':
        return allVisits.filter(v => v.status === 'CONFIRMED');
      case 'cancelled':
        return allVisits.filter(v => v.status === 'CANCELLED');
      case 'past':
        return allVisits.filter(v => this.isPastVisit(v));
      default:
        return allVisits;
    }
  });

  ngOnInit(): void {
    this.loadVisits();
  }

  setFilter(filter: FilterType): void {
    this.activeFilter.set(filter);
  }

  isPastVisit(visit: Visit): boolean {
    if (!visit.scheduledDate) return false;
    const visitDate = new Date(visit.scheduledDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return visitDate < today;
  }

  loadVisits(): void {
    this.loading.set(true);
    
    this.dashboardService.getAgentVisits().subscribe({
      next: (visits) => {
        this.visits.set(visits);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading agent visits:', err);
        this.visits.set([]);
        this.loading.set(false);
      }
    });
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'REQUESTED': 'status-pending',
      'CONFIRMED': 'status-confirmed',
      'COMPLETED': 'status-completed',
      'CANCELLED': 'status-cancelled'
    };
    return classes[status] || 'status-pending';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'REQUESTED': 'In Attesa',
      'CONFIRMED': 'Confermata',
      'COMPLETED': 'Completata',
      'CANCELLED': 'Annullata'
    };
    return labels[status] || status;
  }

  confirmVisit(visitId: number): void {
    if (!confirm('Confermare questa visita?')) return;

    this.dashboardService.confirmVisit(visitId).subscribe({
      next: () => {
        this.visits.update(list =>
          list.map(v => v.id === visitId ? { ...v, status: 'CONFIRMED' } : v)
        );
      },
      error: (err) => {
        console.error('Error confirming visit:', err);
        alert('Errore durante la conferma della visita');
      }
    });
  }

  completeVisit(visitId: number): void {
    if (!confirm('Segnare questa visita come completata?')) return;

    this.dashboardService.completeVisit(visitId).subscribe({
      next: () => {
        this.visits.update(list =>
          list.map(v => v.id === visitId ? { ...v, status: 'COMPLETED' } : v)
        );
      },
      error: (err) => {
        console.error('Error completing visit:', err);
        alert('Errore durante il completamento della visita');
      }
    });
  }

  rejectVisit(visitId: number): void {
    const reason = prompt('Motivo del rifiuto (facoltativo):');
    if (reason === null) return; // User cancelled

    this.dashboardService.rejectVisit(visitId, reason || undefined).subscribe({
      next: () => {
        this.visits.update(list =>
          list.map(v => v.id === visitId ? { ...v, status: 'CANCELLED' } : v)
        );
      },
      error: (err) => {
        console.error('Error rejecting visit:', err);
        alert('Errore durante il rifiuto della visita');
      }
    });
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }
}
