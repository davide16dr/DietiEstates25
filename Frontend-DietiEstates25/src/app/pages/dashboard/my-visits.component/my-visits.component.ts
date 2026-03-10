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

  // Callback per le notifiche WebSocket - DEVE essere una arrow function per mantenere il contesto 'this'
  private notificationCallback = (notification: WebSocketNotification) => {
    console.log('📅 [MyVisits] Notifica WebSocket ricevuta:', notification);
    console.log('📅 [MyVisits] Tipo:', notification.type);
    console.log('📅 [MyVisits] Titolo:', notification.title);
    console.log('📅 [MyVisits] Body:', notification.body);
    
    // ✅ Ricarica le visite per TUTTI i tipi di notifiche relative alle visite
    const visitNotificationTypes = [
      'VISIT_CONFIRMED',
      'VISIT_REJECTED', 
      'VISIT_COMPLETED',
      'VISIT_CANCELLED_BY_AGENT',
      'VISIT_STATUS_CHANGED',
      'NEW_VISIT_REQUEST'
    ];
    
    const shouldReload = visitNotificationTypes.includes(notification.type) || 
                        notification.type?.includes('VISIT');
    
    if (shouldReload) {
      console.log('🔄 [MyVisits] Ricarico le visite del cliente...');
      this.loadVisits();
    } else {
      console.log('⏭️ [MyVisits] Notifica ignorata (non è una notifica visita)');
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
    console.log('🎯 [MyVisits] Componente inizializzato');
    console.log('🎯 [MyVisits] WebSocket connesso?', this.websocketService.connected());
    
    // Carica le visite iniziali
    this.loadVisits();
    
    // Registra il callback per le notifiche WebSocket
    console.log('📡 [MyVisits] Registrazione callback per notifiche visite cliente');
    this.websocketService.onNotification(this.notificationCallback);
    console.log('✅ [MyVisits] Callback registrato con successo');
  }

  ngOnDestroy(): void {
    console.log('🔌 [MyVisits] Componente distrutto - rimuovo callback');
    // Rimuovi il callback quando il componente viene distrutto
    this.websocketService.removeNotificationCallback(this.notificationCallback);
    console.log('✅ [MyVisits] Callback rimosso');
  }

  loadVisits(): void {
    console.log('📥 [MyVisits] Caricamento visite in corso...');
    this.loading.set(true);
    
    this.dashboardService.getVisits().subscribe({
      next: (visits) => {
        console.log('✅ [MyVisits] Visite caricate:', visits.length);
        console.log('📋 [MyVisits] Dettaglio visite:', visits);
        this.visits.set(visits);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('❌ [MyVisits] Errore caricamento visite:', err);
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
