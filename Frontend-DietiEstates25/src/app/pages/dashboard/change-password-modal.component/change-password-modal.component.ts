import { Component, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface PasswordChangeData {
  oldPassword: string;
  newPassword: string;
}

@Component({
  selector: 'app-change-password-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './change-password-modal.component.html',
  styleUrl: './change-password-modal.component.scss',
})
export class ChangePasswordModalComponent {
  close = output<void>();
  save = output<PasswordChangeData>();

  // Form signals
  oldPassword = signal('');
  newPassword = signal('');
  confirmPassword = signal('');
  
  // UI state
  showOldPassword = signal(false);
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);
  errorMessage = signal('');

  onClose(): void {
    this.close.emit();
  }

  onSave(): void {
    // Reset error
    this.errorMessage.set('');
    
    // Validazioni
    if (!this.oldPassword()) {
      this.errorMessage.set('Inserisci la password attuale');
      return;
    }
    
    if (!this.newPassword()) {
      this.errorMessage.set('Inserisci la nuova password');
      return;
    }
    
    if (this.newPassword().length < 8) {
      this.errorMessage.set('La nuova password deve essere di almeno 8 caratteri');
      return;
    }
    
    if (this.newPassword() !== this.confirmPassword()) {
      this.errorMessage.set('Le password non coincidono');
      return;
    }
    
    if (this.oldPassword() === this.newPassword()) {
      this.errorMessage.set('La nuova password deve essere diversa dalla precedente');
      return;
    }

    const passwordData: PasswordChangeData = {
      oldPassword: this.oldPassword(),
      newPassword: this.newPassword()
    };
    this.save.emit(passwordData);
  }

  updateOldPassword(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.oldPassword.set(input.value);
    this.errorMessage.set('');
  }

  updateNewPassword(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.newPassword.set(input.value);
    this.errorMessage.set('');
  }

  updateConfirmPassword(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.confirmPassword.set(input.value);
    this.errorMessage.set('');
  }

  toggleOldPassword(): void {
    this.showOldPassword.set(!this.showOldPassword());
  }

  toggleNewPassword(): void {
    this.showNewPassword.set(!this.showNewPassword());
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.set(!this.showConfirmPassword());
  }

  isFormValid(): boolean {
    return (
      this.oldPassword().length > 0 &&
      this.newPassword().length >= 8 &&
      this.confirmPassword().length > 0 &&
      this.newPassword() === this.confirmPassword() &&
      this.oldPassword() !== this.newPassword()
    );
  }

  get passwordStrength(): string {
    const password = this.newPassword();
    if (!password) return '';
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    if (strength <= 2) return 'debole';
    if (strength <= 4) return 'media';
    return 'forte';
  }
}
