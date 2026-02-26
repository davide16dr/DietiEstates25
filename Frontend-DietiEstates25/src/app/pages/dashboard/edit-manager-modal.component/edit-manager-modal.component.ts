import { Component, input, output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ManagerEdit {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: 'attivo' | 'inattivo';
}

@Component({
  selector: 'app-edit-manager-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-manager-modal.component.html',
  styleUrl: './edit-manager-modal.component.scss',
})
export class EditManagerModalComponent implements OnInit {
  manager = input.required<ManagerEdit>();
  close = output<void>();
  save = output<ManagerEdit>();

  // Form signals
  editName = signal('');
  editEmail = signal('');
  editPhone = signal('');
  editStatus = signal<'attivo' | 'inattivo'>('attivo');

  ngOnInit(): void {
    const managerData = this.manager();
    this.editName.set(managerData.name);
    this.editEmail.set(managerData.email);
    this.editPhone.set(managerData.phone);
    this.editStatus.set(managerData.status);
  }

  onClose(): void {
    this.close.emit();
  }

  onSave(): void {
    const updatedManager: ManagerEdit = {
      id: this.manager().id,
      name: this.editName(),
      email: this.editEmail(),
      phone: this.editPhone(),
      status: this.editStatus()
    };
    this.save.emit(updatedManager);
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
    this.editStatus.set(select.value as 'attivo' | 'inattivo');
  }

  isFormValid(): boolean {
    return (
      this.editName().trim().length > 0 &&
      this.editEmail().trim().length > 0 &&
      this.editPhone().trim().length > 0
    );
  }
}
