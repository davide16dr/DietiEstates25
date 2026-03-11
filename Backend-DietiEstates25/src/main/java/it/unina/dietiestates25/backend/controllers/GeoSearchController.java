package it.unina.dietiestates25.backend.controllers;

import it.unina.dietiestates25.backend.dto.listing.ListingResponseDto;
import it.unina.dietiestates25.backend.services.GoogleGeocodingService;
import it.unina.dietiestates25.backend.services.ListingService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/geo-search")
@Slf4j
public class GeoSearchController {

    private final GoogleGeocodingService geocodingService;
    private final ListingService listingService;

    @Autowired
    public GeoSearchController(GoogleGeocodingService geocodingService, ListingService listingService) {
        this.geocodingService = geocodingService;
        this.listingService = listingService;
    }

    /**
     * Cerca immobili vicino a un indirizzo specifico
     * 
     * @param address Indirizzo da cercare (es: "Via Roma 123, Napoli")
     * @param radiusKm Raggio di ricerca in km (default: 2km)
     * @return Lista di immobili nelle vicinanze con distanze
     */
    @GetMapping("/nearby")
    public ResponseEntity<Map<String, Object>> searchNearbyProperties(
            @RequestParam String address,
            @RequestParam(defaultValue = "2.0") double radiusKm,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Integer priceMin,
            @RequestParam(required = false) Integer priceMax) {
        
        log.info("🔍 Ricerca immobili vicino a: '{}' (raggio: {}km)", address, radiusKm);

        // Step 1: Geocoding dell'indirizzo
        GoogleGeocodingService.BoundsResult bounds = geocodingService.getBoundsForAddress(address, radiusKm);
        
        if (bounds == null) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Indirizzo non trovato");
            errorResponse.put("message", "Impossibile trovare le coordinate per l'indirizzo fornito");
            return ResponseEntity.badRequest().body(errorResponse);
        }

        // Step 2: Cerca immobili nel rettangolo di bounds
        List<ListingResponseDto> nearbyListings = listingService.findListingsInBounds(
            bounds.minLat(),
            bounds.maxLat(),
            bounds.minLng(),
            bounds.maxLng(),
            type,
            priceMin,
            priceMax
        );

        // Step 3: Calcola la distanza per ogni immobile e filtra per raggio esatto
        List<Map<String, Object>> listingsWithDistance = nearbyListings.stream()
            .map(listing -> {
                double distance = geocodingService.calculateDistance(
                    bounds.centerLat(),
                    bounds.centerLng(),
                    listing.getProperty().getLatitude().doubleValue(),
                    listing.getProperty().getLongitude().doubleValue()
                );
                
                Map<String, Object> result = new HashMap<>();
                result.put("listing", listing);
                result.put("distanceKm", Math.round(distance * 100.0) / 100.0); // Arrotonda a 2 decimali
                return result;
            })
            .filter(item -> (double) item.get("distanceKm") <= radiusKm) // Filtra per raggio esatto
            .sorted((a, b) -> Double.compare((double) a.get("distanceKm"), (double) b.get("distanceKm"))) // Ordina per distanza
            .toList();

        log.info("✅ Trovati {} immobili nel raggio di {}km", listingsWithDistance.size(), radiusKm);

        // Risposta
        Map<String, Object> response = new HashMap<>();
        response.put("searchAddress", bounds.formattedAddress());
        response.put("centerLat", bounds.centerLat());
        response.put("centerLng", bounds.centerLng());
        response.put("radiusKm", radiusKm);
        response.put("totalResults", listingsWithDistance.size());
        response.put("results", listingsWithDistance);

        return ResponseEntity.ok(response);
    }

    /**
     * Geocodifica un indirizzo (converte in coordinate)
     * Utile per il frontend per mostrare il punto sulla mappa
     */
    @GetMapping("/geocode")
    public ResponseEntity<GoogleGeocodingService.GeocodingResult> geocodeAddress(@RequestParam String address) {
        log.info("🌍 Geocoding indirizzo: '{}'", address);
        
        GoogleGeocodingService.GeocodingResult result = geocodingService.geocodeAddress(address);
        
        if (result == null) {
            return ResponseEntity.badRequest().build();
        }
        
        return ResponseEntity.ok(result);
    }
}
