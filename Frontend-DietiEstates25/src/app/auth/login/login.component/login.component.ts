import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../auth.service';
type SocialProvider = 'google' | 'facebook' | 'github';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  form: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private auth: AuthService
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  goHome(): void {
    this.router.navigateByUrl('/');
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    const { email, password } = this.form.value as { email: string; password: string };

    this.auth.login({ email, password })
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: () => {
          // redirect post-login (cambia rotta se vuoi)
          this.router.navigateByUrl('/'); 
        },
        error: (err) => {
          // Gestione errori più leggibile
          // Possibili: 401 (bad credentials), 403 (inactive), 0 (backend down/CORS)
          if (err?.status === 0) {
            this.errorMessage = 'Backend non raggiungibile o CORS bloccato. Verifica http://localhost:8080 e CORS.';
            return;
          }
          if (err?.status === 401) {
            this.errorMessage = 'Email o password non corrette.';
            return;
          }
          if (err?.status === 403) {
            this.errorMessage = 'Account non attivo o accesso non consentito.';
            return;
          }

          this.errorMessage = err?.error?.message ?? 'Errore durante il login.';
        }
      });
  }

  onSocialLogin(provider: SocialProvider): void {
    // Placeholder: non implementato
    this.errorMessage = `Login social (${provider}) non ancora implementato.`;
  }
}
