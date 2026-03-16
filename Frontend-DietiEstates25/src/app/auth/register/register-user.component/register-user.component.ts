import { Component, signal, computed, inject } from '@angular/core';
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
  currentStep = signal<1 | 2>(1);
  showPassword = signal(false);
  showConfirm = signal(false);
  passwordValue = signal('');

  passwordStrength = computed(() => {
    const p = this.passwordValue();
    if (!p) return 0;
    let score = 0;
    if (p.length >= 8) score++;
    if (/[a-zA-Z]/.test(p) && /[0-9]/.test(p)) score++;
    if (p.length >= 10 && /[^a-zA-Z0-9]/.test(p)) score++;
    return score;
  });

  strengthLabel = computed(() => {
    switch (this.passwordStrength()) {
      case 1: return 'Debole';
      case 2: return 'Media';
      case 3: return 'Forte';
      default: return '';
    }
  });

  passwordRules = computed(() => ({
    length: this.passwordValue().length >= 8,
    letter: /[a-zA-Z]/.test(this.passwordValue()),
    number: /[0-9]/.test(this.passwordValue()),
  }));

  form: FormGroup = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
  }, { validators: this.passwordMatchValidator });

  constructor() {
    this.form.valueChanges.subscribe(() => {
      if (this.errorMessage()) this.errorMessage.set(null);
    });
    this.form.get('password')?.valueChanges.subscribe(v => this.passwordValue.set(v ?? ''));
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

  nextStep(): void {
    const email = this.form.get('email');
    const password = this.form.get('password');
    const confirmPassword = this.form.get('confirmPassword');
    email?.markAsTouched();
    password?.markAsTouched();
    confirmPassword?.markAsTouched();

    const hasPasswordMismatch = this.form.hasError('passwordMismatch');
    if (email?.valid && password?.valid && confirmPassword?.valid && !hasPasswordMismatch) {
      this.currentStep.set(2);
      this.errorMessage.set(null);
    } else {
      this.errorMessage.set(
        hasPasswordMismatch
          ? 'Le password non coincidono. Controlla i campi.'
          : 'Completa correttamente tutti i campi obbligatori.'
      );
    }
  }

  prevStep(): void {
    this.currentStep.set(1);
    this.errorMessage.set(null);
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