import { Component, output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, NonNullableFormBuilder } from '@angular/forms';

// Interfaccia tipizzata per il form Property
interface PropertyFormValue {
  city: string;
  address: string;
  property_type: string;
  rooms: number;
  bathrooms: number;
  area_m2: number;
  floor: number;
  elevator: boolean;
  energy_class: string;
  description: string;
  title: string;
  listing_type: string;
  price_amount: number;
  currency: string;
}

@Component({
  selector: 'app-add-property-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-property-modal.component.html',
  styleUrl: './add-property-modal.component.scss',
})
export class AddPropertyModalComponent {
  // Modern Angular 21: output() invece di @Output()
  close = output<void>();
  save = output<any>();

  // Modern Angular 21: inject() invece di constructor DI
  private fb = inject(NonNullableFormBuilder);

  // Modern Angular 21: signal() per stato reattivo
  selectedImages = signal<File[]>([]);
  imagePreviews = signal<string[]>([]);
  isDragging = signal(false);

  // Form tipizzato con FormGroup<T>
  propertyForm = this.fb.group({
    // PROPERTY FIELDS
    city: this.fb.control('', [Validators.required]),
    address: this.fb.control('', [Validators.required]),
    property_type: this.fb.control('APPARTAMENTO', [Validators.required]),
    rooms: this.fb.control(0, [Validators.required, Validators.min(0)]),
    bathrooms: this.fb.control(0, [Validators.min(0)]),
    area_m2: this.fb.control(0, [Validators.required, Validators.min(1)]),
    floor: this.fb.control(0),
    elevator: this.fb.control(false),
    energy_class: this.fb.control('D'),
    description: this.fb.control('', [Validators.required, Validators.minLength(20)]),
    
    // LISTING FIELDS
    title: this.fb.control('', [Validators.required, Validators.minLength(5), Validators.maxLength(160)]),
    listing_type: this.fb.control('SALE', [Validators.required]),
    price_amount: this.fb.control(0, [Validators.required, Validators.min(1)]),
    currency: this.fb.control('EUR')
  });

  // ===== GESTIONE IMMAGINI =====
  
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.addFiles(Array.from(input.files));
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    if (event.dataTransfer?.files) {
      this.addFiles(Array.from(event.dataTransfer.files));
    }
  }

  private addFiles(files: File[]): void {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    const currentImages = this.selectedImages();
    const currentPreviews = this.imagePreviews();
    
    imageFiles.forEach(file => {
      // Limita a massimo 10 immagini
      if (currentImages.length < 10) {
        currentImages.push(file);
        
        // Crea preview
        const reader = new FileReader();
        reader.onload = (e) => {
          currentPreviews.push(e.target?.result as string);
          this.imagePreviews.set([...currentPreviews]);
        };
        reader.readAsDataURL(file);
      }
    });
    
    this.selectedImages.set([...currentImages]);
  }

  removeImage(index: number): void {
    const images = this.selectedImages();
    const previews = this.imagePreviews();
    
    images.splice(index, 1);
    previews.splice(index, 1);
    
    this.selectedImages.set([...images]);
    this.imagePreviews.set([...previews]);
  }

  // ===== FORM ACTIONS =====

  onClose(): void {
    this.close.emit();
  }

  onSubmit(): void {
    if (this.propertyForm.valid) {
      const formValue = this.propertyForm.getRawValue();
      
      console.log('=== ADD PROPERTY MODAL onSubmit ===');
      console.log('formValue:', formValue);
      console.log('formValue.listing_type:', formValue.listing_type);
      console.log('propertyForm value:', this.propertyForm.value);
      console.log('===================================');
      
      const formData = {
        property: {
          city: formValue.city,
          address: formValue.address,
          property_type: formValue.property_type,
          rooms: formValue.rooms,
          bathrooms: formValue.bathrooms || null,
          area_m2: formValue.area_m2,
          floor: formValue.floor || null,
          elevator: formValue.elevator,
          energy_class: formValue.energy_class,
          description: formValue.description
        },
        listing: {
          title: formValue.title,
          listing_type: formValue.listing_type,  // Passo come listing_type per il servizio
          price_amount: formValue.price_amount,
          currency: formValue.currency
        },
        images: this.selectedImages()
      };
      
      console.log('formData da emettere:', formData);
      this.save.emit(formData);
      this.resetForm();
    } else {
      // Marca tutti i campi come touched per mostrare gli errori
      this.propertyForm.markAllAsTouched();
    }
  }

  private resetForm(): void {
    this.propertyForm.reset({
      property_type: 'APPARTAMENTO',
      elevator: false,
      energy_class: 'D',
      listing_type: 'SALE',
      currency: 'EUR'
    });
    this.selectedImages.set([]);
    this.imagePreviews.set([]);
  }

  // ===== VALIDATION HELPERS =====

  getErrorMessage(fieldName: keyof PropertyFormValue): string {
    const control = this.propertyForm.get(fieldName);
    if (control?.hasError('required')) {
      return 'Campo obbligatorio';
    }
    if (control?.hasError('minlength')) {
      const minLength = control.errors?.['minlength'].requiredLength;
      return `Minimo ${minLength} caratteri`;
    }
    if (control?.hasError('maxlength')) {
      const maxLength = control.errors?.['maxlength'].requiredLength;
      return `Massimo ${maxLength} caratteri`;
    }
    if (control?.hasError('min')) {
      return 'Valore non valido';
    }
    return '';
  }

  hasError(fieldName: keyof PropertyFormValue): boolean {
    const control = this.propertyForm.get(fieldName);
    return !!(control?.invalid && control?.touched);
  }
}
