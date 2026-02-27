import { ListingMode, PropertyType, EnergyClass } from './Property';

export interface SavedSearchCriteria {
  mode?: ListingMode | null;
  propertyType?: PropertyType | null;
  city?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  minRooms?: number | null;
  minArea?: number | null;
  maxArea?: number | null;
  energyClass?: EnergyClass | null;
  hasElevator?: boolean | null;
}

export interface SavedSearch {
  id: number;
  userId: number;
  name: string;
  criteria: SavedSearchCriteria;
  createdAt: string;
  updatedAt: string;
}

export interface SavedSearchDTO {
  id?: number;
  userId?: number;
  name: string;
  criteria: SavedSearchCriteria;
  createdAt?: string;
  updatedAt?: string;
}
