import { Injectable, inject, signal, effect } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { AuthService } from '../../auth/auth.service';
import { ToastService } from './toast.service';
import { environment } from '../../../environments/environment';

export interface WebSocketNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  createdAt: string;
  listingId?: string;
  offerId?: string;
  visitId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  
  private client: Client | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000; // 3 secondi
  
  // Signal per lo stato della connessione
  connected = signal<boolean>(false);
  
  // Callbacks per diversi tipi di notifiche
  private notificationCallbacks: ((notification: WebSocketNotification) => void)[] = [];
  
  constructor() {
    // Connetti/disconnetti in base allo stato di autenticazione
    effect(() => {
      const isAuth = this.authService.isAuthenticated();
      const token = this.authService.getToken();
      
      if (isAuth && token) {
        this.connect(token);
      } else {
        this.disconnect();
      }
    });
  }
  
  /**
   * Connetti al server WebSocket
   */
  private connect(token: string): void {
    if (this.client?.connected) {
      console.log('🔌 WebSocket già connesso');
      return;
    }
    
    console.log('🔌 Connessione WebSocket in corso...');
    
    // Usa l'URL dal file di ambiente
    const wsUrl = environment.apiUrl.replace('/api', '') + '/ws';
    console.log('🔌 URL WebSocket:', wsUrl);
    
    // Crea il client STOMP
    this.client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      
      debug: (str) => {
        console.log('🔌 WebSocket Debug:', str);
      },
      
      reconnectDelay: this.reconnectDelay,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      
      onConnect: () => {
        console.log('✅ WebSocket connesso!');
        this.connected.set(true);
        this.reconnectAttempts = 0;
        this.subscribeToNotifications();
      },
      
      onDisconnect: () => {
        console.log('❌ WebSocket disconnesso');
        this.connected.set(false);
      },
      
      onStompError: (frame) => {
        console.error('❌ Errore WebSocket:', frame);
        console.error('❌ Frame headers:', frame.headers);
        console.error('❌ Frame body:', frame.body);
        
        // Controlla se l'errore è dovuto a token JWT scaduto
        if (frame.body?.includes('JWT expired') || frame.body?.includes('expired')) {
          console.warn('⚠️ Token JWT scaduto rilevato da errore WebSocket');
          this.toast.warning(
            'Sessione Scaduta',
            'La tua sessione è scaduta. Effettua nuovamente il login.'
          );
          // Logout automatico dopo 2 secondi
          setTimeout(() => {
            this.authService.logout();
          }, 2000);
          return;
        }
        
        this.connected.set(false);
        this.attemptReconnect(token);
      }
    });
    
    this.client.activate();
  }
  
  /**
   * Disconnetti dal server WebSocket
   */
  disconnect(): void {
    if (this.client) {
      console.log('🔌 Disconnessione WebSocket...');
      this.client.deactivate();
      this.client = null;
      this.connected.set(false);
      this.reconnectAttempts = 0;
    }
  }
  
  /**
   * Tenta la riconnessione
   */
  private attemptReconnect(token: string): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Tentativo di riconnessione ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);
      
      setTimeout(() => {
        this.connect(token);
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('❌ Impossibile riconnettersi al WebSocket dopo', this.maxReconnectAttempts, 'tentativi');
      
      // Controlla se il token è scaduto
      if (this.isTokenExpired(token)) {
        console.warn('⚠️ Token JWT scaduto. Effettuo logout automatico...');
        this.toast.warning(
          'Sessione Scaduta',
          'La tua sessione è scaduta. Effettua nuovamente il login.'
        );
        // Logout automatico dopo 2 secondi
        setTimeout(() => {
          this.authService.logout();
        }, 2000);
      } else {
        this.toast.error(
          'Connessione Persa',
          'Impossibile connettersi al server. Ricarica la pagina.'
        );
      }
    }
  }

  /**
   * Verifica se il token JWT è scaduto
   */
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Converti in millisecondi
      return Date.now() >= expirationTime;
    } catch (error) {
      console.error('❌ Errore parsing token JWT:', error);
      return true; // Se non riesco a parsare, considero il token scaduto
    }
  }
  
  /**
   * Iscriviti alle notifiche dell'utente corrente
   */
  private subscribeToNotifications(): void {
    // Ottieni l'utente corrente dall'Observable
    this.authService.currentUser$.subscribe(user => {
      if (!user?.userId || !this.client) {
        console.log('⚠️ Impossibile sottoscrivere: user=', user, 'client=', !!this.client);
        return;
      }
      
      console.log('👤 Sottoscrizione notifiche per utente:', user.userId, 'ruolo:', user.role);
      
      // Subscribe al topic delle notifiche personali
      const topic = `/topic/notifications/${user.userId}`;
      
      this.client.subscribe(topic, (message: IMessage) => {
        try {
          const notification: WebSocketNotification = JSON.parse(message.body);
          console.log('📬 Notifica WebSocket ricevuta:', notification);
          console.log('📬 Tipo notifica:', notification.type);
          console.log('📬 Numero callbacks registrate:', this.notificationCallbacks.length);
          
          // Mostra il toast
          this.showNotificationToast(notification);
          
          // Chiama le callback registrate
          console.log('📬 Invio notifica a', this.notificationCallbacks.length, 'callbacks...');
          this.notificationCallbacks.forEach((callback, index) => {
            console.log(`📬 Esecuzione callback ${index + 1}/${this.notificationCallbacks.length}`);
            callback(notification);
          });
          
        } catch (error) {
          console.error('❌ Errore parsing notifica WebSocket:', error);
        }
      });
      
      console.log('📡 Iscritto al topic:', topic);
      
      // Subscribe anche alle offerte
      const offersTopic = `/topic/offers/${user.userId}`;
      this.client.subscribe(offersTopic, (message: IMessage) => {
        try {
          const notification: WebSocketNotification = JSON.parse(message.body);
          console.log('💰 Notifica offerta WebSocket ricevuta:', notification);
          console.log('💰 Tipo notifica:', notification.type);
          console.log('💰 Numero callbacks registrate:', this.notificationCallbacks.length);
          
          this.showNotificationToast(notification);
          
          console.log('💰 Invio notifica a', this.notificationCallbacks.length, 'callbacks...');
          this.notificationCallbacks.forEach((callback, index) => {
            console.log(`💰 Esecuzione callback ${index + 1}/${this.notificationCallbacks.length}`);
            callback(notification);
          });
        } catch (error) {
          console.error('❌ Errore parsing notifica offerta:', error);
        }
      });
      
      console.log('📡 Iscritto al topic offerte:', offersTopic);
      
      // Subscribe anche alle visite
      const visitsTopic = `/topic/visits/${user.userId}`;
      this.client.subscribe(visitsTopic, (message: IMessage) => {
        try {
          const notification: WebSocketNotification = JSON.parse(message.body);
          console.log('📅 Notifica visita WebSocket ricevuta:', notification);
          console.log('📅 Tipo notifica:', notification.type);
          console.log('📅 Numero callbacks registrate:', this.notificationCallbacks.length);
          
          this.showNotificationToast(notification);
          
          console.log('📅 Invio notifica a', this.notificationCallbacks.length, 'callbacks...');
          this.notificationCallbacks.forEach((callback, index) => {
            console.log(`📅 Esecuzione callback ${index + 1}/${this.notificationCallbacks.length}`);
            callback(notification);
          });
        } catch (error) {
          console.error('❌ Errore parsing notifica visita:', error);
        }
      });
      
      console.log('📡 Iscritto al topic visite:', visitsTopic);
    });
  }
  
  /**
   * Mostra un toast per la notifica ricevuta
   */
  private showNotificationToast(notification: WebSocketNotification): void {
    const type = this.getToastType(notification.type);
    
    if (type === 'success') {
      this.toast.success(notification.title, notification.body, 6000);
    } else if (type === 'warning') {
      this.toast.warning(notification.title, notification.body, 6000);
    } else {
      this.toast.info(notification.title, notification.body, 6000);
    }
  }
  
  /**
   * Determina il tipo di toast in base al tipo di notifica
   */
  private getToastType(notificationType: string): 'success' | 'info' | 'warning' {
    const type = notificationType.toLowerCase();
    
    if (type.includes('accepted') || type.includes('approved') || type.includes('confirmed')) {
      return 'success';
    } else if (type.includes('rejected') || type.includes('cancelled') || type.includes('withdrawn')) {
      return 'warning';
    } else {
      return 'info';
    }
  }
  
  /**
   * Registra una callback per ricevere le notifiche
   */
  onNotification(callback: (notification: WebSocketNotification) => void): void {
    this.notificationCallbacks.push(callback);
  }
  
  /**
   * Rimuovi una callback
   */
  removeNotificationCallback(callback: (notification: WebSocketNotification) => void): void {
    const index = this.notificationCallbacks.indexOf(callback);
    if (index > -1) {
      this.notificationCallbacks.splice(index, 1);
    }
  }
}
