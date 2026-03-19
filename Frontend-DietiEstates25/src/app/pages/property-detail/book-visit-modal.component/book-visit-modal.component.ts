import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DashboardService } from '../../../shared/services/dashboard.service';

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
  private dashboardService = inject(DashboardService);
  
  open = input<boolean>(false);
  propertyId = input<string>('');

  initialDate = input<string | null>(null);
  initialTime = input<string | null>(null);

  closed = output<void>();
  submitted = output<BookVisitPayload>();

  
  minDate = new Date().toISOString().split('T')[0];

  
  timeSlots = signal<string[]>(this.generateTimeSlots());
  availableTimeSlots = signal<string[]>([]);
  unavailableSlots = signal<string[]>([]);
  checkingAvailability = signal(false);

  form = new FormGroup({
    date: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    time: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    notes: new FormControl<string>('', { nonNullable: true }),
  });

  canSubmit = signal(false);

  constructor() {
    const d = this.initialDate();
    const t = this.initialTime();

    if (d && !this.form.controls.date.value) this.form.controls.date.setValue(d);
    if (t && !this.form.controls.time.value) this.form.controls.time.setValue(t);
    
    
    this.form.statusChanges.subscribe(() => {
      this.canSubmit.set(this.form.valid);
    });
    
    
    this.canSubmit.set(this.form.valid);
    
    
    this.form.controls.date.valueChanges.subscribe(date => {
      if (date) {
        this.checkAvailability(date);
      }
    });
  }

  private generateTimeSlots(): string[] {
    const slots: string[] = [];
    for (let hour = 9; hour <= 19; hour++) {
      for (let minute = 0; minute < 60; minute += 5) {
        
        if (hour === 19 && minute > 0) break;
        
        const h = hour.toString().padStart(2, '0');
        const m = minute.toString().padStart(2, '0');
        slots.push(`${h}:${m}`);
      }
    }
    return slots;
  }

  private checkAvailability(date: string): void {
    const propId = this.propertyId();
    if (!propId) return;

    this.checkingAvailability.set(true);
    
    this.dashboardService.getAvailableTimeSlots(propId, date).subscribe({
      next: (unavailable) => {
        this.unavailableSlots.set(unavailable);
        const available = this.timeSlots().filter(slot => !unavailable.includes(slot));
        this.availableTimeSlots.set(available);
        this.checkingAvailability.set(false);
        
        
        const currentTime = this.form.controls.time.value;
        if (currentTime && unavailable.includes(currentTime)) {
          this.form.controls.time.setValue('');
        }
      },
      error: (err) => {
        console.error('Errore controllo disponibilità:', err);
        this.checkingAvailability.set(false);
        
        this.availableTimeSlots.set(this.timeSlots());
        this.unavailableSlots.set([]);
      }
    });
  }

  isTimeSlotAvailable(slot: string): boolean {
    return !this.unavailableSlots().includes(slot);
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

    
    if (time && !this.isTimeSlotAvailable(time)) {
      alert('L\'orario selezionato non è più disponibile. Scegli un altro orario.');
      return;
    }

    this.submitted.emit({
      date,
      time: time ? time : undefined,
      notes: notes ? notes : undefined,
    });
  }
}