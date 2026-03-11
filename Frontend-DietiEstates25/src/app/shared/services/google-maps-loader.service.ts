import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GoogleMapsLoaderService {
  private static promise: Promise<void> | null = null;

  load(): Promise<void> {
    // Se già caricato, ritorna la promise esistente
    if (GoogleMapsLoaderService.promise) {
      return GoogleMapsLoaderService.promise;
    }

    // Se google.maps è già disponibile, risolvi immediatamente
    if (typeof google !== 'undefined' && google.maps) {
      return Promise.resolve();
    }

    // Altrimenti carica lo script con callback
    GoogleMapsLoaderService.promise = new Promise((resolve, reject) => {
      // ✅ Crea una funzione callback globale
      const callbackName = 'initGoogleMaps';
      (window as any)[callbackName] = () => {
        console.log('✅ Google Maps caricato con successo');
        delete (window as any)[callbackName];
        resolve();
      };

      const script = document.createElement('script');
      // ✅ Usa callback invece di loading=async
      script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&libraries=places,geometry&callback=${callbackName}`;
      script.async = true;
      script.defer = true;
      
      script.onerror = () => {
        console.error('❌ Errore caricamento Google Maps');
        delete (window as any)[callbackName];
        reject(new Error('Failed to load Google Maps'));
      };
      
      document.head.appendChild(script);
    });

    return GoogleMapsLoaderService.promise;
  }
}
