package it.unina.dietiestates25.backend.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class GoogleGeocodingService {

    @Value("${app.google.maps.api-key}")
    private String apiKey;

    private final RestTemplate restTemplate;
    private static final String GEOCODING_API_URL = "https://maps.googleapis.com/maps/api/geocode/json";

    public GoogleGeocodingService() {
        this.restTemplate = new RestTemplate();
    }

    /**
     * Converte un indirizzo in coordinate geografiche (lat, lng)
     */
    public GeocodingResult geocodeAddress(String address) {
        if (address == null || address.trim().isEmpty()) {
            log.warn("Indirizzo vuoto fornito al geocoding");
            return null;
        }

        try {
            String url = UriComponentsBuilder.fromHttpUrl(GEOCODING_API_URL)
                    .queryParam("address", address)
                    .queryParam("key", apiKey)
                    .queryParam("language", "it")
                    .queryParam("region", "IT")
                    .toUriString();

            log.info("🌍 Chiamata Google Geocoding API per indirizzo: {}", address);

            Map<String, Object> response = restTemplate.getForObject(url, Map.class);

            if (response == null) {
                log.error("Risposta nulla da Google Geocoding API");
                return null;
            }

            String status = (String) response.get("status");
            
            if (!"OK".equals(status)) {
                log.warn("Google Geocoding API status non OK: {} per indirizzo: {}", status, address);
                return null;
            }

            List<Map<String, Object>> results = (List<Map<String, Object>>) response.get("results");
            
            if (results == null || results.isEmpty()) {
                log.warn("Nessun risultato da Google Geocoding API per: {}", address);
                return null;
            }

            // Prendi il primo risultato (il più rilevante)
            Map<String, Object> firstResult = results.get(0);
            Map<String, Object> geometry = (Map<String, Object>) firstResult.get("geometry");
            Map<String, Object> location = (Map<String, Object>) geometry.get("location");
            
            double lat = ((Number) location.get("lat")).doubleValue();
            double lng = ((Number) location.get("lng")).doubleValue();
            String formattedAddress = (String) firstResult.get("formatted_address");

            log.info("✅ Geocoding completato: {} → lat={}, lng={}", address, lat, lng);

            return new GeocodingResult(lat, lng, formattedAddress);

        } catch (Exception e) {
            log.error("❌ Errore durante geocoding per indirizzo '{}': {}", address, e.getMessage(), e);
            return null;
        }
    }

    /**
     * Trova immobili nelle vicinanze di un indirizzo specifico
     * Restituisce le coordinate per poi filtrare nel database
     */
    public BoundsResult getBoundsForAddress(String address, double radiusKm) {
        GeocodingResult geocoding = geocodeAddress(address);
        
        if (geocoding == null) {
            return null;
        }

        // Calcola i bounds (rettangolo) basato sul raggio in km
        // 1 grado di latitudine ≈ 111 km
        // 1 grado di longitudine ≈ 111 km * cos(latitudine)
        
        double latDelta = radiusKm / 111.0;
        double lngDelta = radiusKm / (111.0 * Math.cos(Math.toRadians(geocoding.latitude())));

        double minLat = geocoding.latitude() - latDelta;
        double maxLat = geocoding.latitude() + latDelta;
        double minLng = geocoding.longitude() - lngDelta;
        double maxLng = geocoding.longitude() + lngDelta;

        log.info("📍 Bounds calcolati per raggio {}km: lat[{}, {}], lng[{}, {}]", 
                radiusKm, minLat, maxLat, minLng, maxLng);

        return new BoundsResult(
            geocoding.latitude(),
            geocoding.longitude(),
            minLat,
            maxLat,
            minLng,
            maxLng,
            geocoding.formattedAddress()
        );
    }

    /**
     * Calcola la distanza tra due coordinate (in km) usando la formula di Haversine
     */
    public double calculateDistance(double lat1, double lng1, double lat2, double lng2) {
        final double R = 6371; // Raggio della Terra in km

        double latDistance = Math.toRadians(lat2 - lat1);
        double lngDistance = Math.toRadians(lng2 - lng1);
        
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lngDistance / 2) * Math.sin(lngDistance / 2);
        
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return R * c; // Distanza in km
    }

    // Record per il risultato del geocoding
    public record GeocodingResult(
        double latitude,
        double longitude,
        String formattedAddress
    ) {}

    // Record per i bounds di ricerca
    public record BoundsResult(
        double centerLat,
        double centerLng,
        double minLat,
        double maxLat,
        double minLng,
        double maxLng,
        String formattedAddress
    ) {}
}
