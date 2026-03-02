import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../shared/services/auth.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register-user.component.html',
  styleUrls: ['./register-user.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterUserComponent {
  form: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;

  constructor(private fb: FormBuilder, private router: Router, private authService: AuthService) {
    this.form = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
    }, {
      validators: this.passwordMatchValidator
    });

    // Rimuovi il messaggio di errore quando l'utente modifica i campi
    this.form.valueChanges.subscribe(() => {
      if (this.errorMessage) {
        this.errorMessage = null;
      }
    });
  }

  // Validatore per verificare che le password coincidano
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    
    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  goHome(): void {
    this.router.navigateByUrl('/');
  }

  goBusinessRegister(): void {
    this.router.navigateByUrl('/auth/register-business');
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      
      // Mostra messaggio di errore specifico
      if (this.form.hasError('passwordMismatch')) {
        this.errorMessage = 'Le password non coincidono. Controlla i campi.';
      } else {
        this.errorMessage = 'Completa correttamente tutti i campi obbligatori.';
      }
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    const { email, password, firstName, lastName, phone } = this.form.value;

    const registerRequest = {
      email: email!,
      password: password!,
      firstName: firstName!,
      lastName: lastName!,
      phoneE164: phone || undefined,
      role: 'CLIENT' as const
    };

    this.authService.register(registerRequest)
      .pipe(finalize(() => this.isSubmitting = false))
      .subscribe({
        next: () => {
          this.router.navigateByUrl('/');
        },
        error: (err) => {
          console.error('Registration failed:', err);
          
          if (err.status === 0) {
            this.errorMessage = 'Backend non raggiungibile. Verifica che il server sia avviato su http://localhost:8080';
          } else if (err.status === 409 || err.status === 400) {
            this.errorMessage = err?.error?.error ?? 'Email già registrata o dati non validi. Riprova.';
          } else {
            this.errorMessage = err?.error?.message ?? 'Errore durante la registrazione. Riprova più tardi.';
          }
        }
      });
  }

  onSocialRegister(provider: 'google' | 'facebook' | 'github'): void {
    console.log('Social register:', provider);
  }
}