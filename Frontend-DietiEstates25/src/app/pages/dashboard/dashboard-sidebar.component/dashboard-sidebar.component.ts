import { Component, input, output, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../shared/services/auth.service';
import { DashboardService, AgentStats } from '../../../shared/services/dashboard.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ChangePasswordModalComponent, PasswordChangeData } from '../change-password-modal.component/change-password-modal.component';

type MenuItem = {
  label: string;
  icon: string;
  route: string;
  badge?: number;
};

@Component({
  selector: 'app-dashboard-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, ChangePasswordModalComponent],
  templateUrl: './dashboard-sidebar.component.html',
  styleUrl: './dashboard-sidebar.component.scss',
})
export class DashboardSidebarComponent implements OnInit {
  // Modern Angular: input()/output() invece di @Input()/@Output()
  collapsed = input.required<boolean>();
  toggle = output<void>();

  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);
  private toast = inject(ToastService);

  // ✅ USA DIRETTAMENTE il signal di AuthService invece di crearne uno locale
  currentUser = this.authService.currentUser;

  // Stats for badges
  agentStats = signal<AgentStats | null>(null);

  // Modal state
  showChangePasswordModal = signal(false);
  isChangingPassword = signal(false);
  passwordError = signal<string | null>(null);

  ngOnInit(): void {
    // Carica il contatore notifiche non lette
    this.dashboardService.refreshUnreadCount();

    // Load stats if user is agent
    if (this.isAgent) {
      this.dashboardService.getAgentStats().subscribe({
        next: (stats) => this.agentStats.set(stats),
        error: (err) => console.error('Error loading agent stats:', err)
      });
    }
  }

  get userName(): string {
    const user = this.currentUser();
    if (!user) return 'Utente';
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    const namePart = (user.email ?? '').split('@')[0];
    return namePart.split('.').map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join('.');
  }

  get userRole(): string {
    return this.currentUser()?.role?.toLocaleLowerCase() ?? '';
  }

  get userInitials(): string {
    const user = this.currentUser();
    if (!user) return '';
    if (user.firstName && user.lastName) return (user.firstName[0] + user.lastName[0]).toUpperCase();
    const parts = (user.email ?? '').split('@')[0].split('.');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (user.email ?? '').substring(0, 2).toUpperCase();
  }

  get isAgent(): boolean { return this.currentUser()?.role?.toLowerCase() === 'agent'; }
  get isManager(): boolean { return this.currentUser()?.role?.toLowerCase() === 'agency_manager'; }
  get isAdmin(): boolean { return this.currentUser()?.role?.toLowerCase() === 'admin'; }

  menu = computed<MenuItem[]>(() => {
    const role = this.currentUser()?.role?.toLowerCase();
    const stats = this.agentStats();
    const unread = this.dashboardService.unreadNotificationsCount();

    if (role === 'admin') return [
      { label: 'Dashboard', icon: '▦', route: '/dashboard/admin-home' },
      { label: 'Gestori', icon: '👥', route: '/dashboard/admin-managers' },
      { label: 'Agenti', icon: '👥', route: '/dashboard/admin-agents' },
      { label: 'Info Azienda', icon: '🏢', route: '/dashboard/admin-agency-info' },
    ];

    if (role === 'agency_manager') return [
      { label: 'Dashboard', icon: '▦', route: '/dashboard/manager-home' },
      { label: 'Gestione Agenti', icon: '👥', route: '/dashboard/manager-agents' },
      { label: 'Tutti gli Immobili', icon: '🏠', route: '/dashboard/manager-properties' },
    ];

    if (role === 'agent') return [
      { label: 'Dashboard', icon: '▦', route: '/dashboard/home' },
      { label: 'I Miei Immobili', icon: '🏠', route: '/dashboard/agent-properties', badge: stats?.totalProperties },
      { label: 'Visite', icon: '📅', route: '/dashboard/agent-visits', badge: stats?.pendingVisits },
      { label: 'Offerte', icon: '🤝', route: '/dashboard/agent-offers', badge: stats?.pendingOffers },
    ];

    return [
      { label: 'Dashboard', icon: '▦', route: '/dashboard/home' },
      { label: 'Ricerche Salvate', icon: '🔖', route: '/dashboard/saved-searches' },
      { label: 'Le Mie Visite', icon: '📅', route: '/dashboard/visits' },
      { label: 'Le Mie Offerte', icon: '🤝', route: '/dashboard/offers' },
      { label: 'Notifiche', icon: '🔔', route: '/dashboard/notifications', badge: unread || undefined },
    ];
  });

  goBackToSite(): void { window.location.href = '/'; }

  openChangePasswordModal(): void { this.showChangePasswordModal.set(true); }
  closeChangePasswordModal(): void { this.showChangePasswordModal.set(false); }

  onPasswordChange(data: PasswordChangeData): void {
    const userId = this.authService.getCurrentUserId();
    if (!userId) { this.toast.error('Errore', 'Utente non autenticato'); return; }

    this.isChangingPassword.set(true);
    this.passwordError.set(null);

    this.authService.changePassword(userId, {
      oldPassword: data.oldPassword,
      newPassword: data.newPassword
    }).subscribe({
      next: () => {
        this.isChangingPassword.set(false);
        this.toast.success('Password modificata!', 'La password è stata cambiata con successo.');
        this.closeChangePasswordModal();
      },
      error: (error) => {
        this.isChangingPassword.set(false);
        const msg = error.error?.error || error.error?.message || 'Errore durante il cambio password';
        this.passwordError.set(msg);
        this.toast.error('Errore', msg);
      }
    });
  }

  logout(): void {
    this.authService.logout();
    window.location.href = '/auth/login';
  }
}
