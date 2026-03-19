import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PropertyFiltersValue } from '../models/Property';
import { environment } from '../../../environments/environment';

export interface ListingResponse {
  id: string;
  title: string;
  description: string;
  type: string; 
  status: string;
  price: number;
  currency: string;
  agentName?: string;
  
  
  address: string;
  city: string;
  propertyType: string;
  rooms: number;
  bathrooms?: number;  
  area: number;
  floor: number;
  energyClass: string;
  hasElevator: boolean;
  
  
  latitude?: number;
  longitude?: number;
  
  
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
    
    const request: ListingFilterRequest = {
      type: filters.mode ? (filters.mode === 'Vendita' ? 'SALE' : 'RENT') : undefined,
      status: 'ACTIVE',
      city: filters.city || undefined,
      propertyType: filters.type !== 'Tutti' ? filters.type : undefined, 
      priceMin: filters.priceMin ?? undefined,
      priceMax: filters.priceMax ?? undefined,
      roomsMin: filters.roomsMin !== 'Qualsiasi' ? filters.roomsMin : undefined,
      areaMin: filters.areaMin ?? undefined,
      areaMax: filters.areaMax ?? undefined,
      energyClass: filters.energy !== 'Qualsiasi' ? filters.energy : undefined,
      elevator: filters.elevator || undefined
    };

    
    let params = new HttpParams();
    
    if (request.type) params = params.set('type', request.type);
    if (request.status) params = params.set('status', request.status);
    if (request.city) params = params.set('city', request.city);
    if (request.propertyType) params = params.set('propertyType', request.propertyType); 
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

  


  getAllAgencyListings(): Observable<ListingResponse[]> {
    return this.http.get<ListingResponse[]>(`${this.API}/agency/all`);
  }

  createListing(propertyData: any): Observable<ListingResponse> {
    
    const formData = new FormData();
    
    
    formData.append('property', JSON.stringify(propertyData.property));
    formData.append('listing', JSON.stringify(propertyData.listing));
    
    
    if (propertyData.images && propertyData.images.length > 0) {
      propertyData.images.forEach((file: File) => {
        formData.append('images', file, file.name);
      });
    }
    
    return this.http.post<ListingResponse>(`${this.API}/agent/create`, formData);
  }

  updateListing(id: string, propertyData: any): Observable<ListingResponse> {
    console.log('🔄 [ListingService] updateListing chiamato con:', propertyData);
    
    
    const formData = new FormData();
    
    
    if (propertyData.property) {
      formData.append('property', JSON.stringify(propertyData.property));
    }
    if (propertyData.listing) {
      formData.append('listing', JSON.stringify(propertyData.listing));
    }
    
    
    if (propertyData.existingImageUrls && propertyData.existingImageUrls.length > 0) {
      formData.append('existingImageUrls', JSON.stringify(propertyData.existingImageUrls));
    }
    
    
    if (propertyData.images && propertyData.images.length > 0) {
      propertyData.images.forEach((file: File) => {
        formData.append('images', file, file.name);
      });
    }
    
    console.log('📤 [ListingService] Invio FormData al backend');
    return this.http.put<ListingResponse>(`${this.API}/${id}`, formData);
  }
}
