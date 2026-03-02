import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService, RegisterBusinessRequest } from '../../../shared/services/auth.service';

type CountryCode = { label: string; value: string };

@Component({
  selector: 'app-register-business',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register-business.component.html',
  styleUrls: ['./register-business.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterBusinessComponent {
  form: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  countryCodes: CountryCode[] = [
    { label: '+39 (Italia)', value: '+39' },
    { label: '+41 (Svizzera)', value: '+41' },
    { label: '+49 (Germania)', value: '+49' },
    { label: '+33 (Francia)', value: '+33' },
  ];

  constructor(
    private fb: FormBuilder, 
    private router: Router,
    private authService: AuthService
  ) {
    this.form = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      companyName: ['', [Validators.required, Validators.minLength(2)]],

      // P.IVA Italia: 11 cifre (validazione base)
      vatNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{11}$/)]],

      email: ['', [Validators.required, Validators.email]],
      city: ['', [Validators.required, Validators.minLength(2)]],
      address: [''],

      phonePrefix: ['+39', [Validators.required]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{6,15}$/)]],

      acceptAll: [false, [Validators.requiredTrue]],
    });

    // Rimuovi il messaggio di errore quando l'utente modifica i campi
    this.form.valueChanges.subscribe(() => {
      if (this.errorMessage) {
        this.errorMessage = null;
      }
    });
  }

  goHome(): void {
    this.router.navigateByUrl('/');
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage = 'Completa correttamente tutti i campi obbligatori.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;
    this.successMessage = null;

    const payload: RegisterBusinessRequest = {
      firstName: this.form.value.firstName,
      lastName: this.form.value.lastName,
      companyName: this.form.value.companyName,
      vatNumber: this.form.value.vatNumber,
      email: this.form.value.email,
      city: this.form.value.city,
      address: this.form.value.address || '',
      phoneE164: `${this.form.value.phonePrefix}${this.form.value.phoneNumber}`,
    };

    console.log('📤 Invio registrazione aziendale:', payload);

    this.authService.registerBusiness(payload).subscribe({
      next: (response) => {
        console.log('✅ Registrazione aziendale completata:', response);
        this.successMessage = response.message || 'Registrazione completata! Controlla la tua email per i dati di accesso.';
        this.isSubmitting = false;
        
        // Reindirizza al login dopo 2 secondi
        setTimeout(() => {
          this.router.navigateByUrl('/auth/login');
        }, 2000);
      },
      error: (error) => {
        console.error('❌ Errore durante la registrazione:', error);
        this.isSubmitting = false;
        
        if (error.status === 0) {
          this.errorMessage = 'Backend non raggiungibile. Verifica che il server sia avviato su http://localhost:8080';
        } else if (error.status === 409) {
          this.errorMessage = error.error?.error || 'Email o Partita IVA già registrate nel sistema.';
        } else if (error.status === 400) {
          this.errorMessage = error.error?.error || 'Dati non validi. Controlla i campi obbligatori.';
        } else {
          this.errorMessage = error.error?.error || 'Errore durante la registrazione. Riprova più tardi.';
        }
      }
    });
  }
}
