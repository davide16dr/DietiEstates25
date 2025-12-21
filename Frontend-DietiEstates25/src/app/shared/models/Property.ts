export type PropertyType = 'Tutti' | 'Appartamento' | 'Attico' | 'Bilocale' | 'Villa' | 'Ufficio';
export type EnergyClass = 'Qualsiasi' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';

export interface PropertyFiltersValue {
    type: PropertyType;
    city: string;
    priceMin: number | null;
    priceMax: number | null;
    roomsMin: number | 'Qualsiasi';
    areaMin: number | null;
    areaMax: number | null;
    energy: EnergyClass;
    elevator: boolean;
}
export type ListingMode = 'Vendita' | 'Affitto';
export type Availability = 'Disponibile' | 'Venduto' | 'Affittato';
export type Energy = 'A'|'B'|'C'|'D'|'E'|'F'|'G';

export interface PropertyCard {
  id: string;
  availability: Availability;
  mode: ListingMode;
  priceLabel: string;
  title: string;
  address: string;
  rooms: number;
  area: number;
  floor: number;
  energy: Energy;
  city: string;
  mapX: number;
  mapY: number;
  lat: number;
  lng: number;
}