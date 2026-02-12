import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Visit {
  id: number;
  propertyTitle: string;
  propertyLocation: string;
  clientName: string;
  clientEmail: string;
  date: string;
  time: string;
  status: 'in-attesa' | 'confermata' | 'completata';
  notes?: string;
}

@Component({
  selector: 'app-agent-visits',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './agent-visits.component.html',
  styleUrl: './agent-visits.component.scss',
})
export class AgentVisitsComponent {
  visits: Visit[] = [
    {
      id: 1,
      propertyTitle: 'Appartamento moderno',
      propertyLocation: 'Milano Centro',
      clientName: 'Mario Rossi',
      clientEmail: 'mario.rossi@email.com',
      date: '15 Febbraio 2026',
      time: '10:00',
      status: 'in-attesa',
      notes: 'Cliente interessato a visionare prima del weekend'
    },
    {
      id: 2,
      propertyTitle: 'Villa con giardino',
      propertyLocation: 'Roma Nord',
      clientName: 'Laura Bianchi',
      clientEmail: 'laura.bianchi@email.com',
      date: '16 Febbraio 2026',
      time: '14:30',
      status: 'confermata',
      notes: 'Visita confermata, cliente molto interessato'
    }
  ];

  get stats() {
    const inAttesa = this.visits.filter(v => v.status === 'in-attesa').length;
    const confermate = this.visits.filter(v => v.status === 'confermata').length;
    const completate = this.visits.filter(v => v.status === 'completata').length;
    
    return { inAttesa, confermate, completate };
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'in-attesa': 'status-pending',
      'confermata': 'status-confirmed',
      'completata': 'status-completed'
    };
    return classes[status] || '';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'in-attesa': 'In Attesa',
      'confermata': 'Confermata',
      'completata': 'Completata'
    };
    return labels[status] || status;
  }

  confirmVisit(visitId: number): void {
    const visit = this.visits.find(v => v.id === visitId);
    if (visit) {
      visit.status = 'confermata';
    }
  }

  completeVisit(visitId: number): void {
    const visit = this.visits.find(v => v.id === visitId);
    if (visit) {
      visit.status = 'completata';
    }
  }

  rejectVisit(visitId: number): void {
    this.visits = this.visits.filter(v => v.id !== visitId);
  }
}
