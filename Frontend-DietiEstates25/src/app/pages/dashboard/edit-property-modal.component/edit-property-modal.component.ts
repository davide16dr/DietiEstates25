import { Component, input, output, inject, signal, effect, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, NonNullableFormBuilder } from '@angular/forms';
import { GooglePlacesService, PlacePrediction, GeocodingResult } from '../../../shared/services/google-places.service';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';


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
  imageUrls?: string[]; 
}


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
export class EditPropertyModalComponent implements AfterViewInit, OnDestroy {
  
  property = input.required<PropertyToEdit>();
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
  existingImageUrls = signal<string[]>([]); 
  isDragging = signal(false);
  uploadError = signal<string | null>(null);

  
  private readonly MAX_IMAGES = 10;
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; 
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  
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
    
    effect(() => {
      const prop = this.property();
      if (prop) {
        this.populateForm(prop);
      }
    });

    
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
          
          if (city && city.length > 0) {
            
            
            const lat = coords?.lat || 0;
            const lng = coords?.lng || 0;
            console.log('🔍 Ricerca indirizzo CON filtro città:', city);
            return this.googlePlacesService.getAddressSuggestionsNearLocation(input, lat, lng, city);
          } else {
            
            console.log('🔍 Ricerca indirizzo SENZA città specificata:', input);
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

    
    const existingImages = prop.imageUrls && prop.imageUrls.length > 0 
      ? prop.imageUrls 
      : (prop.image ? [prop.image] : []);
    
    
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
        console.log('📍 Coordinate città salvate per bias geografico:', result.city, result.latitude, result.longitude);
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
    console.log('🔍 DEBUG selectAddress - Prediction completa:', prediction);
    console.log('🔍 Description:', prediction.description);
    console.log('🔍 Main text:', prediction.structured_formatting.main_text);
    console.log('🔍 Secondary text:', prediction.structured_formatting.secondary_text);
    
    
    const currentCity = this.propertyForm.get('city')?.value?.trim();
    const isCityAlreadySet = currentCity && currentCity.length > 0;
    
    console.log('📍 Città già compilata?', isCityAlreadySet, '- Valore:', currentCity);
    
    
    this.googlePlacesService.geocodePlaceId(prediction.place_id).subscribe(result => {
      if (result) {
        console.log('📍 Risultato geocoding completo:', result);
        
        
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
        
        console.log('📍 Indirizzo estratto (SOLO via + civico):', streetAddress);
        console.log('📍 Città estratta:', cityFromAddress);
        
        
        if (isCityAlreadySet) {
          
          console.log('✅ Città già presente, aggiorno solo l\'indirizzo');
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
      } else {
        console.error('❌ Geocoding fallito per place_id:', prediction.place_id);
        
        
        const fullAddress = prediction.description;
        const parts = fullAddress.split(',').map(p => p.trim());
        
        const streetWithNumber = parts[0];
        const cityFromDescription = parts.length > 1 ? parts[1] : '';
        
        if (isCityAlreadySet) {
          
          this.propertyForm.patchValue({ 
            address: streetWithNumber
          });
        } else {
          
          this.propertyForm.patchValue({ 
            address: streetWithNumber,
            city: cityFromDescription
          });
        }
        
        console.log('⚠️ Usando fallback - Indirizzo:', streetWithNumber, 'Città:', cityFromDescription);
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

    const currentImages = this.selectedImages();
    const currentPreviews = this.imagePreviews();
    const totalImages = currentPreviews.length; 
    const availableSlots = this.MAX_IMAGES - totalImages;
    
    
    if (availableSlots === 0) {
      this.uploadError.set(`Massimo ${this.MAX_IMAGES} immagini consentite.`);
      return;
    }
    
    
    if (imageFiles.length > availableSlots) {
      this.uploadError.set(`Puoi aggiungere solo ${availableSlots} immagini. Limite massimo: ${this.MAX_IMAGES}.`);
    }
    
    
    const filesToAdd = imageFiles.slice(0, availableSlots);
    
    
    const updatedImages = [...currentImages, ...filesToAdd];
    this.selectedImages.set(updatedImages);
    
    
    let previewsToAdd: string[] = [];
    let loadedCount = 0;
    
    filesToAdd.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        previewsToAdd[index] = e.target?.result as string;
        loadedCount++;
        
        
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
    
    
    if (index < existingUrls.length) {
      
      console.log('Rimozione immagine esistente:', existingUrls[index]);
      existingUrls.splice(index, 1);
      this.existingImageUrls.set(existingUrls);
    } else {
      
      const newImageIndex = index - existingUrls.length;
      console.log('Rimozione nuova immagine:', newImageIndex);
      newImages.splice(newImageIndex, 1);
      this.selectedImages.set(newImages);
    }
    
    
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

  
  get imageCount(): number {
    return this.imagePreviews().length;
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
      
      console.log('🔍 === DEBUG MODIFICA IMMOBILE ===');
      console.log('📸 Immagini esistenti:', this.existingImageUrls());
      console.log('📸 Nuove immagini:', this.selectedImages().length);
      console.log('📍 Coordinate (salvate localmente, non inviate al backend):', this.propertyCoordinates());
      console.log('📋 Form values completi:', formValue);
      
      
      const propertyData: any = {
        city: formValue.city,
        address: formValue.address,
        property_type: formValue.property_type,
        rooms: formValue.rooms,
        bathrooms: formValue.bathrooms || 0,
        area_m2: formValue.area_m2,
        floor: formValue.floor || 0,
        elevator: formValue.elevator,
        energy_class: formValue.energy_class,
        description: formValue.description
      };

      
      const coords = this.propertyCoordinates();
      if (coords) {
        propertyData.latitude = coords.lat;
        propertyData.longitude = coords.lng;
        console.log('✅ Coordinate GPS aggiunte al payload:', coords);
      } else {
        console.log('⚠️ Nessuna coordinata GPS disponibile - il backend dovrà geocodificare');
      }
      
      const updateData = {
        property: propertyData,
        listing: {
          title: formValue.title,
          type: formValue.listing_type,
          price_amount: formValue.price_amount,
          currency: formValue.currency,
          status: formValue.status
        },
        existingImageUrls: this.existingImageUrls(),
        images: this.selectedImages()
      };
      
      console.log('📤 Payload completo da inviare:', updateData);
      console.log('📤 Property object:', JSON.stringify(updateData.property, null, 2));
      console.log('📤 Listing object:', JSON.stringify(updateData.listing, null, 2));
      console.log('🔍 === FINE DEBUG ===');
      
      this.save.emit(updateData);
    } else {
      console.error('❌ Form non valido:', this.propertyForm.errors);
      this.propertyForm.markAllAsTouched();
    }
  }

  

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
