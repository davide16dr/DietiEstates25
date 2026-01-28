import { CommonModule } from '@angular/common';
import { Component, computed, effect, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

export type MakeOfferPayload = {
  amount: number;
  notes?: string;
};

@Component({
  selector: 'app-make-offer-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './make-offer-modal.component.html',
  styleUrls: ['./make-offer-modal.component.scss'],
})
export class MakeOfferModalComponent {
  open = input<boolean>(false);

  initialAmount = input<number | null>(null);

  amountLabel = input<string>('La tua offerta (€)');

  closed = output<void>();
  submitted = output<MakeOfferPayload>();

  form = new FormGroup({
    amount: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(1)],
    }),
    notes: new FormControl<string>('', { nonNullable: true }),
  });

  private _prefill = effect(() => {
    const initial = this.initialAmount();
    if (initial == null) return;

    const current = this.form.controls.amount.value;
    if (current == null) {
      this.form.controls.amount.setValue(initial);
    }
  });

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

    const amount = this.form.controls.amount.value!;
    const notes = this.form.controls.notes.value?.trim();

    this.submitted.emit({
      amount,
      notes: notes ? notes : undefined,
    });
  }
}