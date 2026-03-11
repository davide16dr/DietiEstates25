import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface PlacePrediction {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export interface GeocodingResult {
  address: string;
  city: string;
  province: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
  formatted_address: string;
}

declare const google: any;

@Injectable({
  providedIn: 'root'
})
export class GooglePlacesService {
  private geocoder: any;
  private isGoogleMapsLoaded = false;

  constructor() {
    this.initializeGoogleMaps();
  }

  /**
   * Inizializza i servizi Google Maps quando lo script è caricato
   */
  private initializeGoogleMaps(): void {
    if (typeof google !== 'undefined' && google.maps) {
      this.setupServices();
    } else {
      // Attendi che lo script Google Maps sia caricato
      const checkGoogle = setInterval(() => {
        if (typeof google !== 'undefined' && google.maps && google.maps.places) {
          clearInterval(checkGoogle);
          this.setupServices();
        }
      }, 100);
    }
  }

  private setupServices(): void {
    this.geocoder = new google.maps.Geocoder();
    this.isGoogleMapsLoaded = true;
    console.log('✅ Google Maps API (New Places API) caricata con successo');
  }

  /**
   * Verifica se Google Maps è caricato
   */
  isReady(): boolean {
    return this.isGoogleMapsLoaded;
  }

  /**
   * Ottiene suggerimenti di città italiane basati sull'input dell'utente
   * Usa la nuova Places API (New) abilitata nel progetto
   */
  getCitySuggestions(input: string): Observable<PlacePrediction[]> {
    return new Observable(observer => {
      if (!this.isGoogleMapsLoaded || !input || input.length < 2) {
        observer.next([]);
        observer.complete();
        return;
      }

      const request = {
        input: input,
        includedPrimaryTypes: ['locality'],
        includedRegionCodes: ['it'],
        language: 'it' // ✅ CORRETTO: language invece di languageCode
      };

      google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(request)
        .then((response: any) => {
          if (response.suggestions) {
            const results: PlacePrediction[] = response.suggestions
              .filter((s: any) => s.placePrediction)
              .map((s: any) => {
                const prediction = s.placePrediction;
                const fullText = prediction.text?.text || '';
                
                // Estrai main_text e secondary_text dal testo completo
                const parts = fullText.split(',').map((p: string) => p.trim());
                const mainText = parts[0] || fullText;
                const secondaryText = parts.slice(1).join(', ');

                return {
                  description: fullText,
                  place_id: prediction.placeId || '',
                  structured_formatting: {
                    main_text: mainText,
                    secondary_text: secondaryText
                  }
                };
              });
            console.log(`✅ Trovati ${results.length} suggerimenti città`);
            observer.next(results);
          } else {
            observer.next([]);
          }
          observer.complete();
        })
        .catch((error: any) => {
          console.error('❌ Errore getCitySuggestions:', error);
          observer.next([]);
          observer.complete();
        });
    });
  }

  /**
   * Ottiene suggerimenti generici (città, indirizzi, zone) per la ricerca principale
   * Supporta sia città che indirizzi completi
   * Usa la nuova Places API (New) abilitata nel progetto
   */
  getAddressSuggestions(input: string): Observable<PlacePrediction[]> {
    return new Observable(observer => {
      if (!this.isGoogleMapsLoaded || !input || input.length < 2) {
        observer.next([]);
        observer.complete();
        return;
      }

      const request = {
        input: input,
        includedRegionCodes: ['it'],
        language: 'it' // ✅ CORRETTO: language invece di languageCode
      };

      google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(request)
        .then((response: any) => {
          if (response.suggestions) {
            const results: PlacePrediction[] = response.suggestions
              .filter((s: any) => s.placePrediction)
              .map((s: any) => {
                const prediction = s.placePrediction;
                const fullText = prediction.text?.text || '';
                
                // Estrai main_text e secondary_text dal testo completo
                const parts = fullText.split(',').map((p: string) => p.trim());
                const mainText = parts[0] || fullText;
                const secondaryText = parts.slice(1).join(', ');

                return {
                  description: fullText,
                  place_id: prediction.placeId || '',
                  structured_formatting: {
                    main_text: mainText,
                    secondary_text: secondaryText
                  }
                };
              });
            console.log(`✅ Trovati ${results.length} suggerimenti per: "${input}"`);
            observer.next(results);
          } else {
            console.log('⚠️ Nessun suggerimento trovato');
            observer.next([]);
          }
          observer.complete();
        })
        .catch((error: any) => {
          console.error('❌ Errore getAddressSuggestions:', error);
          observer.next([]);
          observer.complete();
        });
    });
  }

  /**
   * Ottiene suggerimenti di indirizzi vicino a una specifica località
   * Usa il nome della città nella query per filtrare i risultati
   * ✅ AGGIUNGE IL CAP nei suggerimenti tramite geocoding
   */
  getAddressSuggestionsNearLocation(
    input: string, 
    latitude: number, 
    longitude: number,
    cityName: string
  ): Observable<PlacePrediction[]> {
    return new Observable(observer => {
      if (!this.isGoogleMapsLoaded || !input || input.length < 2) {
        observer.next([]);
        observer.complete();
        return;
      }

      const request = {
        input: input,
        includedRegionCodes: ['it'],
        language: 'it'
      };

      console.log('🎯 Ricerca indirizzi in:', cityName, '- Input utente:', input);

      google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(request)
        .then(async (response: any) => {
          if (response.suggestions) {
            // ✅ FASE 1: Ottieni suggerimenti base
            const baseSuggestions = response.suggestions
              .filter((s: any) => s.placePrediction)
              .map((s: any) => {
                const prediction = s.placePrediction;
                const fullText = prediction.text?.text || '';
                const parts = fullText.split(',').map((p: string) => p.trim());
                const mainText = parts[0] || fullText;
                const secondaryText = parts.slice(1).join(', ');

                return {
                  description: fullText,
                  place_id: prediction.placeId || '',
                  structured_formatting: {
                    main_text: mainText,
                    secondary_text: secondaryText
                  }
                };
              });

            // ✅ FASE 2: Filtra per città
            const cityFilteredResults = baseSuggestions.filter((result: PlacePrediction) => {
              const secondaryLower = result.structured_formatting.secondary_text.toLowerCase();
              const cityLower = cityName.toLowerCase();
              const parts = secondaryLower.split(',').map((p: string) => p.trim());
              return parts.some((part: string) => part === cityLower);
            });

            console.log(`📍 Trovati ${baseSuggestions.length} risultati totali → ${cityFilteredResults.length} validi per ${cityName}`);

            // ✅ FASE 3: Arricchisci con CAP tramite geocoding (in parallelo)
            const enrichedPromises = cityFilteredResults.map(async (result: PlacePrediction) => {
              try {
                console.log(`🔍 Tentativo geocoding per: ${result.structured_formatting.main_text} (place_id: ${result.place_id})`);
                
                // Geocoding per ottenere il CAP
                let geocodeResult = await this.geocodePlaceIdWithPostalCode(result.place_id);
                
                // ✅ FALLBACK 1: Se il place_id non ha il CAP, prova a geocodare l'indirizzo completo
                if (!geocodeResult || !geocodeResult.postalCode) {
                  console.log(`🔄 Tentativo fallback 1: geocoding indirizzo completo per ${result.description}`);
                  geocodeResult = await this.geocodeAddressForPostalCode(result.description);
                }
                
                // ✅ FALLBACK 2: Se ancora non c'è il CAP, usa il CAP della città
                if (!geocodeResult || !geocodeResult.postalCode) {
                  console.log(`🔄 Tentativo fallback 2: geocoding città ${cityName}`);
                  geocodeResult = await this.geocodeAddressForPostalCode(cityName + ', Italia');
                }
                
                console.log(`📦 Risultato geocoding:`, geocodeResult);
                
                if (geocodeResult && geocodeResult.postalCode) {
                  // Ricostruisci il secondary_text con il CAP
                  const parts = result.structured_formatting.secondary_text.split(',').map((p: string) => p.trim());
                  
                  // Inserisci il CAP dopo la provincia (NA) e prima di "Italia"
                  const newParts: string[] = [];
                  let postalCodeInserted = false;
                  
                  parts.forEach((part: string, index: number) => {
                    newParts.push(part);
                    // Inserisci CAP dopo la provincia (es: "NA")
                    if (part.length === 2 && part === part.toUpperCase() && !postalCodeInserted) {
                      newParts.push(geocodeResult.postalCode);
                      postalCodeInserted = true;
                    }
                  });
                  
                  // Se il CAP non è stato inserito, aggiungilo prima di "Italia"
                  if (!postalCodeInserted) {
                    const italiaIndex = newParts.findIndex((p: string) => p.toLowerCase() === 'italia');
                    if (italiaIndex > 0) {
                      newParts.splice(italiaIndex, 0, geocodeResult.postalCode);
                    } else {
                      newParts.push(geocodeResult.postalCode);
                    }
                  }
                  
                  result.structured_formatting.secondary_text = newParts.join(', ');
                  console.log(`✅ CAP aggiunto per: ${result.structured_formatting.main_text} → ${result.structured_formatting.secondary_text}`);
                } else {
                  console.warn(`⚠️ CAP non disponibile per: ${result.structured_formatting.main_text} - Lasciato senza CAP`);
                }
              } catch (error) {
                console.error('❌ Errore geocoding per:', result.description, error);
              }
              
              return result;
            });

            // Attendi che tutti i geocoding siano completati
            const enrichedResults = await Promise.all(enrichedPromises);
            
            console.log(`📮 Suggerimenti arricchiti con CAP: ${enrichedResults.length}`);
            observer.next(enrichedResults);
          } else {
            console.log('⚠️ Nessun indirizzo trovato');
            observer.next([]);
          }
          observer.complete();
        })
        .catch((error: any) => {
          console.error('❌ Errore getAddressSuggestionsNearLocation:', error);
          observer.next([]);
          observer.complete();
        });
    });
  }

  /**
   * Geocoding di un place_id che restituisce anche il CAP
   */
  private geocodePlaceIdWithPostalCode(placeId: string): Promise<{ postalCode: string } | null> {
    return new Promise((resolve) => {
      if (!this.isGoogleMapsLoaded || !placeId) {
        resolve(null);
        return;
      }

      this.geocoder.geocode(
        { placeId: placeId },
        (results: any[], status: string) => {
          if (status === 'OK' && results && results.length > 0) {
            const result = results[0];
            const addressComponents = result.address_components;
            let postalCode = '';

            // Cerca il CAP nei componenti dell'indirizzo
            addressComponents.forEach((component: any) => {
              if (component.types.includes('postal_code')) {
                postalCode = component.long_name;
              }
            });

            if (postalCode) {
              resolve({ postalCode });
            } else {
              resolve(null);
            }
          } else {
            resolve(null);
          }
        }
      );
    });
  }

  /**
   * Geocoding di un indirizzo completo per ottenere il CAP
   */
  private geocodeAddressForPostalCode(address: string): Promise<{ postalCode: string } | null> {
    return new Promise((resolve) => {
      if (!this.isGoogleMapsLoaded || !address) {
        resolve(null);
        return;
      }

      this.geocoder.geocode(
        { address: address },
        (results: any[], status: string) => {
          if (status === 'OK' && results && results.length > 0) {
            const result = results[0];
            const addressComponents = result.address_components;
            let postalCode = '';

            // Cerca il CAP nei componenti dell'indirizzo
            addressComponents.forEach((component: any) => {
              if (component.types.includes('postal_code')) {
                postalCode = component.long_name;
              }
            });

            if (postalCode) {
              resolve({ postalCode });
            } else {
              resolve(null);
            }
          } else {
            resolve(null);
          }
        }
      );
    });
  }

  /**
   * Ottiene le coordinate geografiche da un indirizzo
   */
  geocodeAddress(address: string): Observable<GeocodingResult | null> {
    return new Observable(observer => {
      if (!this.isGoogleMapsLoaded || !address) {
        observer.next(null);
        observer.complete();
        return;
      }

      this.geocoder.geocode(
        { 
          address: address,
          componentRestrictions: { country: 'IT' }
        },
        (results: any[], status: string) => {
          if (status === 'OK' && results && results.length > 0) {
            const result = results[0];
            const location = result.geometry.location;
            
            // Estrai i componenti dell'indirizzo
            const addressComponents = result.address_components;
            let city = '';
            let province = '';
            let region = '';
            let country = '';

            addressComponents.forEach((component: any) => {
              const types = component.types;
              if (types.includes('locality')) {
                city = component.long_name;
              } else if (types.includes('administrative_area_level_2')) {
                province = component.short_name;
              } else if (types.includes('administrative_area_level_1')) {
                region = component.long_name;
              } else if (types.includes('country')) {
                country = component.long_name;
              }
            });

            const geocodingResult: GeocodingResult = {
              address: result.formatted_address,
              city: city,
              province: province,
              region: region,
              country: country,
              latitude: location.lat(),
              longitude: location.lng(),
              formatted_address: result.formatted_address
            };

            observer.next(geocodingResult);
          } else {
            observer.next(null);
          }
          observer.complete();
        }
      );
    });
  }

  /**
   * Ottiene le coordinate da un place_id
   */
  geocodePlaceId(placeId: string): Observable<GeocodingResult | null> {
    return new Observable(observer => {
      if (!this.isGoogleMapsLoaded || !placeId) {
        observer.next(null);
        observer.complete();
        return;
      }

      this.geocoder.geocode(
        { placeId: placeId },
        (results: any[], status: string) => {
          if (status === 'OK' && results && results.length > 0) {
            const result = results[0];
            const location = result.geometry.location;
            
            const addressComponents = result.address_components;
            let city = '';
            let province = '';
            let region = '';
            let country = '';

            addressComponents.forEach((component: any) => {
              const types = component.types;
              if (types.includes('locality')) {
                city = component.long_name;
              } else if (types.includes('administrative_area_level_2')) {
                province = component.short_name;
              } else if (types.includes('administrative_area_level_1')) {
                region = component.long_name;
              } else if (types.includes('country')) {
                country = component.long_name;
              }
            });

            const geocodingResult: GeocodingResult = {
              address: result.formatted_address,
              city: city,
              province: province,
              region: region,
              country: country,
              latitude: location.lat(),
              longitude: location.lng(),
              formatted_address: result.formatted_address
            };

            observer.next(geocodingResult);
          } else {
            observer.next(null);
          }
          observer.complete();
        }
      );
    });
  }

  /**
   * Calcola la distanza tra due coordinate geografiche (in km)
   */
  calculateDistance(
    lat1: number, 
    lng1: number, 
    lat2: number, 
    lng2: number
  ): number {
    if (!this.isGoogleMapsLoaded) {
      return 0;
    }

    const point1 = new google.maps.LatLng(lat1, lng1);
    const point2 = new google.maps.LatLng(lat2, lng2);
    
    // Distanza in metri
    const distanceInMeters = google.maps.geometry.spherical.computeDistanceBetween(point1, point2);
    
    // Converti in km
    return distanceInMeters / 1000;
  }

  /**
   * Ottiene l'indirizzo da coordinate geografiche (reverse geocoding)
   */
  reverseGeocode(latitude: number, longitude: number): Observable<GeocodingResult | null> {
    return new Observable(observer => {
      if (!this.isGoogleMapsLoaded) {
        observer.next(null);
        observer.complete();
        return;
      }

      const latlng = { lat: latitude, lng: longitude };

      this.geocoder.geocode(
        { location: latlng },
        (results: any[], status: string) => {
          if (status === 'OK' && results && results.length > 0) {
            const result = results[0];
            
            const addressComponents = result.address_components;
            let city = '';
            let province = '';
            let region = '';
            let country = '';

            addressComponents.forEach((component: any) => {
              const types = component.types;
              if (types.includes('locality')) {
                city = component.long_name;
              } else if (types.includes('administrative_area_level_2')) {
                province = component.short_name;
              } else if (types.includes('administrative_area_level_1')) {
                region = component.long_name;
              } else if (types.includes('country')) {
                country = component.long_name;
              }
            });

            const geocodingResult: GeocodingResult = {
              address: result.formatted_address,
              city: city,
              province: province,
              region: region,
              country: country,
              latitude: latitude,
              longitude: longitude,
              formatted_address: result.formatted_address
            };

            observer.next(geocodingResult);
          } else {
            observer.next(null);
          }
          observer.complete();
        }
      );
    });
  }
}
