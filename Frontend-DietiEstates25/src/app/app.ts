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
  private hideFooterRoutes = ['/auth/login', '/auth/register', '/auth/register-business'];
  
  showNavbar = signal(true);
  showFooter = signal(true);

  constructor(private router: Router) {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.showNavbar.set(
          !this.hideNavbarRoutes.includes(event.urlAfterRedirects)
        );
        this.showFooter.set(
          !this.hideFooterRoutes.includes(event.urlAfterRedirects)
        );
      });
  }
}
