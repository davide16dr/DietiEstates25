import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PropertyFiltersValue } from '../models/Property';

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
  private readonly API = 'http://localhost:8080/api/listings';

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
    return this.http.post<ListingResponse>(`${this.API}/agent/create`, propertyData);
  }

  updateListing(id: string, propertyData: any): Observable<ListingResponse> {
    return this.http.put<ListingResponse>(`${this.API}/${id}`, propertyData);
  }
}
