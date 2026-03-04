import { CommonModule } from '@angular/common';
import { Component, computed, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

export type BookVisitPayload = {
  date: string; 
  time?: string;
  notes?: string;
};

@Component({
  selector: 'app-book-visit-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './book-visit-modal.component.html',
  styleUrls: ['./book-visit-modal.component.scss'],
})
export class BookVisitModalComponent {
  open = input<boolean>(false);

  initialDate = input<string | null>(null);
  initialTime = input<string | null>(null);

  closed = output<void>();
  submitted = output<BookVisitPayload>();

  // Get today's date in YYYY-MM-DD format
  minDate = new Date().toISOString().split('T')[0];

  form = new FormGroup({
    date: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    time: new FormControl<string>('', { nonNullable: true }),
    notes: new FormControl<string>('', { nonNullable: true }),
  });

  // Use a signal instead of computed
  canSubmit = signal(false);

  constructor() {
    const d = this.initialDate();
    const t = this.initialTime();

    if (d && !this.form.controls.date.value) this.form.controls.date.setValue(d);
    if (t && !this.form.controls.time.value) this.form.controls.time.setValue(t);
    
    // Update canSubmit signal when form validity changes
    this.form.statusChanges.subscribe(() => {
      this.canSubmit.set(this.form.valid);
    });
    
    // Initial check
    this.canSubmit.set(this.form.valid);
    
    // Debug: log form changes
    this.form.valueChanges.subscribe(value => {
      console.log('Form values:', value);
      console.log('Form valid:', this.form.valid);
      console.log('Date errors:', this.form.controls.date.errors);
    });
  }

  close(): void {
    this.closed.emit();
  }

  onBackdropClick(ev: MouseEvent): void {
    if (ev.target === ev.currentTarget) this.close();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const date = this.form.controls.date.value;
    const time = this.form.controls.time.value?.trim();
    const notes = this.form.controls.notes.value?.trim();

    this.submitted.emit({
      date,
      time: time ? time : undefined,
      notes: notes ? notes : undefined,
    });
  }
}