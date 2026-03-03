import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../shared/services/auth.service';

type SocialProvider = 'google' | 'facebook' | 'github';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private auth = inject(AuthService);

  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor() {
    // Rimuovi il messaggio di errore quando l'utente modifica i campi
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
      this.errorMessage.set('Completa correttamente i campi obbligatori.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.form.value as { email: string; password: string };

    this.auth.login({ email, password })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => this.router.navigateByUrl('/dashboard'),
        error: (err) => {
          if (err?.status === 0) {
            this.errorMessage.set('Backend non raggiungibile. Verifica che il server sia avviato su http://localhost:8080');
          } else if (err?.status === 401) {
            this.errorMessage.set(err?.error?.error ?? 'Email o password non corrette. Riprova.');
          } else if (err?.status === 403) {
            this.errorMessage.set('Account non attivo o accesso non consentito.');
          } else if (err?.status === 400) {
            this.errorMessage.set(err?.error?.error ?? 'Dati non validi. Controlla i campi.');
          } else {
            this.errorMessage.set(err?.error?.error ?? err?.error?.message ?? 'Errore durante il login. Riprova più tardi.');
          }
        }
      });
  }

  onSocialLogin(provider: SocialProvider): void {
    this.errorMessage.set(`Login social (${provider}) non ancora implementato.`);
  }
}
