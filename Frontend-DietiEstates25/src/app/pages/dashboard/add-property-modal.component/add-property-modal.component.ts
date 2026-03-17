import { Component, output, inject, signal, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, NonNullableFormBuilder } from '@angular/forms';
import { GooglePlacesService, PlacePrediction } from '../../../shared/services/google-places.service';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

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
export class AddPropertyModalComponent implements AfterViewInit, OnDestroy {
  // Modern Angular 21: output() invece di @Output()
  close = output<void>();
  save = output<any>();

  // Modern Angular 21: inject() invece di constructor DI
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
  cityCoordinates = signal<{ lat: number; lng: number } | null>(null);

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
    property_type: this.fb.control('Appartamento', [Validators.required]),
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

  constructor() {
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
          // ✅ INTELLIGENTE: Usa il nome della città per filtrare i risultati
          const city = this.propertyForm.get('city')?.value?.trim();
          const coords = this.cityCoordinates();
          
          if (city && city.length > 0 && coords) {
            // Città già compilata CON coordinate: cerca indirizzi SOLO in quella città
            console.log('🔍 Ricerca indirizzo in città:', city, coords);
            return this.googlePlacesService.getAddressSuggestionsNearLocation(input, coords.lat, coords.lng, city);
          } else if (city && city.length > 0) {
            // Città compilata ma senza coordinate: usa il nome città nella query
            const fullQuery = `${input}, ${city}, Italia`;
            console.log('🔍 Ricerca indirizzo CON città nella query:', fullQuery);
            return this.googlePlacesService.getAddressSuggestions(fullQuery);
          } else {
            // Città vuota: cerca indirizzi generici in tutta Italia
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
    // Listener per chiudere i suggerimenti quando si clicca fuori
    document.addEventListener('click', this.handleClickOutside.bind(this));
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.handleClickOutside.bind(this));
    this.citySearchSubject.complete();
    this.addressSearchSubject.complete();
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
    
    // Controlla se il campo città è già compilato
    const currentCity = this.propertyForm.get('city')?.value?.trim();
    const isCityAlreadySet = currentCity && currentCity.length > 0;
    
    // Usa il geocoding per ottenere i dati strutturati correttamente
    this.googlePlacesService.geocodePlaceId(prediction.place_id).subscribe(result => {
      if (result) {
        console.log('📍 Risultato geocoding:', result);
        
        // ✅ Estrai SOLO la via e il numero civico
        const fullAddress = result.address;
        const addressParts = fullAddress.split(',').map(p => p.trim());
        
        let streetAddress = addressParts[0]; // Es: "Via Provinciale Montagna Spaccata"
        
        // Se c'è una seconda parte che sembra un numero civico, aggiungila
        if (addressParts.length > 1) {
          const possibleNumber = addressParts[1].trim();
          if (/^\d+[a-zA-Z]?$/.test(possibleNumber)) {
            streetAddress = `${streetAddress}, ${possibleNumber}`;
          }
        }
        
        const cityFromAddress = result.city;
        
        console.log('📍 Indirizzo estratto:', streetAddress);
        console.log('📍 Città estratta:', cityFromAddress);
        
        // ✅ LOGICA INTELLIGENTE:
        if (isCityAlreadySet) {
          // Città già presente: aggiorna SOLO l'indirizzo
          console.log('✅ Città già presente, aggiorno solo indirizzo');
          this.propertyForm.patchValue({ 
            address: streetAddress
          });
        } else {
          // Città vuota: autocompila ENTRAMBI i campi
          console.log('✅ Città vuota, autocompilo città + indirizzo');
          this.propertyForm.patchValue({ 
            address: streetAddress,
            city: cityFromAddress
          });
        }
        
        // Salva le coordinate
        this.propertyCoordinates.set({ lat: result.latitude, lng: result.longitude });
        console.log('📍 Coordinate immobile:', result.latitude, result.longitude);
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
      // Marca tutti i campi come touched per mostrare gli errori
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
