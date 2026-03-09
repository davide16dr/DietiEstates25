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
  uploadError = signal<string | null>(null);

  // Costanti per validazione
  private readonly MAX_IMAGES = 10;
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

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
    this.uploadError.set(null);
    
    // Filtra solo file immagine validi
    const imageFiles = files.filter(file => {
      if (!this.ALLOWED_TYPES.includes(file.type)) {
        this.uploadError.set(`Formato non supportato: ${file.name}. Usa JPG, PNG o WEBP.`);
        return false;
      }
      if (file.size > this.MAX_FILE_SIZE) {
        this.uploadError.set(`File troppo grande: ${file.name}. Massimo 5MB per immagine.`);
        return false;
      }
      return true;
    });

    const currentImages = [...this.selectedImages()]; // Copia profonda
    const currentPreviews = [...this.imagePreviews()]; // Copia profonda
    const availableSlots = this.MAX_IMAGES - currentImages.length;
    
    // Controlla se c'è spazio disponibile
    if (availableSlots === 0) {
      this.uploadError.set(`Massimo ${this.MAX_IMAGES} immagini consentite.`);
      return;
    }
    
    // Se ci sono più file del disponibile, mostra warning
    if (imageFiles.length > availableSlots) {
      this.uploadError.set(`Puoi aggiungere solo ${availableSlots} immagini. Limite massimo: ${this.MAX_IMAGES}.`);
    }
    
    // Aggiungi solo i file che entrano nel limite
    const filesToAdd = imageFiles.slice(0, availableSlots);
    
    // Aggiorna immediatamente le immagini
    const newImages = [...currentImages, ...filesToAdd];
    this.selectedImages.set(newImages);
    
    // Carica le preview in modo asincrono
    let previewsLoaded = 0;
    const newPreviews = [...currentPreviews];
    
    filesToAdd.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push(e.target?.result as string);
        previewsLoaded++;
        
        // Aggiorna il signal ogni volta che una preview è pronta
        this.imagePreviews.set([...newPreviews]);
        
        console.log(`Preview ${previewsLoaded}/${filesToAdd.length} caricata`);
      };
      reader.onerror = () => {
        console.error(`Errore caricamento preview per ${file.name}`);
      };
      reader.readAsDataURL(file);
    });
  }

  removeImage(index: number): void {
    console.log('🗑️ Rimozione immagine index:', index);
    
    // Ottieni copie degli array
    const images = [...this.selectedImages()];
    const previews = [...this.imagePreviews()];
    
    console.log('Prima:', { images: images.length, previews: previews.length });
    
    // Revoca l'URL blob per liberare memoria (se è un blob URL)
    const previewToRemove = previews[index];
    if (previewToRemove && previewToRemove.startsWith('blob:')) {
      URL.revokeObjectURL(previewToRemove);
    }
    
    // Rimuovi l'immagine e la preview
    images.splice(index, 1);
    previews.splice(index, 1);
    
    console.log('Dopo:', { images: images.length, previews: previews.length });
    
    // Aggiorna gli stati con nuovi array
    this.selectedImages.set(images);
    this.imagePreviews.set(previews);
    this.uploadError.set(null);
    
    // Force change detection
    console.log('✅ Signal aggiornati. Verifica:', {
      selectedImages: this.selectedImages().length,
      imagePreviews: this.imagePreviews().length
    });
  }

  // Numero di immagini caricate
  get imageCount(): number {
    return this.selectedImages().length;
  }

  // Numero di slot disponibili
  get availableSlots(): number {
    return this.MAX_IMAGES - this.imageCount;
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
          bathrooms: formValue.bathrooms || 0,  // ✅ Invia 0 invece di null
          area_m2: formValue.area_m2,
          floor: formValue.floor || null,
          elevator: formValue.elevator,
          energy_class: formValue.energy_class,
          description: formValue.description
        },
        listing: {
          title: formValue.title,
          listing_type: formValue.listing_type,
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
