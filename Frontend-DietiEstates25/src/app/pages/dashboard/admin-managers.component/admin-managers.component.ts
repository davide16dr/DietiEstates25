import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EditManagerModalComponent, ManagerEdit } from '../edit-manager-modal.component/edit-manager-modal.component';
import { AddManagerModalComponent, NewManager } from '../add-manager-modal.component/add-manager-modal.component';

interface Manager {
  id: number;
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
export class AdminManagersComponent {
  searchQuery = signal('');
  
  // Modal state
  showEditModal = signal(false);
  showAddModal = signal(false);
  selectedManager = signal<Manager | null>(null);

  managers: Manager[] = [
    {
      id: 1,
      name: 'Giuseppe Verdi',
      email: 'manager@dietiestates.it',
      phone: '+39 02 2345678',
      status: 'attivo'
    }
  ];

  get filteredManagers(): Manager[] {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.managers;

    return this.managers.filter(m => 
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
    const index = this.managers.findIndex(m => m.id === updatedManager.id);
    if (index !== -1) {
      this.managers[index] = updatedManager as Manager;
    }
    this.closeEditModal();
  }

  toggleManagerStatus(manager: Manager): void {
    manager.status = manager.status === 'attivo' ? 'inattivo' : 'attivo';
    console.log('Manager status toggled:', manager);
  }

  addNewManager(): void {
    this.showAddModal.set(true);
  }

  closeAddModal(): void {
    this.showAddModal.set(false);
  }

  saveNewManager(newManager: NewManager): void {
    const maxId = Math.max(...this.managers.map(m => m.id), 0);
    const manager: Manager = {
      id: maxId + 1,
      name: newManager.name,
      email: newManager.email,
      phone: newManager.phone,
      status: newManager.status
    };
    this.managers.push(manager);
    this.closeAddModal();
  }

  getStatusClass(status: string): string {
    return status === 'attivo' ? 'status-active' : 'status-inactive';
  }

  getStatusLabel(status: string): string {
    return status === 'attivo' ? 'Attivo' : 'Inattivo';
  }
}
