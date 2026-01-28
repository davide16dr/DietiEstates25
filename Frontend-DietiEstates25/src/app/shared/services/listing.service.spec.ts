import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { ListingService, ListingResponse } from './listing.service';
import { PropertyFiltersValue } from '../models/Property';

describe('ListingService', () => {
  let service: ListingService;
  let httpMock: HttpTestingController;

  const defaultFilters: PropertyFiltersValue = {
    mode: null,
    type: 'Tutti',
    city: '',
    priceMin: null,
    priceMax: null,
    roomsMin: 'Qualsiasi',
    areaMin: null,
    areaMax: null,
    energy: 'Qualsiasi',
    elevator: false
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ListingService]
    });
    service = TestBed.inject(ListingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch listings with default filters', () => {
    const mockListings: ListingResponse[] = [
      {
        id: '1',
        title: 'Test Property',
        description: 'Test description',
        type: 'SALE',
        status: 'ACTIVE',
        price: 100000,
        currency: 'EUR',
        address: 'Via Roma 1',
        city: 'Milano',
        rooms: 3,
        area: 80,
        floor: 2,
        energyClass: 'A',
        hasElevator: true,
        latitude: 45.0,
        longitude: 9.0,
        imageUrls: ['http://example.com/image.jpg']
      }
    ];

    service.searchListings(defaultFilters).subscribe((listings) => {
      expect(listings.length).toBe(1);
      expect(listings[0].title).toBe('Test Property');
    });

    const req = httpMock.expectOne((r) => r.url.includes('/api/listings/search'));
    expect(req.request.method).toBe('GET');
    req.flush(mockListings);
  });

  it('should send correct query params for filters', () => {
    const filters: PropertyFiltersValue = {
      mode: 'Vendita',
      type: 'Appartamento',
      city: 'Roma',
      priceMin: 50000,
      priceMax: 200000,
      roomsMin: 2,
      areaMin: 50,
      areaMax: 150,
      energy: 'A',
      elevator: true
    };

    service.searchListings(filters).subscribe();

    const req = httpMock.expectOne((r) => r.url.includes('/api/listings/search'));
    expect(req.request.params.get('type')).toBe('SALE');
    expect(req.request.params.get('city')).toBe('Roma');
    expect(req.request.params.get('priceMin')).toBe('50000');
    expect(req.request.params.get('priceMax')).toBe('200000');
    req.flush([]);
  });
});
