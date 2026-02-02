import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

type Notification = {
  id: number;
  icon: string;
  iconBg: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
};

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss'
})
export class NotificationsComponent {
  notifications: Notification[] = [
    {
      id: 1,
      icon: '🏠',
      iconBg: '#e9f7ef',
      title: 'Nuova proprietà disponibile',
      message: 'Una nuova proprietà corrispondente alla tua ricerca salvata è disponibile.',
      time: '2 ore fa',
      read: false
    },
    {
      id: 2,
      icon: '📅',
      iconBg: '#eaf2ff',
      title: 'Promemoria visita',
      message: 'Hai una visita programmata domani alle 14:00 per Appartamento Milano Centro.',
      time: '5 ore fa',
      read: false
    },
    {
      id: 3,
      icon: '✅',
      iconBg: '#e9f7ef',
      title: 'Offerta accettata',
      message: 'La tua offerta per Trilocale Navigli è stata accettata dal proprietario.',
      time: '1 giorno fa',
      read: true
    }
  ];
}
