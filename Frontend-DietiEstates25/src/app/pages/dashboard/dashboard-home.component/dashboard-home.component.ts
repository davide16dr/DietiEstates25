import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../shared/services/auth.service';
import { DashboardService, ClientStats, AgentStats } from '../../../shared/services/dashboard.service';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-home.component.html',
  styleUrl: './dashboard-home.component.scss',
})
export class DashboardHomeComponent implements OnInit {
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);

  currentUser = this.authService.currentUser;

  clientStatsData = signal<ClientStats | null>(null);
  agentStatsData = signal<AgentStats | null>(null);

  ngOnInit() {
    // Load stats based on user role
    if (this.isClient) {
      this.loadClientStats();
    } else if (this.isAgent) {
      this.loadAgentStats();
    }
  }

  private loadClientStats() {
    this.dashboardService.getClientStats().subscribe({
      next: (stats) => {
        this.clientStatsData.set(stats);
      },
      error: (err) => {
        console.error('Error loading client stats:', err);
      }
    });
  }

  private loadAgentStats() {
    this.dashboardService.getAgentStats().subscribe({
      next: (stats) => {
        this.agentStatsData.set(stats);
      },
      error: (err) => {
        console.error('Error loading agent stats:', err);
      }
    });
  }

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

  get isAdmin(): boolean {
    const user = this.currentUser();
    return user?.role?.toLowerCase() === 'admin';
  }

  get isManager(): boolean {
    const user = this.currentUser();
    return user?.role?.toLowerCase() === 'agency_manager';
  }

  get isClient(): boolean {
    const user = this.currentUser();
    return user?.role?.toLowerCase() === 'client';
  }

  // Stats per clienti
  get clientStats() {
    const stats = this.clientStatsData();
    return [
      { label: 'Visite Programmate', value: stats?.pendingVisits || 0, pillIcon: '📅', pillBg: '#eaf2ff', pillColor: '#2563eb' },
      { label: 'Visite Completate', value: stats?.completedVisits || 0, pillIcon: '✓', pillBg: '#e9f7ef', pillColor: '#0f7a55' },
      { label: 'Totale Visite', value: stats?.totalVisits || 0, pillIcon: '📊', pillBg: '#f3e8ff', pillColor: '#7c3aed' },
    ];
  }

  // Stats per agenti
  get agentStats() {
    const stats = this.agentStatsData();
    return [
      { label: 'Immobili Attivi', value: stats?.totalProperties || 0, pillIcon: '🏠', pillBg: '#e9f7ef', pillColor: '#0f7a55' },
      { label: 'Visite in Attesa', value: stats?.pendingVisits || 0, pillIcon: '📅', pillBg: '#fff4e5', pillColor: '#b45309' },
      { label: 'Visite di Oggi', value: stats?.todayVisits || 0, pillIcon: '🕐', pillBg: '#eaf2ff', pillColor: '#2563eb' },
      { label: 'Visite Completate', value: stats?.completedVisits || 0, pillIcon: '✓', pillBg: '#f3e8ff', pillColor: '#7c3aed' },
    ];
  }

  // Stats per manager
  get managerStats() {
    return [
      { label: 'Agenti Attivi', value: 3, pillIcon: '👥', pillBg: '#e9f7ef', pillColor: '#0f7a55' },
      { label: 'Immobili Totali', value: 12, pillIcon: '🏠', pillBg: '#eaf2ff', pillColor: '#2563eb' },
      { label: 'Visite del Mese', value: 8, pillIcon: '📅', pillBg: '#fff4e5', pillColor: '#b45309' },
      { label: 'Vendite del Mese', value: 3, pillIcon: '✓', pillBg: '#f3e8ff', pillColor: '#7c3aed' },
    ];
  }

  // Stats per admin
  get adminStats() {
    return [
      { label: 'Gestori', value: 2, pillIcon: '👔', pillBg: '#e9f7ef', pillColor: '#0f7a55' },
      { label: 'Agenti', value: 5, pillIcon: '👥', pillBg: '#eaf2ff', pillColor: '#2563eb' },
      { label: 'Immobili Totali', value: 15, pillIcon: '🏠', pillBg: '#fff4e5', pillColor: '#b45309' },
      { label: 'Fatturato Mensile', value: '€25k', pillIcon: '💰', pillBg: '#f3e8ff', pillColor: '#7c3aed' },
    ];
  }

  get stats() {
    if (this.isAdmin) return this.adminStats;
    if (this.isManager) return this.managerStats;
    if (this.isAgent) return this.agentStats;
    return this.clientStats;
  }
}
