import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-home.component.html',
  styleUrl: './dashboard-home.component.scss',
})
export class DashboardHomeComponent {
  userName = 'Anna';

  stats = [
    { label: 'Ricerche Salvate', value: 3, pillIcon: '🔍', pillBg: '#e9f7ef', pillColor: '#0f7a55' },
    { label: 'Visite Programmate', value: 2, pillIcon: '📅', pillBg: '#eaf2ff', pillColor: '#2563eb' },
    { label: 'Offerte Attive', value: 2, pillIcon: '📄', pillBg: '#fff4e5', pillColor: '#b45309' },
    { label: 'Notifiche', value: 2, pillIcon: '🔔', pillBg: '#ffe9e9', pillColor: '#dc2626' },
  ];
}
