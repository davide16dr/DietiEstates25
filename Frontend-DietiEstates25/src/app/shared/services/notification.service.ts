import { Injectable, inject, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastService } from './toast.service';
import { AuthService } from '../../auth/auth.service';
import { WebSocketService } from './websocket.service';
import { environment } from '../../../environments/environment';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  listingId?: string;
  offerId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private authService = inject(AuthService);
  private websocketService = inject(WebSocketService);
  
  private apiUrl = `${environment.apiUrl}/notifications`;
  
  // Signal per le notifiche
  notifications = signal<Notification[]>([]);
  unreadCount = signal<number>(0);
  
  constructor() {
    // 🔌 Carica le notifiche iniziali quando l'utente è autenticato
    effect(() => {
      const isAuth = this.authService.isAuthenticated();
      if (isAuth) {
        this.loadNotifications();
      } else {
        this.notifications.set([]);
        this.unreadCount.set(0);
      }
    }, { allowSignalWrites: true });
    
    // 🔌 Registra callback per ricevere notifiche via WebSocket in tempo reale
    this.websocketService.onNotification((notification) => {
      console.log('📬 Notifica WebSocket ricevuta nel NotificationService:', notification);
      // Ricarica le notifiche per aggiornare la lista
      this.loadNotifications();
    });
  }
  
  /**
   * Carica le notifiche dal server (chiamata solo all'inizio)
   */
  loadNotifications(): void {
    this.http.get<Notification[]>(this.apiUrl).subscribe({
      next: (notifications) => {
        this.notifications.set(notifications);
        const unreadCount = notifications.filter(n => !n.isRead).length;
        this.unreadCount.set(unreadCount);
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
      }
    });
  }
  
  /**
   * Segna una notifica come letta
   */
  markAsRead(notificationId: string): void {
    this.http.put(`${this.apiUrl}/${notificationId}/read`, {}).subscribe({
      next: () => {
        this.loadNotifications();
      },
      error: (error) => {
        console.error('Error marking notification as read:', error);
      }
    });
  }
  
  /**
   * Segna tutte le notifiche come lette
   */
  markAllAsRead(): void {
    this.http.put(`${this.apiUrl}/read-all`, {}).subscribe({
      next: () => {
        this.loadNotifications();
      },
      error: (error) => {
        console.error('Error marking all notifications as read:', error);
      }
    });
  }
  
  /**
   * Elimina una notifica
   */
  deleteNotification(notificationId: string): void {
    this.http.delete(`${this.apiUrl}/${notificationId}`).subscribe({
      next: () => {
        this.loadNotifications();
      },
      error: (error) => {
        console.error('Error deleting notification:', error);
      }
    });
  }
}
