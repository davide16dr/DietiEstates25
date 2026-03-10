import { Component, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NavbarComponent } from './shared/components/navbar.component/navbar.component';
import { FooterComponent } from './shared/components/footer.component/footer.component';
import { ToastComponent } from './shared/components/toast/toast.component';
import { NotificationService } from './shared/services/notification.service';
import { WebSocketService } from './shared/services/websocket.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, FooterComponent, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('Frontend-DietiEstates25');

  // 🔔 Iniettare il NotificationService per avviare il polling automatico
  private notificationService = inject(NotificationService);
  
  // 🔌 Iniettare il WebSocketService per avviare la connessione WebSocket
  private websocketService = inject(WebSocketService);

  private hideNavbarRoutes = ['/auth/login', '/auth/register', '/auth/register-business', '/auth/forgot-password', '/auth/reset-password'];
  private hideFooterRoutes = ['/auth/login', '/auth/register', '/auth/register-business', '/auth/forgot-password', '/auth/reset-password', '/dashboard'];
  
  showNavbar = signal(true);
  showFooter = signal(true);
  isDashboard = signal(false);

  constructor(private router: Router) {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const url = event.urlAfterRedirects;
        
        this.showNavbar.set(
          !this.hideNavbarRoutes.some(route => url === route || url.startsWith(route))
        );
        
        // Nascondi il footer se l'URL è nelle rotte specifiche O se inizia con /dashboard
        this.showFooter.set(
          !this.hideFooterRoutes.some(route => url === route || url.startsWith(route))
        );

        // Imposta la modalità dashboard
        this.isDashboard.set(url.startsWith('/dashboard'));
      });
  }
}
