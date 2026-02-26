import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EditAgentModalComponent, AgentEdit } from '../edit-agent-modal.component/edit-agent-modal.component';
import { AddAgentModalComponent, NewAgent } from '../add-agent-modal.component/add-agent-modal.component';

interface Agent {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: 'attivo' | 'disattivato';
}

@Component({
  selector: 'app-admin-agents',
  standalone: true,
  imports: [CommonModule, RouterModule, EditAgentModalComponent, AddAgentModalComponent],
  templateUrl: './admin-agents.component.html',
  styleUrl: './admin-agents.component.scss',
})
export class AdminAgentsComponent {
  searchQuery = signal('');
  
  // Modal state
  showEditModal = signal(false);
  showAddModal = signal(false);
  selectedAgent = signal<Agent | null>(null);

  agents: Agent[] = [
    {
      id: 1,
      name: 'Lucia Bianchi',
      email: 'agent@dietiestates.it',
      phone: '+39 02 3456789',
      status: 'attivo'
    },
    {
      id: 2,
      name: 'Marco Colombo',
      email: 'agent2@dietiestates.it',
      phone: '+39 02 6789012',
      status: 'attivo'
    },
    {
      id: 3,
      name: 'Sara Romano',
      email: 'agent3@dietiestates.it',
      phone: '+39 02 7890123',
      status: 'disattivato'
    }
  ];

  get stats() {
    const totali = this.agents.length;
    const attivi = this.agents.filter(a => a.status === 'attivo').length;
    const disattivati = this.agents.filter(a => a.status === 'disattivato').length;
    return { totali, attivi, disattivati };
  }

  get filteredAgents(): Agent[] {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.agents;

    return this.agents.filter(a => 
      a.name.toLowerCase().includes(query) ||
      a.email.toLowerCase().includes(query) ||
      a.phone.includes(query)
    );
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  editAgent(agent: Agent): void {
    this.selectedAgent.set(agent);
    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    this.selectedAgent.set(null);
  }

  openAddModal(): void {
    this.showAddModal.set(true);
  }

  closeAddModal(): void {
    this.showAddModal.set(false);
  }

  addNewAgent(newAgent: NewAgent): void {
    const maxId = Math.max(...this.agents.map(a => a.id), 0);
    const agent: Agent = {
      id: maxId + 1,
      name: newAgent.name,
      email: newAgent.email,
      phone: newAgent.phone,
      status: newAgent.status === 'inattivo' ? 'disattivato' : newAgent.status
    };
    this.agents.push(agent);
    this.closeAddModal();
  }

  saveAgent(updatedAgent: AgentEdit): void {
    const index = this.agents.findIndex(a => a.id === updatedAgent.id);
    if (index !== -1) {
      this.agents[index] = updatedAgent as Agent;
    }
    this.closeEditModal();
  }

  toggleAgentStatus(agent: Agent): void {
    agent.status = agent.status === 'attivo' ? 'disattivato' : 'attivo';
    console.log('Agent status toggled:', agent);
  }

  getAgentInitials(name: string): string {
    return name.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  }

  getStatusClass(status: string): string {
    return status === 'attivo' ? 'status-active' : 'status-inactive';
  }

  getStatusLabel(status: string): string {
    return status === 'attivo' ? 'Attivo' : 'Disattivato';
  }
}
