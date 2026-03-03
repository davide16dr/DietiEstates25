import { Component, signal, inject } from '@angular/core';
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
})
export class RegisterUserComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);

  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  form: FormGroup = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
  }, { validators: this.passwordMatchValidator });

  constructor() {
    this.form.valueChanges.subscribe(() => {
      if (this.errorMessage()) this.errorMessage.set(null);
    });
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    if (!password || !confirmPassword) return null;
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
      this.errorMessage.set(
        this.form.hasError('passwordMismatch')
          ? 'Le password non coincidono. Controlla i campi.'
          : 'Completa correttamente tutti i campi obbligatori.'
      );
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const { email, password, firstName, lastName, phone } = this.form.value;

    this.authService.register({
      email, password, firstName, lastName,
      phone: phone || undefined,
      role: 'CLIENT' as const
    })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => this.router.navigateByUrl('/'),
        error: (err) => {
          if (err.status === 0) {
            this.errorMessage.set('Backend non raggiungibile. Verifica che il server sia avviato su http://localhost:8080');
          } else if (err.status === 409 || err.status === 400) {
            this.errorMessage.set(err?.error?.error ?? 'Email già registrata o dati non validi. Riprova.');
          } else {
            this.errorMessage.set(err?.error?.error ?? 'Errore durante la registrazione. Riprova più tardi.');
          }
        }
      });
  }

  onSocialRegister(provider: 'google' | 'facebook' | 'github'): void {
    console.log('Social register:', provider);
  }
}