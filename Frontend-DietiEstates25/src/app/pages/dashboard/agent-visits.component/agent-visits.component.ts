import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService, Visit } from '../../../shared/services/dashboard.service';
import { WebSocketService } from '../../../shared/services/websocket.service';
import { ToastService } from '../../../shared/services/toast.service';

type FilterType = 'all' | 'pending' | 'confirmed' | 'completed' | 'rejected' | 'past';

@Component({
  selector: 'app-agent-visits',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './agent-visits.component.html',
  styleUrl: './agent-visits.component.scss',
})
export class AgentVisitsComponent implements OnInit, OnDestroy {
  private dashboardService = inject(DashboardService);
  private websocketService = inject(WebSocketService);
  private toast = inject(ToastService);
  
  loading = signal(true);
  visits = signal<Visit[]>([]);
  activeFilter = signal<FilterType>('all');

  // Callback per le notifiche WebSocket
  private notificationCallback = (notification: any) => {
    console.log('📅 Agent ricevuto notifica visita:', notification);
    
    // Ricarica le visite quando arriva una nuova notifica
    if (notification.type?.includes('VISIT') || notification.type?.includes('NEW_VISIT_REQUEST')) {
      console.log('🔄 Ricarico le visite...');
      this.loadVisits();
    }
  };

  stats = computed(() => {
    const allVisits = this.visits();
    const inAttesa = allVisits.filter(v => v.status === 'REQUESTED').length;
    const confermate = allVisits.filter(v => v.status === 'CONFIRMED').length;
    const completate = allVisits.filter(v => v.status === 'DONE').length;
    const rifiutate = allVisits.filter(v => v.status === 'CANCELLED').length;
    const passate = allVisits.filter(v => this.isPastVisit(v)).length;
    
    return { inAttesa, confermate, completate, rifiutate, passate };
  });

  filteredVisits = computed(() => {
    const allVisits = this.visits();
    const filter = this.activeFilter();

    switch (filter) {
      case 'pending':
        return allVisits.filter(v => v.status === 'REQUESTED');
      case 'confirmed':
        return allVisits.filter(v => v.status === 'CONFIRMED');
      case 'completed':
        return allVisits.filter(v => v.status === 'DONE');
      case 'rejected':
        return allVisits.filter(v => v.status === 'CANCELLED');
      case 'past':
        return allVisits.filter(v => this.isPastVisit(v));
      case 'all':
      default:
        return allVisits;
    }
  });

  ngOnInit(): void {
    this.loadVisits();
    
    // Registra il callback per le notifiche WebSocket
    console.log('📡 Registrazione callback per notifiche visite agent');
    this.websocketService.onNotification(this.notificationCallback);
  }

  ngOnDestroy(): void {
    // Rimuovi il callback quando il componente viene distrutto
    console.log('🔌 Rimozione callback notifiche visite agent');
    this.websocketService.removeNotificationCallback(this.notificationCallback);
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
      'DONE': 'status-completed',
      'CANCELLED': 'status-cancelled'
    };
    return classes[status] || 'status-pending';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'REQUESTED': 'In Attesa',
      'CONFIRMED': 'Confermata',
      'DONE': 'Completata',
      'CANCELLED': 'Annullata'
    };
    return labels[status] || status;
  }

  confirmVisit(visitId: string): void {
    this.dashboardService.confirmVisit(visitId).subscribe({
      next: () => {
        this.visits.update(list =>
          list.map(v => v.id === visitId ? { ...v, status: 'CONFIRMED' as const } : v)
        );
      },
      error: (err) => {
        console.error('Error confirming visit:', err);
        this.toast.error('Errore', 'Errore durante la conferma della visita');
      }
    });
  }

  completeVisit(visitId: string): void {
    this.dashboardService.completeVisit(visitId).subscribe({
      next: () => {
        this.visits.update(list =>
          list.map(v => v.id === visitId ? { ...v, status: 'DONE' as const } : v)
        );
      },
      error: (err) => {
        console.error('Error completing visit:', err);
        this.toast.error('Errore', 'Errore durante il completamento della visita');
      }
    });
  }

  rejectVisit(visitId: string): void {
    this.dashboardService.rejectVisit(visitId, undefined).subscribe({
      next: () => {
        this.loadVisits(); // Ricarica la lista
        this.toast.success('Visita Rifiutata', 'La richiesta di visita è stata rifiutata');
      },
      error: (err) => {
        console.error('Error rejecting visit:', err);
        this.toast.error('Errore', 'Errore durante il rifiuto della visita');
      }
    });
  }

  cancelVisit(visitId: string): void {
    this.dashboardService.cancelVisitByAgent(visitId, undefined).subscribe({
      next: () => {
        this.loadVisits(); // Ricarica la lista
        this.toast.success('Visita Annullata', 'La visita confermata è stata annullata');
      },
      error: (err) => {
        console.error('Error cancelling visit:', err);
        this.toast.error('Errore', 'Errore durante l\'annullamento della visita');
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
