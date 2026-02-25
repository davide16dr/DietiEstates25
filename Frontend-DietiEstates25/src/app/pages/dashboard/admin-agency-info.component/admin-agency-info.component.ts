import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface AgencyInfo {
  name: string;
  partitaIVA: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  website: string;
}

@Component({
  selector: 'app-admin-agency-info',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-agency-info.component.html',
  styleUrl: './admin-agency-info.component.scss',
})
export class AdminAgencyInfoComponent {
  agencyInfo = signal<AgencyInfo>({
    name: 'DietiEstates Milano Centro',
    partitaIVA: 'IT12345678901',
    email: 'milano@dietiestates.it',
    phone: '+39 02 1234567',
    address: 'Via Roma 100',
    city: 'Milano',
    website: 'www.dietiestates-milano.it'
  });

  saveChanges(): void {
    console.log('Saving agency info:', this.agencyInfo());
    // TODO: Save to backend
    alert('Modifiche salvate con successo!');
  }

  updateField(field: keyof AgencyInfo, value: string): void {
    this.agencyInfo.update(info => ({
      ...info,
      [field]: value
    }));
  }
}
