import { Component, output, inject, signal, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, NonNullableFormBuilder } from '@angular/forms';
import { GooglePlacesService, PlacePrediction } from '../../../shared/services/google-places.service';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';


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
export class AddPropertyModalComponent implements AfterViewInit, OnDestroy {
  
  close = output<void>();
  save = output<any>();

  
  private fb = inject(NonNullableFormBuilder);
  private googlePlacesService = inject(GooglePlacesService);

  @ViewChild('cityInput') cityInput!: ElementRef<HTMLInputElement>;
  @ViewChild('addressInput') addressInput!: ElementRef<HTMLInputElement>;

  
  citySuggestions = signal<PlacePrediction[]>([]);
  showCitySuggestions = signal(false);
  private citySearchSubject = new Subject<string>();

  
  addressSuggestions = signal<PlacePrediction[]>([]);
  showAddressSuggestions = signal(false);
  private addressSearchSubject = new Subject<string>();

  
  propertyCoordinates = signal<{ lat: number; lng: number } | null>(null);
  cityCoordinates = signal<{ lat: number; lng: number } | null>(null);

  
  selectedImages = signal<File[]>([]);
  imagePreviews = signal<string[]>([]);
  isDragging = signal(false);
  uploadError = signal<string | null>(null);

  
  private readonly MAX_IMAGES = 10;
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; 
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  
  propertyForm = this.fb.group({
    
    city: this.fb.control('', [Validators.required]),
    address: this.fb.control('', [Validators.required]),
    property_type: this.fb.control('Appartamento', [Validators.required]),
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
    currency: this.fb.control('EUR')
  });

  constructor() {
    
    this.citySearchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(input => this.googlePlacesService.getCitySuggestions(input))
      )
      .subscribe(suggestions => {
        this.citySuggestions.set(suggestions);
        this.showCitySuggestions.set(suggestions.length > 0);
      });

    
    this.addressSearchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(input => {
          
          const city = this.propertyForm.get('city')?.value?.trim();
          const coords = this.cityCoordinates();
          
          if (city && city.length > 0 && coords) {
            
            console.log('🔍 Ricerca indirizzo in città:', city, coords);
            return this.googlePlacesService.getAddressSuggestionsNearLocation(input, coords.lat, coords.lng, city);
          } else if (city && city.length > 0) {
            
            const fullQuery = `${input}, ${city}, Italia`;
            console.log('🔍 Ricerca indirizzo CON città nella query:', fullQuery);
            return this.googlePlacesService.getAddressSuggestions(fullQuery);
          } else {
            
            console.log('🔍 Ricerca indirizzo SENZA città:', input);
            return this.googlePlacesService.getAddressSuggestions(input);
          }
        })
      )
      .subscribe(suggestions => {
        this.addressSuggestions.set(suggestions);
        this.showAddressSuggestions.set(suggestions.length > 0);
      });
  }

  ngAfterViewInit(): void {
    
    document.addEventListener('click', this.handleClickOutside.bind(this));
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.handleClickOutside.bind(this));
    this.citySearchSubject.complete();
    this.addressSearchSubject.complete();
  }

  

  onCityInput(event: Event): void {
    const input = (event.target as HTMLInputElement).value;
    if (input.length >= 2) {
      this.citySearchSubject.next(input);
    } else {
      this.citySuggestions.set([]);
      this.showCitySuggestions.set(false);
    }
  }

  selectCity(prediction: PlacePrediction): void {
    
    this.propertyForm.patchValue({ city: prediction.structured_formatting.main_text });
    this.citySuggestions.set([]);
    this.showCitySuggestions.set(false);

    
    this.googlePlacesService.geocodePlaceId(prediction.place_id).subscribe(result => {
      if (result) {
        this.cityCoordinates.set({ lat: result.latitude, lng: result.longitude });
        console.log('📍 Coordinate città salvate:', result.city, result.latitude, result.longitude);
      }
    });
  }

  onAddressInput(event: Event): void {
    const input = (event.target as HTMLInputElement).value;
    if (input.length >= 3) {
      this.addressSearchSubject.next(input);
    } else {
      this.addressSuggestions.set([]);
      this.showAddressSuggestions.set(false);
    }
  }

  selectAddress(prediction: PlacePrediction): void {
    console.log('🔍 Selezione indirizzo:', prediction.description);
    
    
    const currentCity = this.propertyForm.get('city')?.value?.trim();
    const isCityAlreadySet = currentCity && currentCity.length > 0;
    
    
    this.googlePlacesService.geocodePlaceId(prediction.place_id).subscribe(result => {
      if (result) {
        console.log('📍 Risultato geocoding:', result);
        
        
        const fullAddress = result.address;
        const addressParts = fullAddress.split(',').map(p => p.trim());
        
        let streetAddress = addressParts[0]; 
        
        
        if (addressParts.length > 1) {
          const possibleNumber = addressParts[1].trim();
          if (/^\d+[a-zA-Z]?$/.test(possibleNumber)) {
            streetAddress = `${streetAddress}, ${possibleNumber}`;
          }
        }
        
        const cityFromAddress = result.city;
        
        console.log('📍 Indirizzo estratto:', streetAddress);
        console.log('📍 Città estratta:', cityFromAddress);
        
        
        if (isCityAlreadySet) {
          
          console.log('✅ Città già presente, aggiorno solo indirizzo');
          this.propertyForm.patchValue({ 
            address: streetAddress
          });
        } else {
          
          console.log('✅ Città vuota, autocompilo città + indirizzo');
          this.propertyForm.patchValue({ 
            address: streetAddress,
            city: cityFromAddress
          });
        }
        
        
        this.propertyCoordinates.set({ lat: result.latitude, lng: result.longitude });
        console.log('📍 Coordinate immobile:', result.latitude, result.longitude);
      }
      
      this.addressSuggestions.set([]);
      this.showAddressSuggestions.set(false);
    });
  }

  private handleClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    
    
    if (this.cityInput && !this.cityInput.nativeElement.contains(target)) {
      const clickedCitySuggestion = target.closest('.city-suggestions');
      if (!clickedCitySuggestion) {
        this.showCitySuggestions.set(false);
      }
    }

    
    if (this.addressInput && !this.addressInput.nativeElement.contains(target)) {
      const clickedAddressSuggestion = target.closest('.address-suggestions');
      if (!clickedAddressSuggestion) {
        this.showAddressSuggestions.set(false);
      }
    }
  }

  
  
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

    const currentImages = [...this.selectedImages()]; 
    const currentPreviews = [...this.imagePreviews()]; 
    const availableSlots = this.MAX_IMAGES - currentImages.length;
    
    
    if (availableSlots === 0) {
      this.uploadError.set(`Massimo ${this.MAX_IMAGES} immagini consentite.`);
      return;
    }
    
    
    if (imageFiles.length > availableSlots) {
      this.uploadError.set(`Puoi aggiungere solo ${availableSlots} immagini. Limite massimo: ${this.MAX_IMAGES}.`);
    }
    
    
    const filesToAdd = imageFiles.slice(0, availableSlots);
    
    
    const newImages = [...currentImages, ...filesToAdd];
    this.selectedImages.set(newImages);
    
    
    let previewsLoaded = 0;
    const newPreviews = [...currentPreviews];
    
    filesToAdd.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push(e.target?.result as string);
        previewsLoaded++;
        
        
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
    
    
    const images = [...this.selectedImages()];
    const previews = [...this.imagePreviews()];
    
    console.log('Prima:', { images: images.length, previews: previews.length });
    
    
    const previewToRemove = previews[index];
    if (previewToRemove && previewToRemove.startsWith('blob:')) {
      URL.revokeObjectURL(previewToRemove);
    }
    
    
    images.splice(index, 1);
    previews.splice(index, 1);
    
    console.log('Dopo:', { images: images.length, previews: previews.length });
    
    
    this.selectedImages.set(images);
    this.imagePreviews.set(previews);
    this.uploadError.set(null);
    
    
    console.log('✅ Signal aggiornati. Verifica:', {
      selectedImages: this.selectedImages().length,
      imagePreviews: this.imagePreviews().length
    });
  }

  
  get imageCount(): number {
    return this.selectedImages().length;
  }

  
  get availableSlots(): number {
    return this.MAX_IMAGES - this.imageCount;
  }

  

  onClose(): void {
    this.close.emit();
  }

  onSubmit(): void {
    if (this.propertyForm.valid) {
      const formValue = this.propertyForm.getRawValue();
      
      console.log('=== ADD PROPERTY MODAL onSubmit ===');
      console.log('formValue:', formValue);
      console.log('Coordinate immobile:', this.propertyCoordinates());
      console.log('===================================');
      
      const formData = {
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
      
      this.propertyForm.markAllAsTouched();
    }
  }

  private resetForm(): void {
    this.propertyForm.reset({
      property_type: 'Appartamento',
      elevator: false,
      energy_class: 'D',
      listing_type: 'SALE',
      currency: 'EUR'
    });
    this.selectedImages.set([]);
    this.imagePreviews.set([]);
    this.propertyCoordinates.set(null);
    this.cityCoordinates.set(null);
  }

  

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
