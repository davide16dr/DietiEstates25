import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { DashboardService, Visit } from '../../../shared/services/dashboard.service';
import { ToastService } from '../../../shared/services/toast.service';
import { WebSocketService, WebSocketNotification } from '../../../shared/services/websocket.service';

@Component({
  selector: 'app-my-visits',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-visits.component.html',
  styleUrls: ['./my-visits.component.scss']
})
export class MyVisitsComponent implements OnInit, OnDestroy {
  private dashboardService = inject(DashboardService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private websocketService = inject(WebSocketService);

  activeTab = signal<'upcoming' | 'past'>('upcoming');
  loading = signal(true);
  visits = signal<Visit[]>([]);

  // Callback per le notifiche WebSocket
  private notificationCallback = (notification: WebSocketNotification) => {
    console.log('📅 Cliente ricevuto notifica visita in my-visits:', notification);
    
    // Ricarica le visite quando arriva una notifica relativa alle visite
    if (notification.type?.includes('VISIT')) {
      console.log('🔄 Ricarico le visite del cliente...');
      this.loadVisits();
    }
  };

  upcomingVisits = computed(() => {
    const now = new Date();
    return this.visits().filter(v =>
      new Date(v.scheduledDate) >= now &&
      v.status !== 'CANCELLED' &&
      v.status !== 'DONE'
    );
  });

  pastVisits = computed(() => {
    const now = new Date();
    return this.visits().filter(v =>
      new Date(v.scheduledDate) < now ||
      v.status === 'CANCELLED' ||
      v.status === 'DONE'
    );
  });

  displayedVisits = computed(() =>
    this.activeTab() === 'upcoming' ? this.upcomingVisits() : this.pastVisits()
  );

  ngOnInit(): void {
    console.log('🎯 MyVisitsComponent inizializzato - setup WebSocket listener');
    this.loadVisits();
    
    // Registra il callback per le notifiche WebSocket
    console.log('📡 Registrazione callback per notifiche visite cliente');
    this.websocketService.onNotification(this.notificationCallback);
  }

  ngOnDestroy(): void {
    // Rimuovi il callback quando il componente viene distrutto
    console.log('🔌 Rimozione callback notifiche visite cliente');
    this.websocketService.removeNotificationCallback(this.notificationCallback);
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
      REQUESTED: 'status-pending',
      DONE: 'status-completed',
      CANCELLED: 'status-cancelled'
    };
    return map[status] ?? 'status-pending';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      CONFIRMED: 'Confermata',
      REQUESTED: 'In Attesa',
      DONE: 'Completata',
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
    const doCancel = () => {
      this.visits.update(list =>
        list.map(v => v.id === visit.id ? { ...v, status: 'CANCELLED' as const } : v)
      );
    };

    this.dashboardService.cancelVisit(visit.id).subscribe({
      next: doCancel,
      error: doCancel
    });
  }

  goToProperty(propertyId: string | undefined): void {
    if (propertyId) {
      this.router.navigate(['/pages/property-detail', propertyId]);
    }
  }

  goToSearch(): void {
    this.router.navigate(['/properties']);
  }
}
