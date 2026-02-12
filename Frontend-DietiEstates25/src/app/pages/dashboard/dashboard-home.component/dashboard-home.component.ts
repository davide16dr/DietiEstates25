import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../shared/services/auth.service';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-home.component.html',
  styleUrl: './dashboard-home.component.scss',
})
export class DashboardHomeComponent {
  private authService = inject(AuthService);  
  currentUser = this.authService.currentUser;

  get userName(): string {
    const user = this.currentUser();
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

  get isAgent(): boolean {
    const user = this.currentUser();
    return user?.role?.toLowerCase() === 'agent';
  }

  // Stats per clienti
  get clientStats() {
    return [
      { label: 'Ricerche Salvate', value: 3, pillIcon: '🔍', pillBg: '#e9f7ef', pillColor: '#0f7a55' },
      { label: 'Visite Programmate', value: 2, pillIcon: '📅', pillBg: '#eaf2ff', pillColor: '#2563eb' },
      { label: 'Offerte Attive', value: 2, pillIcon: '📄', pillBg: '#fff4e5', pillColor: '#b45309' },
      { label: 'Notifiche', value: 2, pillIcon: '🔔', pillBg: '#ffe9e9', pillColor: '#dc2626' },
    ];
  }

  // Stats per agenti
  get agentStats() {
    return [
      { label: 'Immobili Attivi', value: 4, pillIcon: '🏠', pillBg: '#e9f7ef', pillColor: '#0f7a55' },
      { label: 'Visite in Attesa', value: 1, pillIcon: '📅', pillBg: '#fff4e5', pillColor: '#b45309' },
      { label: 'Offerte in Attesa', value: 1, pillIcon: '🤝', pillBg: '#eaf2ff', pillColor: '#2563eb' },
      { label: 'Venduti/Affittati', value: 2, pillIcon: '✓', pillBg: '#f3e8ff', pillColor: '#7c3aed' },
    ];
  }

  get stats() {
    return this.isAgent ? this.agentStats : this.clientStats;
  }
}
