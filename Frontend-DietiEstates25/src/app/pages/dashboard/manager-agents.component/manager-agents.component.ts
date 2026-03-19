import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EditAgentModalComponent, AgentEdit } from '../edit-agent-modal.component/edit-agent-modal.component';
import { AddAgentModalComponent, NewAgent } from '../add-agent-modal.component/add-agent-modal.component';
import { UserService, User } from '../../../shared/services/user.service';
import { ToastService } from '../../../shared/services/toast.service';

interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'attivo' | 'inattivo';
  avatar: string;
  totalProperties?: number;
  activeProperties?: number;
  soldProperties?: number;
  rentedProperties?: number;
}

@Component({
  selector: 'app-manager-agents',
  standalone: true,
  imports: [CommonModule, RouterModule, EditAgentModalComponent, AddAgentModalComponent],
  templateUrl: './manager-agents.component.html',
  styleUrl: './manager-agents.component.scss',
})
export class ManagerAgentsComponent implements OnInit {
  private userService = inject(UserService);
  private toast = inject(ToastService);

  searchQuery = signal('');
  filterStatus = signal<string>('tutti');
  
  
  agents = signal<Agent[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  
  
  showEditModal = signal(false);
  showAddModal = signal(false);
  selectedAgent = signal<Agent | null>(null);

  ngOnInit(): void {
    this.loadAgents();
  }

  loadAgents(): void {
    this.isLoading.set(true);
    this.error.set(null);

    
    this.userService.getAgentsWithStats().subscribe({
      next: (users: User[]) => {
        console.log('📋 Agenti con statistiche ricevuti (Manager):', users);

        
        const mappedAgents: Agent[] = users.map(user => ({
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          phone: user.phoneE164 || 'N/A',
          status: user.active ? 'attivo' : 'inattivo',
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.firstName + ' ' + user.lastName)}&background=0f7a55&color=fff`,
          totalProperties: user.totalProperties || 0,
          activeProperties: user.activeProperties || 0,
          soldProperties: user.soldProperties || 0,
          rentedProperties: user.rentedProperties || 0
        }));

        this.agents.set(mappedAgents);
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('❌ Errore nel caricamento degli agenti:', err);
        this.error.set('Errore nel caricamento degli agenti. Riprova più tardi.');
        this.isLoading.set(false);
      }
    });
  }

  get filteredAgents(): Agent[] {
    let filtered = this.agents();

    
    if (this.filterStatus() !== 'tutti') {
      filtered = filtered.filter(a => a.status === this.filterStatus());
    }

    
    const query = this.searchQuery().toLowerCase();
    if (query) {
      filtered = filtered.filter(a => 
        a.name.toLowerCase().includes(query) ||
        a.email.toLowerCase().includes(query) ||
        a.phone.includes(query)
      );
    }

    return filtered;
  }

  get stats() {
    const all = this.agents();
    const totali = all.length;
    const attivi = all.filter(a => a.status === 'attivo').length;
    const inattivi = all.filter(a => a.status === 'inattivo').length;
    const totalProperties = all.reduce((sum, a) => sum + (a.totalProperties || 0), 0);
    const totalSales = all.reduce((sum, a) => sum + ((a.soldProperties || 0) + (a.rentedProperties || 0)), 0);
    
    return { totali, attivi, inattivi, totalProperties, totalSales };
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  onFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.filterStatus.set(select.value);
  }

  
  openAddModal(): void {
    this.showAddModal.set(true);
  }

  closeAddModal(): void {
    this.showAddModal.set(false);
  }

  addNewAgent(newAgent: NewAgent): void {
    
    const agentData = {
      name: newAgent.name,
      email: newAgent.email,
      phone: newAgent.phone,
      status: newAgent.status,
      password: 'Password123!' 
    };

    console.log('➕ Creazione nuovo agente:', agentData);

    this.userService.createUser(agentData as any).subscribe({
      next: (createdAgent) => {
        console.log('✅ Agente creato con successo:', createdAgent);
        this.closeAddModal();
        
        this.loadAgents();
      },
      error: (err: any) => {
        console.error('❌ Errore nella creazione dell\'agente:', err);
        if (err.status === 409) {
          this.toast.error('Email già in uso', 'Questa email è già utilizzata da un altro utente.');
        } else {
          this.toast.error('Errore', 'Errore durante la creazione dell\'agente. Riprova.');
        }
      }
    });
  }

  editAgent(agent: Agent): void {
    this.selectedAgent.set(agent);
    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    this.selectedAgent.set(null);
  }

  saveAgent(updatedAgent: AgentEdit): void {
    
    const updateData = {
      firstName: updatedAgent.name.split(' ')[0], 
      lastName: updatedAgent.name.split(' ').slice(1).join(' '), 
      phoneE164: updatedAgent.phone,
      active: updatedAgent.status === 'attivo'
    };

    console.log('🔄 Aggiornamento agente:', updatedAgent.id, updateData);

    this.userService.updateUser(updatedAgent.id, updateData).subscribe({
      next: (updatedUser) => {
        console.log('✅ Agente aggiornato con successo:', updatedUser);
        this.closeEditModal();
        
        this.loadAgents();
      },
      error: (err: any) => {
        console.error('❌ Errore nell\'aggiornamento dell\'agente:', err);
        this.toast.error('Errore', 'Errore durante l\'aggiornamento dell\'agente. Riprova.');
      }
    });
  }

  toggleAgentStatus(agent: Agent): void {
    console.log('🔄 Toggle status per agente:', agent.id);

    this.userService.toggleUserStatus(agent.id).subscribe({
      next: (updatedUser) => {
        console.log('✅ Status agente aggiornato:', updatedUser);
        
        this.loadAgents();
      },
      error: (err: any) => {
        console.error('❌ Errore nel toggle status:', err);
        this.toast.error('Errore', 'Errore durante il cambio di stato. Riprova.');
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
