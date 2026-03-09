import { Component, input, output, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, NonNullableFormBuilder } from '@angular/forms';

// Interfaccia per i dati dell'immobile da modificare
interface PropertyToEdit {
  id: string;
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
  imageUrls?: string[]; // ✅ AGGIUNTO: array di tutte le immagini
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
  
  selectedImages = signal<File[]>([]); // Nuove immagini da caricare
  imagePreviews = signal<string[]>([]); // Preview di tutte le immagini (esistenti + nuove)
  existingImageUrls = signal<string[]>([]); // URLs delle immagini già salvate
  isDragging = signal(false);
  uploadError = signal<string | null>(null);

  // Costanti per validazione
  private readonly MAX_IMAGES = 10;
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

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

    // ✅ CORRETTO: Carica TUTTE le immagini esistenti
    const existingImages = prop.imageUrls && prop.imageUrls.length > 0 
      ? prop.imageUrls 
      : (prop.image ? [prop.image] : []);
    
    // Reset completo degli array prima di popolare
    this.selectedImages.set([]);
    this.existingImageUrls.set([...existingImages]);
    this.imagePreviews.set([...existingImages]);
    
    console.log('📸 === POPOLAZIONE FORM MODIFICA ===');
    console.log('📸 Immagini dal backend:', existingImages);
    console.log('📸 Property.imageUrls:', prop.imageUrls);
    console.log('📸 Property.image:', prop.image);
    console.log('📸 Immagini caricate nel form:', existingImages.length);
    console.log('📸 === FINE POPOLAZIONE ===');
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

    const currentImages = this.selectedImages();
    const currentPreviews = this.imagePreviews();
    const totalImages = currentPreviews.length; // Include sia esistenti che nuove
    const availableSlots = this.MAX_IMAGES - totalImages;
    
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
    
    // ✅ CORRETTO: Aggiungi i file subito all'array
    const updatedImages = [...currentImages, ...filesToAdd];
    this.selectedImages.set(updatedImages);
    
    // ✅ CORRETTO: Crea i preview in modo asincrono e aggiorna ogni volta
    let previewsToAdd: string[] = [];
    let loadedCount = 0;
    
    filesToAdd.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        previewsToAdd[index] = e.target?.result as string;
        loadedCount++;
        
        // Quando tutti i preview sono caricati, aggiorna il signal
        if (loadedCount === filesToAdd.length) {
          const allPreviews = [...currentPreviews, ...previewsToAdd];
          this.imagePreviews.set(allPreviews);
          console.log(`✅ Aggiunte ${filesToAdd.length} nuove immagini. Totale: ${allPreviews.length}`);
        }
      };
      reader.readAsDataURL(file);
    });
  }

  removeImage(index: number): void {
    console.log('🗑️ Rimozione immagine - Index:', index);
    
    const previews = [...this.imagePreviews()];
    const existingUrls = [...this.existingImageUrls()];
    const newImages = [...this.selectedImages()];
    
    console.log('Prima della rimozione:', {
      totalPreviews: previews.length,
      existingUrls: existingUrls.length,
      newImages: newImages.length
    });
    
    // Determina se l'immagine da rimuovere è esistente o nuova
    if (index < existingUrls.length) {
      // ✅ Rimuovi dalle immagini esistenti
      console.log('Rimozione immagine esistente:', existingUrls[index]);
      existingUrls.splice(index, 1);
      this.existingImageUrls.set(existingUrls);
    } else {
      // ✅ Rimuovi dalle nuove immagini
      const newImageIndex = index - existingUrls.length;
      console.log('Rimozione nuova immagine:', newImageIndex);
      newImages.splice(newImageIndex, 1);
      this.selectedImages.set(newImages);
    }
    
    // ✅ IMPORTANTE: Rimuovi dalla preview SEMPRE
    previews.splice(index, 1);
    this.imagePreviews.set(previews);
    this.uploadError.set(null);
    
    console.log('Dopo la rimozione:', {
      totalPreviews: this.imagePreviews().length,
      existingUrls: this.existingImageUrls().length,
      newImages: this.selectedImages().length
    });
    console.log('✅ Immagine rimossa con successo');
  }

  // Numero di immagini totali
  get imageCount(): number {
    return this.imagePreviews().length;
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
      
      console.log('🔍 === DEBUG MODIFICA IMMOBILE ===');
      console.log('📸 Immagini esistenti:', this.existingImageUrls());
      console.log('📸 Nuove immagini:', this.selectedImages().length);
      
      const updateData = {
        property: {
          city: formValue.city,
          address: formValue.address,
          property_type: formValue.property_type,
          rooms: formValue.rooms,
          bathrooms: formValue.bathrooms || 0,
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
        existingImageUrls: this.existingImageUrls(), // ✅ URLs delle immagini da mantenere
        images: this.selectedImages() // ✅ Nuove immagini da caricare
      };
      
      console.log('📤 Payload completo:', updateData);
      console.log('🔍 === FINE DEBUG ===');
      
      this.save.emit(updateData);
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
