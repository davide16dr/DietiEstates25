import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService, AgencyDetails } from '../../../shared/services/admin.service';

interface AgencyInfo {
  id: string;
  name: string;
  partitaIVA: string;
  email: string;
  phone: string;
  address: string;
  city: string;
}

@Component({
  selector: 'app-admin-agency-info',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-agency-info.component.html',
  styleUrl: './admin-agency-info.component.scss',
})
export class AdminAgencyInfoComponent implements OnInit {
  private adminService = inject(AdminService);

  agencyInfo = signal<AgencyInfo>({
    id: '',
    name: '',
    partitaIVA: '',
    email: '',
    phone: '',
    address: '',
    city: ''
  });

  isLoading = signal(true);
  isSaving = signal(false);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadAgencyInfo();
  }

  loadAgencyInfo(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.adminService.getAgencyDetails().subscribe({
      next: (data: AgencyDetails) => {
        console.log('🏢 Informazioni agenzia ricevute:', data);

        this.agencyInfo.set({
          id: data.id,
          name: data.name,
          partitaIVA: data.vatNumber,
          email: data.email,
          phone: data.phoneE164,
          address: data.address,
          city: data.city
        });

        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error('❌ Errore nel caricamento delle info agenzia:', err);
        this.error.set('Errore nel caricamento delle informazioni. Riprova più tardi.');
        this.isLoading.set(false);
      }
    });
  }

  saveChanges(): void {
    const info = this.agencyInfo();
    
    if (!info.name || !info.email || !info.city) {
      this.error.set('Compila tutti i campi obbligatori (Nome, Email, Città)');
      return;
    }

    this.isSaving.set(true);
    this.error.set(null);
    this.successMessage.set(null);

    const updateData = {
      name: info.name,
      vatNumber: info.partitaIVA,
      email: info.email,
      phoneE164: info.phone,
      address: info.address,
      city: info.city
    };

    console.log('💾 Salvataggio informazioni agenzia:', updateData);

    this.adminService.updateAgencyDetails(info.id, updateData).subscribe({
      next: (updatedData: AgencyDetails) => {
        console.log('✅ Informazioni agenzia aggiornate:', updatedData);
        
        this.agencyInfo.set({
          id: updatedData.id,
          name: updatedData.name,
          partitaIVA: updatedData.vatNumber,
          email: updatedData.email,
          phone: updatedData.phoneE164,
          address: updatedData.address,
          city: updatedData.city
        });

        this.successMessage.set('Modifiche salvate con successo!');
        this.isSaving.set(false);

        // Nascondi il messaggio dopo 3 secondi
        setTimeout(() => {
          this.successMessage.set(null);
        }, 3000);
      },
      error: (err: any) => {
        console.error('❌ Errore nel salvataggio:', err);
        this.error.set('Errore durante il salvataggio. Riprova.');
        this.isSaving.set(false);
      }
    });
  }

  updateField(field: keyof AgencyInfo, value: string): void {
    this.agencyInfo.update(info => ({
      ...info,
      [field]: value
    }));
  }
}
