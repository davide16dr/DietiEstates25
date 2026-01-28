import { CommonModule } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
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

  form = new FormGroup({
    date: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    time: new FormControl<string>('', { nonNullable: true }),
    notes: new FormControl<string>('', { nonNullable: true }),
  });

  constructor() {
    const d = this.initialDate();
    const t = this.initialTime();

    if (d && !this.form.controls.date.value) this.form.controls.date.setValue(d);
    if (t && !this.form.controls.time.value) this.form.controls.time.setValue(t);
  }

  canSubmit = computed(() => this.form.valid);

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