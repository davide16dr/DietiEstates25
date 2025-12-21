import { Component, input, output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleMapsModule, MapInfoWindow } from '@angular/google-maps';

export interface MapMarkerData {
  id: string;
  label: string;
  lat: number;
  lng: number;
}

@Component({
  selector: 'app-property-map',
  standalone: true,
  imports: [CommonModule, GoogleMapsModule],
  templateUrl: './property-map.component.html',
  styleUrls: ['./property-map.component.scss'],
})
export class PropertyMapComponent {
  markers = input.required<MapMarkerData[]>();
  markerClick = output<string>();

  center = signal<google.maps.LatLngLiteral>({ lat: 45.4642, lng: 9.19 });
  zoom = signal(12);

  mapOptions: google.maps.MapOptions = {
    mapTypeControl: false,
    fullscreenControl: false,
    streetViewControl: false,
    zoomControl: false,
    clickableIcons: false,
  };

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
}
