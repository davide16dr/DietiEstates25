import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EditAgentModalComponent, AgentEdit } from '../edit-agent-modal.component/edit-agent-modal.component';
import { AddAgentModalComponent, NewAgent } from '../add-agent-modal.component/add-agent-modal.component';
import { UserService, User } from '../../../shared/services/user.service';

interface Agent {
  id: string; // ✅ Cambiato da number a string per UUID
  name: string;
  email: string;
  phone: string;
  status: 'attivo' | 'inattivo'; // ✅ Standardizzato su 'inattivo'
  avatar: string;
}

@Component({
  selector: 'app-admin-agents',
  standalone: true,
  imports: [CommonModule, RouterModule, EditAgentModalComponent, AddAgentModalComponent],
  templateUrl: './admin-agents.component.html',
  styleUrl: './admin-agents.component.scss',
})
export class AdminAgentsComponent implements OnInit {
  private userService = inject(UserService);

  searchQuery = signal('');
  
  // Stato reattivo
  agents = signal<Agent[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  
  // Modal state
  showEditModal = signal(false);
  showAddModal = signal(false);
  selectedAgent = signal<Agent | null>(null);

  ngOnInit(): void {
    this.loadAgents();
  }

  loadAgents(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.userService.getUsersByRole('AGENT').subscribe({
      next: (users: User[]) => {
        console.log('📋 Agenti ricevuti (Admin):', users);

        // Mappa gli utenti del backend in Agent per il frontend
        const mappedAgents: Agent[] = users.map(user => ({
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          phone: user.phoneE164 || 'N/A',
          status: user.active ? 'attivo' : 'inattivo', // ✅ Usa 'inattivo'
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.firstName + ' ' + user.lastName)}&background=0f7a55&color=fff`
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

  get stats() {
    const all = this.agents();
    const totali = all.length;
    const attivi = all.filter(a => a.status === 'attivo').length;
    const inattivi = all.filter(a => a.status === 'inattivo').length; // ✅ Cambiato da 'disattivati'
    return { totali, attivi, inattivi }; // ✅ Cambiato da 'disattivati'
  }

  get filteredAgents(): Agent[] {
    const all = this.agents();
    const query = this.searchQuery().toLowerCase();
    if (!query) return all;

    return all.filter(a => 
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
    // Prepara i dati per il backend
    const agentData = {
      name: newAgent.name,
      email: newAgent.email,
      phone: newAgent.phone,
      status: newAgent.status,
      password: 'Password123!' // Password default
    };

    console.log('➕ Creazione nuovo agente:', agentData);

    this.userService.createUser(agentData as any).subscribe({
      next: (createdAgent) => {
        console.log('✅ Agente creato con successo:', createdAgent);
        this.closeAddModal();
        // Ricarica la lista per mostrare il nuovo agente
        this.loadAgents();
      },
      error: (err: any) => {
        console.error('❌ Errore nella creazione dell\'agente:', err);
        if (err.status === 409) {
          alert('Errore: L\'email è già in uso da un altro utente.');
        } else {
          alert('Errore durante la creazione dell\'agente. Riprova.');
        }
      }
    });
  }

  saveAgent(updatedAgent: AgentEdit): void {
    // Prepara i dati da inviare al backend
    const updateData = {
      firstName: updatedAgent.name.split(' ')[0], // Prende il primo nome
      lastName: updatedAgent.name.split(' ').slice(1).join(' '), // Prende il cognome
      phoneE164: updatedAgent.phone,
      active: updatedAgent.status === 'attivo'
    };

    console.log('🔄 Aggiornamento agente:', updatedAgent.id, updateData);

    this.userService.updateUser(updatedAgent.id, updateData).subscribe({
      next: (updatedUser) => {
        console.log('✅ Agente aggiornato con successo:', updatedUser);
        this.closeEditModal();
        // Ricarica la lista per mostrare i dati aggiornati
        this.loadAgents();
      },
      error: (err: any) => {
        console.error('❌ Errore nell\'aggiornamento dell\'agente:', err);
        alert('Errore durante l\'aggiornamento dell\'agente. Riprova.');
      }
    });
  }

  toggleAgentStatus(agent: Agent): void {
    console.log('🔄 Toggle status per agente:', agent.id);

    this.userService.toggleUserStatus(agent.id).subscribe({
      next: (updatedUser) => {
        console.log('✅ Status agente aggiornato:', updatedUser);
        // Ricarica la lista per mostrare i dati aggiornati
        this.loadAgents();
      },
      error: (err: any) => {
        console.error('❌ Errore nel toggle status:', err);
        alert('Errore durante il cambio di stato. Riprova.');
      }
    });
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
    return status === 'attivo' ? 'Attivo' : 'Inattivo'; // ✅ Cambiato da 'Disattivato'
  }
}
