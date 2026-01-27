import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../auth.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register-user.component.html',
  styleUrls: ['./register-user.component.scss'],
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
      validators: this.passwordMatchValidator // Validatore custom per password match
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
            this.errorMessage = 'Impossibile connettersi al server. Verifica che il backend sia attivo.';
          } else if (err.status === 409) {
            this.errorMessage = 'Email già registrata';
          } else if (err.status === 400) {
            this.errorMessage = 'Dati non validi. Controlla i campi.';
          } else {
            this.errorMessage = 'Errore durante la registrazione. Riprova.';
          }
        }
      });
  }

  onSocialRegister(provider: 'google' | 'facebook' | 'github'): void {
    console.log('Social register:', provider);
  }
}