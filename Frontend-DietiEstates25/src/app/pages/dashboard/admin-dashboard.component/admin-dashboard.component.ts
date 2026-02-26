import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface AgencyStat {
  gestori: { totali: number; attivi: number };
  agenti: { totali: number; attivi: number };
  citta: string;
  indirizzo: string;
  stato: string;
}

interface Manager {
  id: number;
  name: string;
  email: string;
  status: 'attivo' | 'inattivo';
}

interface Agent {
  id: number;
  name: string;
  email: string;
  status: 'attivo' | 'disattivato';
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent {
  agencyName = 'DietiEstates Milano Centro';
  
  stats: AgencyStat = {
    gestori: { totali: 1, attivi: 1 },
    agenti: { totali: 3, attivi: 2 },
    citta: 'Milano',
    indirizzo: 'Via Roma 100',
    stato: 'Attiva'
  };

  recentManagers: Manager[] = [
    {
      id: 1,
      name: 'Giuseppe Verdi',
      email: 'manager@dietiestates.it',
      status: 'attivo'
    }
  ];

  recentAgents: Agent[] = [
    {
      id: 1,
      name: 'Lucia Bianchi',
      email: 'agent@dietiestates.it',
      status: 'attivo'
    },
    {
      id: 2,
      name: 'Marco Colombo',
      email: 'agent2@dietiestates.it',
      status: 'attivo'
    },
    {
      id: 3,
      name: 'Sara Romano',
      email: 'agent3@dietiestates.it',
      status: 'disattivato'
    }
  ];

  navigateToManagers(): void {
    
    console.log('Navigate to managers');
  }

  navigateToAgents(): void {
    console.log('Navigate to agents');
  }

  navigateToInfo(): void {
    console.log('Navigate to agency info');
  }
}
