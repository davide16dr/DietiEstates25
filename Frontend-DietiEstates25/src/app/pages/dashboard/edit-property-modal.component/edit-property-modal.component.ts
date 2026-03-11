import { Component, input, output, inject, signal, effect, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, NonNullableFormBuilder } from '@angular/forms';
import { GooglePlacesService, PlacePrediction, GeocodingResult } from '../../../shared/services/google-places.service';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

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
export class EditPropertyModalComponent implements AfterViewInit, OnDestroy {
  // Modern Angular 21: input() e output()
  property = input.required<PropertyToEdit>();
  close = output<void>();
  save = output<any>();

  // Modern Angular 21: inject() e signal()
  private fb = inject(NonNullableFormBuilder);
  private googlePlacesService = inject(GooglePlacesService);
  
  @ViewChild('cityInput') cityInput!: ElementRef<HTMLInputElement>;
  @ViewChild('addressInput') addressInput!: ElementRef<HTMLInputElement>;

  // Autocomplete per città
  citySuggestions = signal<PlacePrediction[]>([]);
  showCitySuggestions = signal(false);
  private citySearchSubject = new Subject<string>();

  // Autocomplete per indirizzo
  addressSuggestions = signal<PlacePrediction[]>([]);
  showAddressSuggestions = signal(false);
  private addressSearchSubject = new Subject<string>();

  // Coordinate geografiche
  propertyCoordinates = signal<{ lat: number; lng: number } | null>(null);
  cityCoordinates = signal<{ lat: number; lng: number } | null>(null); // ✅ AGGIUNTO: coordinate della città per bias geografico
  
  selectedImages = signal<File[]>([]); 
  imagePreviews = signal<string[]>([]); 
  existingImageUrls = signal<string[]>([]); 
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

    // Configura l'autocomplete per il campo città (solo città italiane)
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

    // Configura l'autocomplete per il campo indirizzo (indirizzi completi)
    this.addressSearchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(input => {
          // ✅ INTELLIGENTE: Usa sempre il filtro per città se disponibile
          const city = this.propertyForm.get('city')?.value?.trim();
          const coords = this.cityCoordinates();
          
          if (city && city.length > 0) {
            // ✅ SEMPRE: Se la città è compilata, usa il filtro restrittivo
            // Usa coordinate se disponibili, altrimenti coordinate di default (0,0)
            const lat = coords?.lat || 0;
            const lng = coords?.lng || 0;
            console.log('🔍 Ricerca indirizzo CON filtro città:', city);
            return this.googlePlacesService.getAddressSuggestionsNearLocation(input, lat, lng, city);
          } else {
            // Città vuota: cerca indirizzi generici in tutta Italia
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
    // Listener per chiudere i suggerimenti quando si clicca fuori
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

  // ===== AUTOCOMPLETE HANDLERS =====

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
    // Usa solo il nome della città (main_text)
    this.propertyForm.patchValue({ city: prediction.structured_formatting.main_text });
    this.citySuggestions.set([]);
    this.showCitySuggestions.set(false);

    // ✅ IMPORTANTE: Ottieni e salva le coordinate della città per bias geografico
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
    
    // Controlla se il campo città è già compilato
    const currentCity = this.propertyForm.get('city')?.value?.trim();
    const isCityAlreadySet = currentCity && currentCity.length > 0;
    
    console.log('📍 Città già compilata?', isCityAlreadySet, '- Valore:', currentCity);
    
    // Usa il geocoding per ottenere i dati strutturati correttamente
    this.googlePlacesService.geocodePlaceId(prediction.place_id).subscribe(result => {
      if (result) {
        console.log('📍 Risultato geocoding completo:', result);
        
        // ✅ Estrai SOLO la via e il numero civico dall'indirizzo completo
        const fullAddress = result.address;
        const addressParts = fullAddress.split(',').map(p => p.trim());
        
        let streetAddress = addressParts[0]; // Es: "Via Provinciale Montagna Spaccata"
        
        // Se c'è una seconda parte che sembra un numero civico, aggiungila
        if (addressParts.length > 1) {
          const possibleNumber = addressParts[1].trim();
          // Controlla se è solo un numero (numero civico)
          if (/^\d+[a-zA-Z]?$/.test(possibleNumber)) {
            streetAddress = `${streetAddress}, ${possibleNumber}`;
          }
        }
        
        const cityFromAddress = result.city; // Città estratta dal geocoding
        
        console.log('📍 Indirizzo estratto (SOLO via + civico):', streetAddress);
        console.log('📍 Città estratta:', cityFromAddress);
        
        // ✅ LOGICA INTELLIGENTE:
        if (isCityAlreadySet) {
          // Caso 1: Città già compilata → aggiorna SOLO l'indirizzo
          console.log('✅ Città già presente, aggiorno solo l\'indirizzo');
          this.propertyForm.patchValue({ 
            address: streetAddress
            // NON toccare il campo città
          });
        } else {
          // Caso 2: Città vuota → autocompila ENTRAMBI i campi
          console.log('✅ Città vuota, autocompilo città + indirizzo');
          this.propertyForm.patchValue({ 
            address: streetAddress,
            city: cityFromAddress // Autocompila la città
          });
        }
        
        // Salva le coordinate
        this.propertyCoordinates.set({ lat: result.latitude, lng: result.longitude });
        console.log('📍 Coordinate immobile:', result.latitude, result.longitude);
      } else {
        console.error('❌ Geocoding fallito per place_id:', prediction.place_id);
        
        // ✅ FALLBACK: Usa il parsing manuale come backup
        const fullAddress = prediction.description;
        const parts = fullAddress.split(',').map(p => p.trim());
        
        const streetWithNumber = parts[0];
        const cityFromDescription = parts.length > 1 ? parts[1] : '';
        
        if (isCityAlreadySet) {
          // Città già presente: aggiorna solo indirizzo
          this.propertyForm.patchValue({ 
            address: streetWithNumber
          });
        } else {
          // Città vuota: autocompila entrambi
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
    
    // Chiudi suggerimenti città se si clicca fuori
    if (this.cityInput && !this.cityInput.nativeElement.contains(target)) {
      const clickedCitySuggestion = target.closest('.city-suggestions');
      if (!clickedCitySuggestion) {
        this.showCitySuggestions.set(false);
      }
    }

    // Chiudi suggerimenti indirizzo se si clicca fuori
    if (this.addressInput && !this.addressInput.nativeElement.contains(target)) {
      const clickedAddressSuggestion = target.closest('.address-suggestions');
      if (!clickedAddressSuggestion) {
        this.showAddressSuggestions.set(false);
      }
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
      console.log('📍 Coordinate (salvate localmente, non inviate al backend):', this.propertyCoordinates());
      console.log('📋 Form values completi:', formValue);
      
      // ✅ CORRETTO: Costruisci il payload property CON latitude/longitude dal frontend
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

      // ✅ IMPORTANTE: Aggiungi le coordinate GPS se disponibili (da Google Places Autocomplete)
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
