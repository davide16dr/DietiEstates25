import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EditManagerModalComponent, ManagerEdit } from '../edit-manager-modal.component/edit-manager-modal.component';
import { AddManagerModalComponent, NewManager } from '../add-manager-modal.component/add-manager-modal.component';
import { UserService, User } from '../../../shared/services/user.service';
import { ToastService } from '../../../shared/services/toast.service';

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
  private toast = inject(ToastService);
  
  searchQuery = signal('');
  statusFilter = signal<'tutti' | 'attivi' | 'inattivi'>('tutti'); 
  managers = signal<Manager[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  
  
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
    const statusFilter = this.statusFilter();
    let mgrs = this.managers();

    
    if (statusFilter === 'attivi') {
      mgrs = mgrs.filter(m => m.status === 'attivo');
    } else if (statusFilter === 'inattivi') {
      mgrs = mgrs.filter(m => m.status === 'inattivo');
    }

    
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

  onStatusFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.statusFilter.set(select.value as 'tutti' | 'attivi' | 'inattivi');
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
    
    const updateData = {
      firstName: updatedManager.name.split(' ')[0], 
      lastName: updatedManager.name.split(' ').slice(1).join(' '), 
      phoneE164: updatedManager.phone,
      active: updatedManager.status === 'attivo'
    };

    console.log('🔄 Aggiornamento gestore:', updatedManager.id, updateData);

    this.userService.updateUser(updatedManager.id, updateData).subscribe({
      next: (updatedUser) => {
        console.log('✅ Gestore aggiornato con successo:', updatedUser);
        this.closeEditModal();
        
        this.loadManagers();
      },
      error: (err: any) => {
        console.error('❌ Errore nell\'aggiornamento del gestore:', err);
        this.toast.error('Errore', 'Errore durante l\'aggiornamento del gestore. Riprova.');
      }
    });
  }

  toggleManagerStatus(manager: Manager): void {
    this.userService.toggleUserStatus(manager.id).subscribe({
      next: () => {
        manager.status = manager.status === 'attivo' ? 'inattivo' : 'attivo';
        console.log('Manager status toggled:', manager);
        this.loadManagers(); 
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
    
    const managerData = {
      name: newManager.name,
      email: newManager.email,
      phone: newManager.phone,
      status: newManager.status,
      role: 'AGENCY_MANAGER'  
    };

    console.log('➕ Creazione nuovo gestore:', managerData);

    this.userService.createUser(managerData as any).subscribe({
      next: (createdManager) => {
        console.log('✅ Gestore creato con successo:', createdManager);
        this.closeAddModal();
        
        this.loadManagers();
      },
      error: (err: any) => {
        console.error('❌ Errore nella creazione del gestore:', err);
        if (err.status === 409) {
          this.toast.error('Email già in uso', 'Questa email è già utilizzata da un altro utente.');
        } else {
          this.toast.error('Errore', 'Errore durante la creazione del gestore. Riprova.');
        }
      }
    });
  }

  getStatusClass(status: string): string {
    return status === 'attivo' ? 'status-active' : 'status-inactive';
  }

  getStatusLabel(status: string): string {
    return status === 'attivo' ? 'Attivo' : 'Inattivo';
  }
}
