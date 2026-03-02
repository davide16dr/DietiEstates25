import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  form: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private auth: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    // Rimuovi il messaggio di errore quando l'utente modifica i campi
    this.form.valueChanges.subscribe(() => {
      if (this.errorMessage) {
        this.errorMessage = null;
        this.cdr.markForCheck();
      }
    });
  }

  goHome(): void {
    this.router.navigateByUrl('/');
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage = 'Completa correttamente i campi obbligatori.';
      this.cdr.markForCheck();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;
    this.cdr.markForCheck();

    const { email, password } = this.form.value as { email: string; password: string };

    this.auth.login({ email, password })
      .pipe(finalize(() => {
        this.isSubmitting = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => {
          // Reindirizza alla dashboard
          this.router.navigateByUrl('/dashboard'); 
        },
        error: (err) => {
          console.error('❌ Login error:', err);
          console.error('❌ Error status:', err?.status);
          console.error('❌ Error body:', err?.error);
          
          // Gestione errori con messaggi chiari
          if (err?.status === 0) {
            this.errorMessage = 'Backend non raggiungibile. Verifica che il server sia avviato su http://localhost:8080';
          } else if (err?.status === 401) {
            // Il backend restituisce { error: "Email o password non corrette." }
            this.errorMessage = err?.error?.error ?? 'Email o password non corrette. Riprova.';
            console.log('🔍 401 Error message:', this.errorMessage);
          } else if (err?.status === 403) {
            this.errorMessage = 'Account non attivo o accesso non consentito.';
          } else if (err?.status === 400) {
            this.errorMessage = err?.error?.error ?? 'Dati non validi. Controlla i campi.';
          } else {
            this.errorMessage = err?.error?.error ?? err?.error?.message ?? 'Errore durante il login. Riprova più tardi.';
          }
          
          console.log('✏️ Final errorMessage:', this.errorMessage);
          this.cdr.markForCheck();
        }
      });
  }

  onSocialLogin(provider: SocialProvider): void {
    this.errorMessage = `Login social (${provider}) non ancora implementato.`;
    this.cdr.markForCheck();
  }
}
