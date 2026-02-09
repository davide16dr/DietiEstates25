import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../shared/services/auth.service';


type MenuItem = {
  label: string;
  icon: string;
  route: string;
};

@Component({
  selector: 'app-dashboard-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-sidebar.component.html',
  styleUrl: './dashboard-sidebar.component.scss',
})
export class DashboardSidebarComponent {
  @Input({ required: true }) collapsed!: boolean;
  @Output() toggle = new EventEmitter<void>();

  private authService = inject(AuthService);  
  currentUser = this.authService.currentUser;

  get userName(): string {
    const user = this.currentUser();
      console.log(user);
    if (!user) return 'Utente';
    
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    
    const email = user.email || '';
    const namePart = email.split('@')[0];
    
    return namePart
      .split('.')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('.');
  }

  get userRole(): string {
    const user = this.currentUser();
    if (!user) return '';
    return user.role.toLocaleLowerCase() || '';
  }

  get userInitials(): string {
    const user = this.currentUser();
    if (!user) return '';
    
    // Usa firstName e lastName se disponibili
    if (user.firstName && user.lastName) {
      return (user.firstName[0] + user.lastName[0]).toUpperCase();
    }
    
    // usa l'email
    const email = user.email || '';
    const parts = email.split('@')[0].split('.');
    
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  }

  menu: MenuItem[] = [
    { label: 'Dashboard', icon: '▦', route: '/dashboard/home' },
    { label: 'Ricerche Salvate', icon: '🔖', route: '/dashboard/saved-searches' },
    { label: 'Le Mie Visite', icon: '📅', route: '/dashboard/visits' },
    { label: 'Le Mie Offerte', icon: '🤝', route: '/dashboard/offers' },
    { label: 'Notifiche', icon: '🔔', route: '/dashboard/notifications' },
  ];

  goBackToSite() {
    window.location.href = '/';
  }

  logout() {
    console.log('logout');
  }
}
