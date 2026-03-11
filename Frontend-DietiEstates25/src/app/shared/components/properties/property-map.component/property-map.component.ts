import { Component, input, output, computed, signal, effect, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleMapsModule, MapInfoWindow, MapMarker } from '@angular/google-maps';
import { GoogleMapsLoaderService } from '../../../services/google-maps-loader.service';

export interface MapMarkerData {
  id: string;
  label: string;
  lat: number;
  lng: number;
  // ✅ AGGIUNTO: Dati per l'anteprima
  title?: string;
  address?: string;
  imageUrl?: string;
  rooms?: number;
  area?: number;
  dealType?: 'SALE' | 'RENT';
}

@Component({
  selector: 'app-property-map',
  standalone: true,
  imports: [CommonModule, GoogleMapsModule],
  templateUrl: './property-map.component.html',
  styleUrls: ['./property-map.component.scss'],
})
export class PropertyMapComponent {
  private mapsLoader = inject(GoogleMapsLoaderService);

  markers = input.required<MapMarkerData[]>();
  markerClick = output<string>();

  @ViewChild(MapInfoWindow) infoWindow!: MapInfoWindow;

  center = signal<google.maps.LatLngLiteral>({ lat: 45.4642, lng: 9.19 });
  zoom = signal(6);
  
  // ✅ Signal per verificare se Google Maps è caricato
  isGoogleMapsLoaded = signal(false);
  
  // ✅ Signal per tenere traccia del marker selezionato
  selectedMarker = signal<MapMarkerData | null>(null);

  mapOptions: google.maps.MapOptions = {
    mapTypeControl: false,
    fullscreenControl: false,
    streetViewControl: false,
    zoomControl: false,
    clickableIcons: false,
  };

  // ✅ AGGIUNTO: Effect per centrare automaticamente la mappa quando cambiano i marker
  constructor() {
    // ✅ Carica Google Maps dinamicamente usando il servizio
    this.mapsLoader.load().then(() => {
      this.isGoogleMapsLoaded.set(true);
    }).catch(error => {
      console.error('⚠️ Impossibile caricare Google Maps:', error);
    });
    
    effect(() => {
      const markers = this.markers();
      if (markers.length === 1) {
        // Se c'è un solo marker, centra la mappa su di esso
        this.center.set({ lat: markers[0].lat, lng: markers[0].lng });
        this.zoom.set(5); // ✅ Zoom minimo - mostra tutta la regione e zone limitrofe
      } else if (markers.length > 1) {
        // Se ci sono più marker, calcola il centro medio
        const avgLat = markers.reduce((sum, m) => sum + m.lat, 0) / markers.length;
        const avgLng = markers.reduce((sum, m) => sum + m.lng, 0) / markers.length;
        this.center.set({ lat: avgLat, lng: avgLng });
        this.zoom.set(8); // ✅ Zoom ridotto per più marker
      }
    });
  }

  toGMarkerOptions(label: string): google.maps.MarkerOptions {
    return {
      label: {
        text: label,
        color: '#111827',
        fontWeight: '800',
      },
    };
  }

  onZoomIn() { this.zoom.set(this.zoom() + 1); }
  onZoomOut() { this.zoom.set(this.zoom() - 1); }

  fitToMarkers(map: google.maps.Map) {
    if (!this.markers().length) return;
    const bounds = new google.maps.LatLngBounds();
    this.markers().forEach(m => bounds.extend({ lat: m.lat, lng: m.lng }));
    map.fitBounds(bounds);
  }

  onMapReady(map: google.maps.Map) {
    this.fitToMarkers(map);
  }

  // ✅ Metodo per aprire l'InfoWindow quando clicchi su un marker
  openInfoWindow(marker: MapMarkerData, mapMarker: MapMarker) {
    this.selectedMarker.set(marker);
    this.infoWindow.open(mapMarker);
  }

  // ✅ Metodo per navigare alla pagina di dettaglio
  openPropertyDetail() {
    const marker = this.selectedMarker();
    console.log('openPropertyDetail chiamato', marker);
    if (marker) {
      console.log('Emetto evento markerClick con ID:', marker.id);
      this.markerClick.emit(marker.id);
    } else {
      console.log('Nessun marker selezionato!');
    }
  }
}
