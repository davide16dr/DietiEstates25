import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface AgentDetail {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: 'attivo' | 'disattivato';
  properties?: number;
  sales?: number;
  joinedDate?: Date;
}

@Component({
  selector: 'app-agent-details-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './agent-details-modal.component.html',
  styleUrl: './agent-details-modal.component.scss',
})
export class AgentDetailsModalComponent {
  agent = input.required<AgentDetail>();
  close = output<void>();
  edit = output<AgentDetail>();

  onClose(): void {
    this.close.emit();
  }

  onEdit(): void {
    this.edit.emit(this.agent());
  }

  getStatusClass(status: string): string {
    return status === 'attivo' ? 'status-active' : 'status-inactive';
  }

  getStatusLabel(status: string): string {
    return status === 'attivo' ? 'Attivo' : 'Disattivato';
  }

  getAvatarUrl(name: string): string {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0f7a55&color=fff&size=128`;
  }
}
