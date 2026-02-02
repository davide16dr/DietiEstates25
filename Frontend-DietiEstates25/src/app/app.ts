import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NavbarComponent } from './shared/components/navbar.component/navbar.component';
import { FooterComponent } from './shared/components/footer.component/footer.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('Frontend-DietiEstates25');

  private hideNavbarRoutes = ['/auth/login', '/auth/register', '/auth/register-business'];
  private hideFooterRoutes = ['/auth/login', '/auth/register', '/auth/register-business', '/dashboard'];
  
  showNavbar = signal(true);
  showFooter = signal(true);

  constructor(private router: Router) {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const url = event.urlAfterRedirects;
        
        this.showNavbar.set(
          !this.hideNavbarRoutes.includes(url)
        );
        
        // Nascondi il footer se l'URL è nelle rotte specifiche O se inizia con /dashboard
        this.showFooter.set(
          !this.hideFooterRoutes.some(route => url === route || url.startsWith(route))
        );
      });
  }
}
