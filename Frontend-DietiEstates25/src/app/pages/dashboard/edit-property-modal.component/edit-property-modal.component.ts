import { Component, input, output, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, NonNullableFormBuilder } from '@angular/forms';

// Interfaccia per i dati dell'immobile da modificare
interface PropertyToEdit {
  id: number;
  title: string;
  location: string;
  price: number;
  type: 'vendita' | 'affitto';
  status: 'disponibile' | 'venduto' | 'affittato';
  rooms: number;
  bathrooms?: number;
  size: number;
  floor?: number;
  elevator: boolean;
  energyClass?: string;
  description: string;
  propertyType: string;
  address: string;
  city: string;
  image: string;
}

// Interfaccia per il form value
interface EditPropertyFormValue {
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
  status: string;
}

@Component({
  selector: 'app-edit-property-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-property-modal.component.html',
  styleUrl: './edit-property-modal.component.scss',
})
export class EditPropertyModalComponent {
  // Modern Angular 21: input() e output()
  property = input.required<PropertyToEdit>();
  close = output<void>();
  save = output<any>();

  // Modern Angular 21: inject() e signal()
  private fb = inject(NonNullableFormBuilder);
  
  selectedImages = signal<File[]>([]);
  imagePreviews = signal<string[]>([]);
  isDragging = signal(false);

  // Form tipizzato
  propertyForm = this.fb.group({
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
    title: this.fb.control('', [Validators.required, Validators.minLength(5), Validators.maxLength(160)]),
    listing_type: this.fb.control('SALE', [Validators.required]),
    price_amount: this.fb.control(0, [Validators.required, Validators.min(1)]),
    currency: this.fb.control('EUR'),
    status: this.fb.control('disponibile')
  });

  constructor() {
    // Effect per popolare il form quando arriva la property
    effect(() => {
      const prop = this.property();
      if (prop) {
        this.populateForm(prop);
      }
    });
  }

  private populateForm(prop: PropertyToEdit): void {
    this.propertyForm.patchValue({
      city: prop.city,
      address: prop.address,
      property_type: prop.propertyType.toUpperCase(),
      rooms: prop.rooms,
      bathrooms: prop.bathrooms || 0,
      area_m2: prop.size,
      floor: prop.floor || 0,
      elevator: prop.elevator,
      energy_class: prop.energyClass || 'D',
      description: prop.description,
      title: prop.title,
      listing_type: prop.type === 'vendita' ? 'SALE' : 'RENT',
      price_amount: prop.price,
      currency: 'EUR',
      status: prop.status
    });

    // Pre-carica l'immagine esistente come preview
    if (prop.image) {
      this.imagePreviews.set([prop.image]);
    }
  }

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
      if (currentImages.length < 10) {
        currentImages.push(file);
        
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
      
      const formData = {
        id: this.property().id,
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
          type: formValue.listing_type,
          price_amount: formValue.price_amount,
          currency: formValue.currency,
          status: formValue.status
        },
        images: this.selectedImages()
      };
      
      this.save.emit(formData);
    } else {
      this.propertyForm.markAllAsTouched();
    }
  }

  // ===== VALIDATION HELPERS =====

  getErrorMessage(fieldName: keyof EditPropertyFormValue): string {
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

  hasError(fieldName: keyof EditPropertyFormValue): boolean {
    const control = this.propertyForm.get(fieldName);
    return !!(control?.invalid && control?.touched);
  }
}
