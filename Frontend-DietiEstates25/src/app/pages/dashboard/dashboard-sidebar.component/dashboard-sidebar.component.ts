import { Component, EventEmitter, inject, Input, Output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../auth/auth.service';
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
export class DashboardSidebarComponent {
  @Input({ required: true }) collapsed!: boolean;
  @Output() toggle = new EventEmitter<void>();

  private authService = inject(AuthService);  
  currentUser = signal<any>(null);
  
  // Modal state
  showChangePasswordModal = signal(false);
  isChangingPassword = signal(false);
  passwordError = signal<string | null>(null);

  constructor() {
    // Sottoscrivi all'observable currentUser$ e aggiorna il signal
    this.authService.currentUser$.subscribe(user => {
      this.currentUser.set(user);
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
      .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
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

  get isAgent(): boolean {
    const user = this.currentUser();
    return user?.role?.toLowerCase() === 'agent';
  }

  get isManager(): boolean {
    const user = this.currentUser();
    return user?.role?.toLowerCase() === 'agency_manager';
  }

  get isAdmin(): boolean {
    const user = this.currentUser();
    return user?.role?.toLowerCase() === 'admin';
  }

  menu = computed<MenuItem[]>(() => {
    const user = this.currentUser();
    const role = user?.role?.toLowerCase();
    
    if (role === 'admin') {
      return [
        { label: 'Dashboard', icon: '▦', route: '/dashboard/admin-home' },
        { label: 'Gestori', icon: '👥', route: '/dashboard/admin-managers' },
        { label: 'Agenti', icon: '👥', route: '/dashboard/admin-agents' },
        { label: 'Info Azienda', icon: '🏢', route: '/dashboard/admin-agency-info' },
      ];
    }

    if (role === 'agency_manager') {
      return [
        { label: 'Dashboard', icon: '▦', route: '/dashboard/manager-home' },
        { label:'Gestione Agenti', icon: '👥', route: '/dashboard/manager-agents' },
        { label: 'Tutti gli Immobili', icon: '🏠', route: '/dashboard/manager-properties' },
      ];
    }
    
    if (role === 'agent') {
      return [
        { label: 'Dashboard', icon: '▦', route: '/dashboard/home' },
        { label: 'I Miei Immobili', icon: '🏠', route: '/dashboard/agent-properties', badge: 6 },
        { label: 'Visite', icon: '📅', route: '/dashboard/agent-visits', badge: 2 },
        { label: 'Offerte', icon: '🤝', route: '/dashboard/agent-offers', badge: 2 },
      ];
    }
    
    return [
      { label: 'Dashboard', icon: '▦', route: '/dashboard/home' },
      { label: 'Ricerche Salvate', icon: '🔖', route: '/dashboard/saved-searches' },
      { label: 'Le Mie Visite', icon: '📅', route: '/dashboard/visits' },
      { label: 'Le Mie Offerte', icon: '🤝', route: '/dashboard/offers' },
      { label: 'Notifiche', icon: '🔔', route: '/dashboard/notifications' },
    ];
  });

  goBackToSite() {
    window.location.href = '/';
  }

  openChangePasswordModal(): void {
    this.showChangePasswordModal.set(true);
  }

  closeChangePasswordModal(): void {
    this.showChangePasswordModal.set(false);
  }

  onPasswordChange(data: PasswordChangeData): void {
    const userId = this.authService.getCurrentUserId();
    
    if (!userId) {
      alert('Errore: utente non autenticato');
      return;
    }

    this.isChangingPassword.set(true);
    this.passwordError.set(null);

    this.authService.changePassword(userId, {
      oldPassword: data.oldPassword,
      newPassword: data.newPassword
    }).subscribe({
      next: () => {
        this.isChangingPassword.set(false);
        alert('✅ Password cambiata con successo!');
        this.closeChangePasswordModal();
      },
      error: (error) => {
        this.isChangingPassword.set(false);
        const errorMsg = error.error?.error || error.error?.message || 'Errore durante il cambio password';
        this.passwordError.set(errorMsg);
        alert('❌ ' + errorMsg);
      }
    });
  }

  logout() {
    this.authService.logout();
    window.location.href = '/auth/login';
  }
}
