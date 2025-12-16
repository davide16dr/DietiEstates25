import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

type CountryCode = { label: string; value: string };

@Component({
  selector: 'app-register-business',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register-business.component.html',
  styleUrls: ['./register-business.component.scss'],
})
export class RegisterBusinessComponent {
  form: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;

  countryCodes: CountryCode[] = [
    { label: '+39 (Italia)', value: '+39' },
    { label: '+41 (Svizzera)', value: '+41' },
    { label: '+49 (Germania)', value: '+49' },
    { label: '+33 (Francia)', value: '+33' },
  ];

  constructor(private fb: FormBuilder, private router: Router) {
    this.form = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      companyName: ['', [Validators.required, Validators.minLength(2)]],

      // P.IVA Italia: 11 cifre (validazione base)
      vatNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{11}$/)]],

      email: ['', [Validators.required, Validators.email]],
      comune: ['', [Validators.required, Validators.minLength(2)]],

      phonePrefix: ['+39', [Validators.required]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{6,15}$/)]],

      acceptAll: [false, [Validators.requiredTrue]],
    });
  }

  goHome(): void {
    this.router.navigateByUrl('/');
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage = 'Completa correttamente i campi obbligatori.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    const payload = {
      ...this.form.value,
      phone: `${this.form.value.phonePrefix}${this.form.value.phoneNumber}`,
    };

    setTimeout(() => {
      this.isSubmitting = false;
      console.log('Register business payload', payload);
    }, 900);
  }
}
