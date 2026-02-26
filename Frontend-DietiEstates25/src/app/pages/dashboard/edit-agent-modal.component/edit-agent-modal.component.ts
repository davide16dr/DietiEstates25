import { Component, input, output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface AgentEdit {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: 'attivo' | 'disattivato' | 'inattivo';
}

@Component({
  selector: 'app-edit-agent-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-agent-modal.component.html',
  styleUrl: './edit-agent-modal.component.scss',
})
export class EditAgentModalComponent implements OnInit {
  agent = input.required<AgentEdit>();
  close = output<void>();
  save = output<AgentEdit>();

  // Form signals
  editName = signal('');
  editEmail = signal('');
  editPhone = signal('');
  editStatus = signal<'attivo' | 'disattivato' | 'inattivo'>('attivo');
  inactiveStatusLabel = signal<'disattivato' | 'inattivo'>('disattivato');

  ngOnInit(): void {
    // Inizializza i valori del form con i dati dell'agente
    const agentData = this.agent();
    this.editName.set(agentData.name);
    this.editEmail.set(agentData.email);
    this.editPhone.set(agentData.phone);
    this.editStatus.set(agentData.status);
    // Imposta il label corretto per lo stato inattivo
    if (agentData.status === 'inattivo') {
      this.inactiveStatusLabel.set('inattivo');
    } else {
      this.inactiveStatusLabel.set('disattivato');
    }
  }

  onClose(): void {
    this.close.emit();
  }

  onSave(): void {
    const updatedAgent: AgentEdit = {
      id: this.agent().id,
      name: this.editName(),
      email: this.editEmail(),
      phone: this.editPhone(),
      status: this.editStatus()
    };
    this.save.emit(updatedAgent);
  }

  updateName(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.editName.set(input.value);
  }

  updateEmail(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.editEmail.set(input.value);
  }

  updatePhone(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.editPhone.set(input.value);
  }

  updateStatus(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.editStatus.set(select.value as 'attivo' | 'disattivato' | 'inattivo');
  }

  isFormValid(): boolean {
    return (
      this.editName().trim().length > 0 &&
      this.editEmail().trim().length > 0 &&
      this.editPhone().trim().length > 0
    );
  }
}
