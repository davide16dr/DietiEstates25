import { Component, inject, signal, HostListener, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-user-menu',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.scss'],
})
export class UserMenuComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  currentUser = this.authService.currentUser;
  dropdownOpen = signal(false);
  
  // Signal reattivo per verificare se siamo nella dashboard
  isInDashboard = signal(false);
  
  constructor() {
    // Imposta il valore iniziale
    this.isInDashboard.set(this.router.url.startsWith('/dashboard'));
    
    // Ascolta i cambiamenti di navigazione
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.isInDashboard.set(this.router.url.startsWith('/dashboard'));
      });
  }
  
  // Computed per le iniziali
  get userInitials(): string {
    const user = this.currentUser();
    if (!user) return '';
    
    // Usa firstName e lastName se disponibili
    if (user.firstName && user.lastName) {
      return (user.firstName[0] + user.lastName[0]).toUpperCase();
    }
    
    // Fallback: usa l'email
    const email = user.email || '';
    const parts = email.split('@')[0].split('.');
    
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  }
  
  // Computed per il nome utente completo
  get userName(): string {
    const user = this.currentUser();
    if (!user) return 'Utente';
    
    // Usa firstName e lastName se disponibili
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    
    // Fallback: usa l'email
    const email = user.email || '';
    const namePart = email.split('@')[0];
    
    // Capitalizza la prima lettera di ogni parte
    return namePart
      .split('.')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('.');
  }
  
  // Chiudi dropdown quando si clicca fuori
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu')) {
      this.dropdownOpen.set(false);
    }
  }
  
  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.dropdownOpen.update(v => !v);
  }
  
  closeDropdown() {
    this.dropdownOpen.set(false);
  }
  
  goToSiteOrDashboard() {
    this.closeDropdown();
    if (this.isInDashboard()) {
      this.router.navigate(['/']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
  
  logout() {
    this.authService.logout();
    this.closeDropdown();
    this.router.navigate(['/']);
  }
}