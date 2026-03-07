import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DashboardService, Notification, NotificationPreferences } from '../../../shared/services/dashboard.service';
import { AuthService } from '../../../shared/services/auth.service';
import { WebSocketService, WebSocketNotification } from '../../../shared/services/websocket.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss'
})
export class NotificationsComponent implements OnInit, OnDestroy {
  private dashboardService = inject(DashboardService);
  private router = inject(Router);
  private authService = inject(AuthService);
  private webSocketService = inject(WebSocketService);
  private notificationCallback?: (notification: WebSocketNotification) => void;

  notifications = signal<Notification[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  // Settings modal state
  showSettingsModal = signal(false);
  preferences = signal<NotificationPreferences>({
    emailEnabled: true,
    inappEnabled: true,
    notifyNewMatching: true,
    notifyPriceChange: true,
    notifyListingUpdates: true,
    notifyVisitUpdates: true,
    notifyOfferUpdates: true
  });
  savingPreferences = signal(false);

  unreadCount = computed(() => this.notifications().filter(n => !n.read).length);

  ngOnInit(): void {
    this.loadNotifications();
    this.loadPreferences();
    
    // 🔴 REAL-TIME: Ascolta le notifiche WebSocket per aggiornamenti in tempo reale
    this.notificationCallback = (notification: WebSocketNotification) => {
      console.log('🔔 Nuova notifica WebSocket ricevuta:', notification);
      
      // Ricarica immediatamente la lista delle notifiche quando arriva una nuova notifica
      this.loadNotifications();
    };
    
    this.webSocketService.onNotification(this.notificationCallback);
  }
  
  ngOnDestroy(): void {
    // 🧹 Rimuove il listener WebSocket quando il componente viene distrutto
    if (this.notificationCallback) {
      this.webSocketService.removeNotificationCallback(this.notificationCallback);
    }
  }

  loadNotifications(): void {
    this.loading.set(true);
    this.error.set(null);
    
    this.dashboardService.getNotifications().subscribe({
      next: (notifications) => {
        this.notifications.set(notifications);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Errore caricamento notifiche:', err);
        this.error.set('Errore nel caricamento delle notifiche');
        this.loading.set(false);
      }
    });
  }

  loadPreferences(): void {
    this.dashboardService.getNotificationPreferences().subscribe({
      next: (prefs) => this.preferences.set(prefs),
      error: (err) => console.error('Errore caricamento preferenze:', err)
    });
  }

  getNotificationIcon(type: string): string {
    const icons: Record<string, string> = {
      NEW_MATCHING_LISTING: 'home',
      PRICE_CHANGED: 'attach_money',
      LISTING_UPDATED: 'update',
      LISTING_REMOVED: 'delete',
      VISIT_STATUS_CHANGED: 'calendar_today',
      OFFER_STATUS_CHANGED: 'local_offer'
    };
    return icons[type] ?? 'notifications';
  }

  getNotificationIconClass(type: string): string {
    const classes: Record<string, string> = {
      NEW_MATCHING_LISTING: 'icon-property',
      PRICE_CHANGED: 'icon-price',
      LISTING_UPDATED: 'icon-update',
      LISTING_REMOVED: 'icon-removed',
      VISIT_STATUS_CHANGED: 'icon-visit',
      OFFER_STATUS_CHANGED: 'icon-offer'
    };
    return classes[type] ?? 'icon-default';
  }

  formatTimeAgo(dateString: string): string {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffYears > 0) return `circa ${diffYears} ann${diffYears === 1 ? 'o' : 'i'} fa`;
    if (diffMonths > 0) return `circa ${diffMonths} mes${diffMonths === 1 ? 'e' : 'i'} fa`;
    if (diffDays > 0) return `${diffDays} giorn${diffDays === 1 ? 'o' : 'i'} fa`;
    if (diffHours > 0) return `${diffHours} or${diffHours === 1 ? 'a' : 'e'} fa`;
    if (diffMins > 0) return `${diffMins} minut${diffMins === 1 ? 'o' : 'i'} fa`;
    return 'adesso';
  }

  markAsRead(notification: Notification): void {
    if (notification.read) return;
    
    this.dashboardService.markNotificationAsRead(notification.id).subscribe({
      next: () => {
        this.notifications.update(list =>
          list.map(n => n.id === notification.id ? { ...n, read: true } : n)
        );
      },
      error: (err) => console.error('Errore marcatura notifica come letta:', err)
    });
  }

  markAllAsRead(): void {
    this.dashboardService.markAllNotificationsAsRead().subscribe({
      next: () => {
        this.notifications.update(list => list.map(n => ({ ...n, read: true })));
      },
      error: (err) => {
        console.error('Errore marcatura tutte come lette:', err);
        // Anche in caso di errore, aggiorna localmente per UX migliore
        this.notifications.update(list => list.map(n => ({ ...n, read: true })));
      }
    });
  }

  openNotification(notification: Notification): void {
    this.markAsRead(notification);
    
    // Determina la rotta in base al tipo di notifica
    const route = this.getNotificationRoute(notification);
    
    if (route) {
      this.router.navigate([route]);
    }
  }

  /**
   * Determina la rotta corretta in base al tipo di notifica
   */
  private getNotificationRoute(notification: Notification): string | null {
    const currentUser = this.authService.currentUser();
    const isAgent = currentUser?.role?.toLowerCase() === 'agent';
    
    // 💰 PRIORITÀ 1: Se è relativa a offerte/controproposte (controllo sul type e title)
    if (notification.type === 'OFFER_STATUS_CHANGED' ||
        notification.title?.toLowerCase().includes('offerta') ||
        notification.title?.toLowerCase().includes('controproposta')) {
      
      // Agente → pagina offerte agente
      if (isAgent) {
        return '/dashboard/agent-offers';
      }
      // Cliente → pagina le mie offerte
      return '/dashboard/offers';
    }
    
    // 📅 PRIORITÀ 2: Se è relativa a visite
    if (notification.type === 'VISIT_STATUS_CHANGED' ||
        notification.title?.toLowerCase().includes('visita')) {
      
      // Agente → pagina visite agente
      if (isAgent) {
        return '/dashboard/agent-visits';
      }
      // Cliente → pagina le mie visite
      return '/dashboard/visits';
    }
    
    // 🏠 PRIORITÀ 3: Se c'è un listingId specifico → vai al dettaglio dell'immobile
    if (notification.listingId) {
      return `/pages/property-detail/${notification.listingId}`;
    }
    
    // 🏘️ PRIORITÀ 4: Notifiche generiche sugli immobili → vai alla ricerca
    if (notification.type === 'NEW_MATCHING_LISTING' ||
        notification.type === 'PRICE_CHANGED' ||
        notification.type === 'LISTING_UPDATED' ||
        notification.type === 'LISTING_REMOVED' ||
        notification.title?.toLowerCase().includes('immobile')) {
      return '/pages/properties-page';
    }
    
    // Default: resta sulla pagina notifiche
    return null;
  }

  deleteNotification(notification: Notification, event: Event): void {
    event.stopPropagation();
    
    this.dashboardService.deleteNotification(notification.id).subscribe({
      next: () => {
        this.notifications.update(list => list.filter(n => n.id !== notification.id));
      },
      error: (err) => {
        console.error('Errore eliminazione notifica:', err);
        // Anche in caso di errore, rimuovi localmente per UX migliore
        this.notifications.update(list => list.filter(n => n.id !== notification.id));
      }
    });
  }

  openSettings(): void {
    this.showSettingsModal.set(true);
  }

  closeSettings(): void {
    this.showSettingsModal.set(false);
  }

  savePreferences(): void {
    this.savingPreferences.set(true);
    
    this.dashboardService.updateNotificationPreferences(this.preferences()).subscribe({
      next: (updated) => {
        this.preferences.set(updated);
        this.savingPreferences.set(false);
        this.closeSettings();
        alert('✅ Impostazioni salvate con successo!');
      },
      error: (err) => {
        console.error('Errore salvataggio preferenze:', err);
        this.savingPreferences.set(false);
        alert('❌ Errore nel salvataggio delle impostazioni');
      }
    });
  }

  togglePreference(key: keyof NotificationPreferences): void {
    this.preferences.update(prefs => ({
      ...prefs,
      [key]: !prefs[key]
    }));
  }
}
