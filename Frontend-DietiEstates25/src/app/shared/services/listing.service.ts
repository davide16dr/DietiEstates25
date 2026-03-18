import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PropertyFiltersValue } from '../models/Property';
import { environment } from '../../../environments/environment';

export interface ListingResponse {
  id: string;
  title: string;
  description: string;
  type: string; // "SALE" o "RENT"
  status: string;
  price: number;
  currency: string;
  agentName?: string;
  
  // Dati della proprietà (struttura piatta come nel backend)
  address: string;
  city: string;
  propertyType: string;
  rooms: number;
  bathrooms?: number;  // ✅ AGGIUNTO campo bagni
  area: number;
  floor: number;
  energyClass: string;
  hasElevator: boolean;
  
  // Coordinate per la mappa
  latitude?: number;
  longitude?: number;
  
  // Immagini
  imageUrls?: string[];
}

export interface ListingFilterRequest {
  type?: string;
  status?: string;
  city?: string;
  propertyType?: string;
  priceMin?: number;
  priceMax?: number;
  roomsMin?: number;
  areaMin?: number;
  areaMax?: number;
  energyClass?: string;
  elevator?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ListingService {
  private readonly API = `${environment.apiUrl}/listings`;

  constructor(private http: HttpClient) {}

  searchListings(filters: PropertyFiltersValue): Observable<ListingResponse[]> {
    // Converto i filtri Angular nel formato del backend
    const request: ListingFilterRequest = {
      type: filters.mode ? (filters.mode === 'Vendita' ? 'SALE' : 'RENT') : undefined,
      status: 'ACTIVE',
      city: filters.city || undefined,
      propertyType: filters.type !== 'Tutti' ? filters.type : undefined, // AGGIUNTO: passa il tipo di proprietà
      priceMin: filters.priceMin ?? undefined,
      priceMax: filters.priceMax ?? undefined,
      roomsMin: filters.roomsMin !== 'Qualsiasi' ? filters.roomsMin : undefined,
      areaMin: filters.areaMin ?? undefined,
      areaMax: filters.areaMax ?? undefined,
      energyClass: filters.energy !== 'Qualsiasi' ? filters.energy : undefined,
      elevator: filters.elevator || undefined
    };

    // Uso GET con query parameters
    let params = new HttpParams();
    
    if (request.type) params = params.set('type', request.type);
    if (request.status) params = params.set('status', request.status);
    if (request.city) params = params.set('city', request.city);
    if (request.propertyType) params = params.set('propertyType', request.propertyType); // AGGIUNTO
    if (request.priceMin !== undefined) params = params.set('priceMin', request.priceMin.toString());
    if (request.priceMax !== undefined) params = params.set('priceMax', request.priceMax.toString());
    if (request.roomsMin !== undefined) params = params.set('roomsMin', request.roomsMin.toString());
    if (request.areaMin !== undefined) params = params.set('areaMin', request.areaMin.toString());
    if (request.areaMax !== undefined) params = params.set('areaMax', request.areaMax.toString());
    if (request.energyClass) params = params.set('energyClass', request.energyClass);
    if (request.elevator) params = params.set('elevator', 'true');

    return this.http.get<ListingResponse[]>(`${this.API}/search`, { params });
  }

  getById(id: string): Observable<ListingResponse> {
    return this.http.get<ListingResponse>(`${this.API}/${id}`);
  }

  getMyListings(): Observable<ListingResponse[]> {
    return this.http.get<ListingResponse[]>(`${this.API}/agent/my-listings`);
  }

  /**
   * Recupera tutti gli immobili dell'agenzia (per i manager)
   */
  getAllAgencyListings(): Observable<ListingResponse[]> {
    return this.http.get<ListingResponse[]>(`${this.API}/agency/all`);
  }

  createListing(propertyData: any): Observable<ListingResponse> {
    // Crea FormData per inviare file multipart
    const formData = new FormData();
    
    // Aggiungi i dati JSON come stringhe
    formData.append('property', JSON.stringify(propertyData.property));
    formData.append('listing', JSON.stringify(propertyData.listing));
    
    // Aggiungi le immagini se presenti
    if (propertyData.images && propertyData.images.length > 0) {
      propertyData.images.forEach((file: File) => {
        formData.append('images', file, file.name);
      });
    }
    
    return this.http.post<ListingResponse>(`${this.API}/agent/create`, formData);
  }

  updateListing(id: string, propertyData: any): Observable<ListingResponse> {
    console.log('🔄 [ListingService] updateListing chiamato con:', propertyData);
    
    // SEMPRE usa FormData per l'aggiornamento
    const formData = new FormData();
    
    // Aggiungi i dati JSON come stringhe
    if (propertyData.property) {
      formData.append('property', JSON.stringify(propertyData.property));
    }
    if (propertyData.listing) {
      formData.append('listing', JSON.stringify(propertyData.listing));
    }
    
    // Aggiungi le URLs delle immagini esistenti da mantenere
    if (propertyData.existingImageUrls && propertyData.existingImageUrls.length > 0) {
      formData.append('existingImageUrls', JSON.stringify(propertyData.existingImageUrls));
    }
    
    // Aggiungi le nuove immagini da caricare
    if (propertyData.images && propertyData.images.length > 0) {
      propertyData.images.forEach((file: File) => {
        formData.append('images', file, file.name);
      });
    }
    
    console.log('📤 [ListingService] Invio FormData al backend');
    return this.http.put<ListingResponse>(`${this.API}/${id}`, formData);
  }
}
