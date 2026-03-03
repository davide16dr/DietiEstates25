import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DashboardService, Notification } from '../../../shared/services/dashboard.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss'
})
export class NotificationsComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private router = inject(Router);

  notifications = signal<Notification[]>([]);
  loading = signal(true);

  unreadCount = computed(() => this.notifications().filter(n => !n.isRead).length);

  private mockNotifications: Notification[] = [
    {
      id: 1, type: 'PROPERTY_MATCH', title: 'Nuovo immobile corrispondente',
      message: 'Un nuovo appartamento a Milano Centro corrisponde alla tua ricerca salvata.',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      isRead: false, listingId: 101
    },
    {
      id: 2, type: 'VISIT_CONFIRMED', title: 'Visita confermata',
      message: "La tua visita all'immobile in Via Monte Napoleone è stata confermata per il 25 Gennaio alle 10:00.",
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      isRead: false, listingId: 102
    },
    {
      id: 3, type: 'SPECIAL_OFFER', title: 'Offerta speciale',
      message: 'Scopri i nuovi immobili di prestigio appena arrivati nel nostro catalogo!',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      isRead: true
    },
    {
      id: 4, type: 'COUNTEROFFER', title: 'Controproposta ricevuta',
      message: "L'agente ha inviato una controproposta per l'immobile in Piazza Duomo.",
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      isRead: true, listingId: 103
    }
  ];

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.notifications.set(this.mockNotifications);
    this.loading.set(false);

    this.dashboardService.getNotifications().subscribe({
      next: (notifications) => {
        if (notifications.length > 0) this.notifications.set(notifications);
      }
    });
  }

  getNotificationIcon(type: string): string {
    const icons: Record<string, string> = {
      PROPERTY_MATCH: 'home', VISIT_CONFIRMED: 'calendar_today',
      OFFER_UPDATE: 'local_offer', COUNTEROFFER: 'description', SPECIAL_OFFER: 'sell'
    };
    return icons[type] ?? 'notifications';
  }

  getNotificationIconClass(type: string): string {
    const classes: Record<string, string> = {
      PROPERTY_MATCH: 'icon-property', VISIT_CONFIRMED: 'icon-visit',
      OFFER_UPDATE: 'icon-offer', COUNTEROFFER: 'icon-counter', SPECIAL_OFFER: 'icon-special'
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
    if (notification.isRead) return;
    this.dashboardService.markNotificationAsRead(notification.id).subscribe({
      next: () => this.notifications.update(list =>
        list.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
      )
    });
  }

  markAllAsRead(): void {
    const doMark = () => this.notifications.update(list => list.map(n => ({ ...n, isRead: true })));
    this.dashboardService.markAllNotificationsAsRead().subscribe({ next: doMark, error: doMark });
  }

  openNotification(notification: Notification): void {
    this.markAsRead(notification);
    if (notification.listingId) this.router.navigate(['/properties', notification.listingId]);
  }

  deleteNotification(notification: Notification, event: Event): void {
    event.stopPropagation();
    const doDelete = () => this.notifications.update(list => list.filter(n => n.id !== notification.id));
    this.dashboardService.deleteNotification(notification.id).subscribe({ next: doDelete, error: doDelete });
  }

  openSettings(): void {
    console.log('Open notification settings');
  }
}
