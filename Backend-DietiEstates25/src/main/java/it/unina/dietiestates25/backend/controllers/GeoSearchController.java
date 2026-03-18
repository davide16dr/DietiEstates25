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

    private static final String KEY_ERROR = "error";
    private static final String KEY_MESSAGE = "message";
    private static final String KEY_DISTANCE_KM = "distanceKm";
    private static final String MSG_ADDRESS_NOT_FOUND = "Indirizzo non trovato";
    private static final String MSG_ADDRESS_NOT_FOUND_DETAIL = "Impossibile trovare le coordinate per l'indirizzo fornito";

    private final GoogleGeocodingService geocodingService;
    private final ListingService listingService;

    @Autowired
    public GeoSearchController(GoogleGeocodingService geocodingService, ListingService listingService) {
        this.geocodingService = geocodingService;
        this.listingService = listingService;
    }

    






    @GetMapping("/nearby")
    public ResponseEntity<Map<String, Object>> searchNearbyProperties(
            @RequestParam String address,
            @RequestParam(defaultValue = "2.0") double radiusKm,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Integer priceMin,
            @RequestParam(required = false) Integer priceMax) {
        
        log.info("🔍 Ricerca immobili vicino a: '{}' (raggio: {}km)", address, radiusKm);

        
        GoogleGeocodingService.BoundsResult bounds = geocodingService.getBoundsForAddress(address, radiusKm);
        
        if (bounds == null) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put(KEY_ERROR, MSG_ADDRESS_NOT_FOUND);
            errorResponse.put(KEY_MESSAGE, MSG_ADDRESS_NOT_FOUND_DETAIL);
            return ResponseEntity.badRequest().body(errorResponse);
        }

        
        List<ListingResponseDto> nearbyListings = listingService.findListingsInBounds(
            bounds.minLat(),
            bounds.maxLat(),
            bounds.minLng(),
            bounds.maxLng(),
            type,
            priceMin,
            priceMax
        );

        
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
                result.put(KEY_DISTANCE_KM, Math.round(distance * 100.0) / 100.0); 
                return result;
            })
            .filter(item -> (double) item.get(KEY_DISTANCE_KM) <= radiusKm) 
            .sorted((a, b) -> Double.compare((double) a.get(KEY_DISTANCE_KM), (double) b.get(KEY_DISTANCE_KM))) 
            .toList();

        log.info("✅ Trovati {} immobili nel raggio di {}km", listingsWithDistance.size(), radiusKm);

        
        Map<String, Object> response = new HashMap<>();
        response.put("searchAddress", bounds.formattedAddress());
        response.put("centerLat", bounds.centerLat());
        response.put("centerLng", bounds.centerLng());
        response.put("radiusKm", radiusKm);
        response.put("totalResults", listingsWithDistance.size());
        response.put("results", listingsWithDistance);

        return ResponseEntity.ok(response);
    }

    



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
