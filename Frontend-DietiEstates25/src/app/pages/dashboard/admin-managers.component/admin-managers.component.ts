import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

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
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-managers.component.html',
  styleUrl: './admin-managers.component.scss',
})
export class AdminManagersComponent {
  searchQuery = signal('');

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

  viewManagerDetails(manager: Manager): void {
    console.log('View manager details:', manager);
    // TODO: Navigate to manager details or open modal
  }

  editManager(manager: Manager): void {
    console.log('Edit manager:', manager);
  }

  toggleManagerStatus(manager: Manager): void {
    manager.status = manager.status === 'attivo' ? 'inattivo' : 'attivo';
    console.log('Manager status toggled:', manager);
  }

  addNewManager(): void {
    console.log('Add new manager');
  }

  getStatusClass(status: string): string {
    return status === 'attivo' ? 'status-active' : 'status-inactive';
  }

  getStatusLabel(status: string): string {
    return status === 'attivo' ? 'Attivo' : 'Inattivo';
  }
}
