import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

type MenuItem = {
  label: string;
  icon: string; // semplice emoji/icon testuale per ora
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

  // mock user (poi lo colleghi all’auth)
  userName = 'Anna Neri';
  userRole = 'Cliente';

  menu: MenuItem[] = [
    { label: 'Dashboard', icon: '▦', route: '/dashboard/home' },
    { label: 'Ricerche Salvate', icon: '🔖', route: '/dashboard/saved-searches' },
    { label: 'Le Mie Visite', icon: '📅', route: '/dashboard/visits' },
    { label: 'Le Mie Offerte', icon: '🤝', route: '/dashboard/offers' },
    { label: 'Notifiche', icon: '🔔', route: '/dashboard/notifications' },
  ];

  // azioni (placeholder)
  goBackToSite() {
    // TODO: router verso home pubblica, o window.location
    window.location.href = '/';
  }

  logout() {
    // TODO: chiama AuthService.logout()
    console.log('logout');
  }
}
