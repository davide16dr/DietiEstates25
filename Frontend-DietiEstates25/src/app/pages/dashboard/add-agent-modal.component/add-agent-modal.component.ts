import { Component, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface NewAgent {
  name: string;
  email: string;
  phone: string;
  status: 'attivo' | 'inattivo';
}

@Component({
  selector: 'app-add-agent-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-agent-modal.component.html',
  styleUrl: './add-agent-modal.component.scss',
})
export class AddAgentModalComponent {
  close = output<void>();
  save = output<NewAgent>();

  // Form signals
  name = signal('');
  email = signal('');
  phone = signal('');
  status = signal<'attivo' | 'inattivo'>('attivo');

  onClose(): void {
    this.close.emit();
  }

  onSave(): void {
    if (!this.isFormValid()) return;
    
    const newAgent: NewAgent = {
      name: this.name(),
      email: this.email(),
      phone: this.phone(),
      status: this.status()
    };
    this.save.emit(newAgent);
  }

  updateName(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.name.set(input.value);
  }

  updateEmail(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.email.set(input.value);
  }

  updatePhone(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.phone.set(input.value);
  }

  updateStatus(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.status.set(select.value as 'attivo' | 'inattivo');
  }

  isFormValid(): boolean {
    return (
      this.name().trim().length > 0 &&
      this.email().trim().length > 0 &&
      this.isValidEmail(this.email()) &&
      this.phone().trim().length > 0
    );
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
