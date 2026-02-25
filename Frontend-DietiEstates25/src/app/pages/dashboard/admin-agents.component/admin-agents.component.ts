import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

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
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-agents.component.html',
  styleUrl: './admin-agents.component.scss',
})
export class AdminAgentsComponent {
  searchQuery = signal('');

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

  viewAgentDetails(agent: Agent): void {
    console.log('View agent details:', agent);
    // TODO: Navigate to agent details or open modal
  }

  editAgent(agent: Agent): void {
    console.log('Edit agent:', agent);
    // TODO: Open edit modal
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
