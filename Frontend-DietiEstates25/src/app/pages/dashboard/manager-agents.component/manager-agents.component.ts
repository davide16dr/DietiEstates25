import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface Agent {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: 'attivo' | 'inattivo';
  properties: number;
  sales: number;
  avatar: string;
  createdBy?: number; // ID del gestore che ha creato l'agente
  agencyId?: number; // ID dell'agenzia
}

@Component({
  selector: 'app-manager-agents',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './manager-agents.component.html',
  styleUrl: './manager-agents.component.scss',
})
export class ManagerAgentsComponent {
  searchQuery = signal('');
  filterStatus = signal<string>('tutti');
  filterOwnership = signal<string>('tutti'); // Nuovo filtro per proprietà

  // ID del gestore corrente (in un caso reale verrebbe dall'AuthService)
  currentManagerId = 1;
  currentAgencyId = 1;

  agents: Agent[] = [
    {
      id: 1,
      name: 'Lucia Bianchi',
      email: 'lucia.bianchi@dietiestates.it',
      phone: '+39 345 123 4567',
      status: 'attivo',
      properties: 12,
      sales: 8,
      avatar: 'https://ui-avatars.com/api/?name=Lucia+Bianchi&background=0f7a55&color=fff',
      createdBy: 1, // Creato dal gestore corrente
      agencyId: 1
    },
    {
      id: 2,
      name: 'Marco Colombo',
      email: 'marco.colombo@dietiestates.it',
      phone: '+39 348 987 6543',
      status: 'attivo',
      properties: 9,
      sales: 5,
      avatar: 'https://ui-avatars.com/api/?name=Marco+Colombo&background=3b82f6&color=fff',
      createdBy: 1, // Creato dal gestore corrente
      agencyId: 1
    },
    {
      id: 3,
      name: 'Sara Romano',
      email: 'sara.romano@dietiestates.it',
      phone: '+39 342 456 7890',
      status: 'attivo',
      properties: 15,
      sales: 12,
      avatar: 'https://ui-avatars.com/api/?name=Sara+Romano&background=8b5cf6&color=fff',
      createdBy: 2, // Creato da un altro gestore della stessa agenzia
      agencyId: 1
    },
    {
      id: 4,
      name: 'Giuseppe Ferrara',
      email: 'giuseppe.ferrara@dietiestates.it',
      phone: '+39 349 234 5678',
      status: 'attivo',
      properties: 7,
      sales: 3,
      avatar: 'https://ui-avatars.com/api/?name=Giuseppe+Ferrara&background=ef4444&color=fff',
      createdBy: 1, // Creato dal gestore corrente
      agencyId: 1
    },
    {
      id: 5,
      name: 'Francesca Rizzo',
      email: 'francesca.rizzo@dietiestates.it',
      phone: '+39 346 567 8901',
      status: 'attivo',
      properties: 11,
      sales: 7,
      avatar: 'https://ui-avatars.com/api/?name=Francesca+Rizzo&background=f59e0b&color=fff',
      createdBy: 2, // Creato da un altro gestore della stessa agenzia
      agencyId: 1
    },
    {
      id: 6,
      name: 'Roberto Greco',
      email: 'roberto.greco@dietiestates.it',
      phone: '+39 347 890 1234',
      status: 'attivo',
      properties: 6,
      sales: 4,
      avatar: 'https://ui-avatars.com/api/?name=Roberto+Greco&background=06b6d4&color=fff',
      createdBy: 1, // Creato dal gestore corrente
      agencyId: 1
    },
    {
      id: 7,
      name: 'Elena Marino',
      email: 'elena.marino@dietiestates.it',
      phone: '+39 344 678 9012',
      status: 'inattivo',
      properties: 3,
      sales: 1,
      avatar: 'https://ui-avatars.com/api/?name=Elena+Marino&background=6b7280&color=fff',
      createdBy: 2, // Creato da un altro gestore della stessa agenzia
      agencyId: 1
    },
    {
      id: 8,
      name: 'Andrea Costa',
      email: 'andrea.costa@dietiestates.it',
      phone: '+39 343 789 0123',
      status: 'inattivo',
      properties: 2,
      sales: 0,
      avatar: 'https://ui-avatars.com/api/?name=Andrea+Costa&background=6b7280&color=fff',
      createdBy: 1, // Creato dal gestore corrente
      agencyId: 1
    },
    // Agenti di ALTRE AGENZIE - NON VISIBILI al gestore corrente
    {
      id: 9,
      name: 'Paolo Esposito',
      email: 'paolo.esposito@altra-agenzia.it',
      phone: '+39 340 111 2222',
      status: 'attivo',
      properties: 20,
      sales: 15,
      avatar: 'https://ui-avatars.com/api/?name=Paolo+Esposito&background=dc2626&color=fff',
      createdBy: 3, // Creato da un gestore di un'altra agenzia
      agencyId: 2 // AGENZIA DIVERSA
    },
    {
      id: 10,
      name: 'Maria Conti',
      email: 'maria.conti@altra-agenzia.it',
      phone: '+39 341 333 4444',
      status: 'attivo',
      properties: 18,
      sales: 12,
      avatar: 'https://ui-avatars.com/api/?name=Maria+Conti&background=7c3aed&color=fff',
      createdBy: 3, // Creato da un gestore di un'altra agenzia
      agencyId: 2 // AGENZIA DIVERSA
    }
  ];

  get filteredAgents(): Agent[] {
    // Filtro base: mostra SOLO gli agenti della stessa agenzia del gestore
    let filtered = this.agents.filter(a => a.agencyId === this.currentAgencyId);

    // Filtro per proprietà (i miei agenti vs tutti dell'agenzia)
    if (this.filterOwnership() === 'miei') {
      filtered = filtered.filter(a => a.createdBy === this.currentManagerId);
    }
    // Nota: 'agenzia' è ridondante ora, ma lo mantengo per chiarezza UI
    // perché filtra già per agencyId sopra

    // Filtro per stato
    if (this.filterStatus() !== 'tutti') {
      filtered = filtered.filter(a => a.status === this.filterStatus());
    }

    // Filtro per ricerca
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
    // Statistiche calcolate SOLO sugli agenti della stessa agenzia
    const agentiAgenzia = this.agents.filter(a => a.agencyId === this.currentAgencyId);
    const totali = agentiAgenzia.length;
    const attivi = agentiAgenzia.filter(a => a.status === 'attivo').length;
    const mieiAgenti = agentiAgenzia.filter(a => a.createdBy === this.currentManagerId).length;
    const totalProperties = agentiAgenzia.reduce((sum, a) => sum + a.properties, 0);
    const totalSales = agentiAgenzia.reduce((sum, a) => sum + a.sales, 0);
    
    return { totali, attivi, mieiAgenti, totalProperties, totalSales };
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  onFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.filterStatus.set(select.value);
  }

  onOwnershipFilterChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.filterOwnership.set(select.value);
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
    agent.status = agent.status === 'attivo' ? 'inattivo' : 'attivo';
    console.log('Agent status toggled:', agent);
    // TODO: Update backend
  }

  getStatusClass(status: string): string {
    return status === 'attivo' ? 'status-active' : 'status-inactive';
  }

  getStatusLabel(status: string): string {
    return status === 'attivo' ? 'Attivo' : 'Inattivo';
  }
}
