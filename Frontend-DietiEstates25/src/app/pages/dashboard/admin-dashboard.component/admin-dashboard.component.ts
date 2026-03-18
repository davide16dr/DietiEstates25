import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService, AdminStats } from '../../../shared/services/admin.service';

interface AgencyStat {
  gestori: { totali: number; attivi: number };
  agenti: { totali: number; attivi: number };
  citta: string;
  indirizzo: string;
  stato: string;
}

interface Manager {
  id: string;
  name: string;
  email: string;
  status: 'attivo' | 'inattivo';
}

interface Agent {
  id: string;
  name: string;
  email: string;
  status: 'attivo' | 'inattivo';
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);

  agencyName = signal<string>('Caricamento...');
  stats = signal<AgencyStat>({
    gestori: { totali: 0, attivi: 0 },
    agenti: { totali: 0, attivi: 0 },
    citta: '',
    indirizzo: '',
    stato: 'Attiva'
  });
  recentManagers = signal<Manager[]>([]);
  recentAgents = signal<Agent[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadAdminStats();
  }

  loadAdminStats(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.adminService.getAdminStats().subscribe({
      next: (data: AdminStats) => {
        console.log('📊 Statistiche admin ricevute:', data);

        
        this.agencyName.set(data.agencyInfo.name);

        
        this.stats.set({
          gestori: data.gestori,
          agenti: data.agenti,
          citta: data.agencyInfo.city,
          indirizzo: data.agencyInfo.address,
          stato: data.agencyInfo.status
        });

        
        this.recentManagers.set(data.recentManagers.map(m => ({
          id: m.id,
          name: m.name,
          email: m.email,
          status: m.status as 'attivo' | 'inattivo'
        })));

        this.recentAgents.set(data.recentAgents.map(a => ({
          id: a.id,
          name: a.name,
          email: a.email,
          status: a.status as 'attivo' | 'inattivo'
        })));

        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('❌ Errore nel caricamento delle statistiche admin:', err);
        this.error.set('Errore nel caricamento delle statistiche. Riprova più tardi.');
        this.isLoading.set(false);
      }
    });
  }

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
