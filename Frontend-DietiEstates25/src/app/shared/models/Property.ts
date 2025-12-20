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