import { Component, signal, inject } from '@angular/core';
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
})
export class RegisterBusinessComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);

  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  countryCodes: CountryCode[] = [
    { label: '+39 (Italia)', value: '+39' },
    { label: '+41 (Svizzera)', value: '+41' },
    { label: '+49 (Germania)', value: '+49' },
    { label: '+33 (Francia)', value: '+33' },
  ];

  form: FormGroup = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    companyName: ['', [Validators.required, Validators.minLength(2)]],
    vatNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{11}$/)]],
    email: ['', [Validators.required, Validators.email]],
    city: ['', [Validators.required, Validators.minLength(2)]],
    address: [''],
    phonePrefix: ['+39', [Validators.required]],
    phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{6,15}$/)]],
    acceptAll: [false, [Validators.requiredTrue]],
  });

  constructor() {
    this.form.valueChanges.subscribe(() => {
      if (this.errorMessage()) this.errorMessage.set(null);
    });
  }

  goHome(): void {
    this.router.navigateByUrl('/');
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Completa correttamente tutti i campi obbligatori.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const v = this.form.value;
    const payload: RegisterBusinessRequest = {
      firstName: v.firstName,
      lastName: v.lastName,
      companyName: v.companyName,
      vatNumber: v.vatNumber,
      email: v.email,
      city: v.city,
      address: v.address || '',
      phoneE164: `${v.phonePrefix}${v.phoneNumber}`,
    };

    this.authService.registerBusiness(payload).subscribe({
      next: (response) => {
        this.successMessage.set(response.message || 'Registrazione completata! Controlla la tua email per i dati di accesso.');
        this.isSubmitting.set(false);
        setTimeout(() => this.router.navigateByUrl('/auth/login'), 2000);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        if (err.status === 0) {
          this.errorMessage.set('Backend non raggiungibile. Verifica che il server sia avviato su http://localhost:8080');
        } else if (err.status === 409) {
          this.errorMessage.set(err.error?.error || 'Email o Partita IVA già registrate nel sistema.');
        } else if (err.status === 400) {
          this.errorMessage.set(err.error?.error || 'Dati non validi. Controlla i campi obbligatori.');
        } else {
          this.errorMessage.set(err.error?.error || 'Errore durante la registrazione. Riprova più tardi.');
        }
      }
    });
  }
}
