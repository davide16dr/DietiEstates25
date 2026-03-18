import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../shared/services/auth.service';
import { OAuthService, OAuthProvider } from '../../../shared/services/oauth.service';

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
  private oauthService = inject(OAuthService);

  isSubmitting = signal(false);
  isSocialSubmitting = signal<OAuthProvider | null>(null);
  errorMessage = signal<string | null>(null);
  showPassword = signal(false);

  form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
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
      this.errorMessage.set('Completa correttamente i campi obbligatori.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.form.value as { email: string; password: string };

    this.auth.login({ email, password })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          
          const user = this.auth.currentUser();
          const role = user?.role?.toLowerCase();
          
          let dashboardRoute = '/dashboard/home';
          switch (role) {
            case 'admin':
              dashboardRoute = '/dashboard/admin-home';
              break;
            case 'agency_manager':
              dashboardRoute = '/dashboard/manager-home';
              break;
            case 'agent':
              dashboardRoute = '/dashboard/home';
              break;
            case 'client':
              dashboardRoute = '/dashboard/home';
              break;
          }
          
          console.log(`✅ Login riuscito come ${role}, reindirizzo a ${dashboardRoute}`);
          this.router.navigateByUrl(dashboardRoute);
        },
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

  onSocialLogin(provider: OAuthProvider): void {
    if (this.isSocialSubmitting()) return;
    this.errorMessage.set(null);
    this.isSocialSubmitting.set(provider);

    this.oauthService.login(provider)
      .pipe(finalize(() => this.isSocialSubmitting.set(null)))
      .subscribe({
        next: (res) => {
          const role = res.role?.toLowerCase();
          let dashboardRoute = '/dashboard/home';
          switch (role) {
            case 'admin':            dashboardRoute = '/dashboard/admin-home'; break;
            case 'agency_manager':   dashboardRoute = '/dashboard/manager-home'; break;
            case 'agent':            dashboardRoute = '/dashboard/home'; break;
            default:                 dashboardRoute = '/dashboard/home'; break;
          }
          this.router.navigateByUrl(dashboardRoute);
        },
        error: (err) => {
          const msg = err?.error?.error ?? err?.message ?? `Errore durante il login con ${provider}.`;
          this.errorMessage.set(msg);
        }
      });
  }
}
