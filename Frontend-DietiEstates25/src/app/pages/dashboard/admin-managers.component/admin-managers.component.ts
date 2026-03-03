import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EditManagerModalComponent, ManagerEdit } from '../edit-manager-modal.component/edit-manager-modal.component';
import { AddManagerModalComponent, NewManager } from '../add-manager-modal.component/add-manager-modal.component';
import { UserService, User } from '../../../shared/services/user.service';

interface Manager {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'attivo' | 'inattivo';
}

@Component({
  selector: 'app-admin-managers',
  standalone: true,
  imports: [CommonModule, RouterModule, EditManagerModalComponent, AddManagerModalComponent],
  templateUrl: './admin-managers.component.html',
  styleUrl: './admin-managers.component.scss',
})
export class AdminManagersComponent implements OnInit {
  private userService = inject(UserService);
  
  searchQuery = signal('');
  managers = signal<Manager[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  
  // Modal state
  showEditModal = signal(false);
  showAddModal = signal(false);
  selectedManager = signal<Manager | null>(null);

  ngOnInit(): void {
    this.loadManagers();
  }

  loadManagers(): void {
    this.isLoading.set(true);
    this.error.set(null);
    
    this.userService.getUsersByRole('AGENCY_MANAGER').subscribe({
      next: (users: User[]) => {
        const mappedManagers = users.map(user => this.mapUserToManager(user));
        this.managers.set(mappedManagers);
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('Errore nel caricamento dei gestori:', err);
        this.error.set('Errore nel caricamento dei gestori. Riprova più tardi.');
        this.isLoading.set(false);
      }
    });
  }

  private mapUserToManager(user: User): Manager {
    return {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      phone: user.phoneE164 || 'N/A',
      status: user.active ? 'attivo' : 'inattivo'
    };
  }

  get stats() {
    const mgrs = this.managers();
    const totale = mgrs.length;
    const attivi = mgrs.filter(m => m.status === 'attivo').length;
    const inattivi = mgrs.filter(m => m.status === 'inattivo').length;
    
    return { totale, attivi, inattivi };
  }

  get filteredManagers(): Manager[] {
    const query = this.searchQuery().toLowerCase();
    const mgrs = this.managers();
    if (!query) return mgrs;

    return mgrs.filter(m => 
      m.name.toLowerCase().includes(query) ||
      m.email.toLowerCase().includes(query) ||
      m.phone.includes(query)
    );
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  editManager(manager: Manager): void {
    this.selectedManager.set(manager);
    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    this.selectedManager.set(null);
  }

  saveManager(updatedManager: ManagerEdit): void {
    const managers = this.managers();
    const index = managers.findIndex(m => m.id === updatedManager.id);
    if (index !== -1) {
      managers[index] = updatedManager as Manager;
      this.managers.set([...managers]);
    }
    this.closeEditModal();
    this.loadManagers(); // Ricarica i dati dal backend
  }

  toggleManagerStatus(manager: Manager): void {
    this.userService.toggleUserStatus(manager.id).subscribe({
      next: () => {
        manager.status = manager.status === 'attivo' ? 'inattivo' : 'attivo';
        console.log('Manager status toggled:', manager);
        this.loadManagers(); // Ricarica i dati
      },
      error: (err: any) => {
        console.error('Errore nel cambio stato:', err);
        this.error.set('Errore nel cambio stato del gestore.');
      }
    });
  }

  addNewManager(): void {
    this.showAddModal.set(true);
  }

  closeAddModal(): void {
    this.showAddModal.set(false);
  }

  saveNewManager(newManager: NewManager): void {
    this.closeAddModal();
    this.loadManagers(); // Ricarica i dati dopo aver aggiunto un nuovo manager
  }

  getStatusClass(status: string): string {
    return status === 'attivo' ? 'status-active' : 'status-inactive';
  }

  getStatusLabel(status: string): string {
    return status === 'attivo' ? 'Attivo' : 'Inattivo';
  }
}
