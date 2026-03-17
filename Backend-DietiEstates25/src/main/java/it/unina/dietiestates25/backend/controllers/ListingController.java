package it.unina.dietiestates25.backend.controllers;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import it.unina.dietiestates25.backend.dto.listing.ListingFilterRequest;
import it.unina.dietiestates25.backend.dto.listing.ListingResponse;
import it.unina.dietiestates25.backend.services.ListingService;
import it.unina.dietiestates25.backend.security.UserPrincipal;

@RestController
@RequestMapping("/api/listings")
public class ListingController {

    private static final Logger log = LoggerFactory.getLogger(ListingController.class);

    private final ListingService listingService;

    public ListingController(ListingService listingService) {
        this.listingService = listingService;
    }

    @GetMapping("/agent/my-listings")
    public ResponseEntity<List<ListingResponse>> getMyListings(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            return ResponseEntity.status(401).build();
        }

        var principal = authentication.getPrincipal();
        java.util.UUID agentId = null;

        if (principal instanceof UserPrincipal userPrincipal) {
            agentId = userPrincipal.getId();
        } else {
            return ResponseEntity.status(400).build();
        }

        if (agentId == null) {
            return ResponseEntity.status(400).build();
        }

        List<ListingResponse> listings = listingService.getListingsByAgentId(agentId);
        return ResponseEntity.ok(listings);
    }

    /**
     * Recupera tutti gli immobili dell'agenzia (per i manager)
     */
    @GetMapping("/agency/all")
    public ResponseEntity<List<ListingResponse>> getAllAgencyListings(Authentication authentication) {
        if (authentication == null || authentication.getPrincipal() == null) {
            return ResponseEntity.status(401).build();
        }

        var principal = authentication.getPrincipal();
        java.util.UUID userId = null;

        if (principal instanceof UserPrincipal userPrincipal) {
            userId = userPrincipal.getId();
        } else {
            return ResponseEntity.status(400).build();
        }

        try {
            List<ListingResponse> listings = listingService.getAllAgencyListings(userId);
            return ResponseEntity.ok(listings);
        } catch (Exception e) {
            log.error("Errore nel recupero immobili agenzia");
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping("/search")
    public ResponseEntity<List<ListingResponse>> searchListings(@RequestBody ListingFilterRequest filters) {
        List<ListingResponse> listings = listingService.getFilteredListings(filters);
        return ResponseEntity.ok(listings);
    }

    @GetMapping("/search")
    public ResponseEntity<List<ListingResponse>> searchListingsGet(
        @RequestParam(required = false) String type,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String city,
        @RequestParam(required = false) String propertyType,
        @RequestParam(required = false) Integer priceMin,
        @RequestParam(required = false) Integer priceMax,
        @RequestParam(required = false) Integer roomsMin,
        @RequestParam(required = false) Integer areaMin,
        @RequestParam(required = false) Integer areaMax,
        @RequestParam(required = false) String energyClass,
        @RequestParam(required = false) Boolean elevator
    ) {
        ListingFilterRequest filters = new ListingFilterRequest();
        
        // Converti i parametri stringa in enum se presenti
        if (type != null) {
            try {
                filters.setType(it.unina.dietiestates25.backend.entities.enums.ListingType.valueOf(type.toUpperCase()));
            } catch (IllegalArgumentException e) {
                // Ignora se non valido
            }
        }
        
        if (status != null) {
            try {
                filters.setStatus(it.unina.dietiestates25.backend.entities.enums.ListingStatus.valueOf(status.toUpperCase()));
            } catch (IllegalArgumentException e) {
                // Ignora se non valido
            }
        }
        
        filters.setCity(city);
        filters.setPropertyType(propertyType); // AGGIUNTO: imposta il tipo di proprietà
        filters.setPriceMin(priceMin);
        filters.setPriceMax(priceMax);
        filters.setRoomsMin(roomsMin);
        filters.setAreaMin(areaMin);
        filters.setAreaMax(areaMax);
        filters.setEnergyClass(energyClass);
        filters.setElevator(elevator);

        List<ListingResponse> listings = listingService.getFilteredListings(filters);
        return ResponseEntity.ok(listings);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ListingResponse> getListingById(@PathVariable("id") java.util.UUID id) {
        ListingResponse dto = listingService.getById(id);
        if (dto == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/agent/create")
    public ResponseEntity<ListingResponse> createListing(
            Authentication authentication,
            @RequestParam("property") String propertyJson,
            @RequestParam("listing") String listingJson,
            @RequestParam(value = "images", required = false) List<org.springframework.web.multipart.MultipartFile> images) {
        
        log.debug("Richiesta creazione listing, immagini: {}", (images != null ? images.size() : 0));

        if (authentication == null || authentication.getPrincipal() == null) {
            return ResponseEntity.status(401).build();
        }
        
        var principal = authentication.getPrincipal();
        java.util.UUID agentId = null;
        
        if (principal instanceof UserPrincipal userPrincipal) {
            agentId = userPrincipal.getId();
        } else {
            return ResponseEntity.status(400).build();
        }
        
        try {
            // Parse JSON strings to objects
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            it.unina.dietiestates25.backend.dto.listing.CreateListingRequest.PropertyRequest property = 
                mapper.readValue(propertyJson, it.unina.dietiestates25.backend.dto.listing.CreateListingRequest.PropertyRequest.class);
            it.unina.dietiestates25.backend.dto.listing.CreateListingRequest.ListingRequest listing = 
                mapper.readValue(listingJson, it.unina.dietiestates25.backend.dto.listing.CreateListingRequest.ListingRequest.class);
            
            // Crea il request object
            it.unina.dietiestates25.backend.dto.listing.CreateListingRequest request = 
                new it.unina.dietiestates25.backend.dto.listing.CreateListingRequest(property, listing);
            
            // Crea il listing con le immagini
            ListingResponse response = listingService.createListingWithProperty(agentId, request, images);
            return ResponseEntity.status(201).body(response);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            log.warn("Errore parsing JSON nella creazione listing");
            return ResponseEntity.status(400).body(null);
        } catch (IllegalArgumentException e) {
            log.warn("Argomento non valido nella creazione listing");
            return ResponseEntity.status(400).body(null);
        } catch (Exception e) {
            log.error("Errore inaspettato nella creazione listing");
            return ResponseEntity.status(500).body(null);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ListingResponse> updateListing(
            @PathVariable("id") java.util.UUID id,
            Authentication authentication,
            @RequestParam(value = "property", required = false) String propertyJson,
            @RequestParam(value = "listing", required = false) String listingJson,
            @RequestParam(value = "existingImageUrls", required = false) String existingImageUrlsJson,
            @RequestParam(value = "images", required = false) List<org.springframework.web.multipart.MultipartFile> images) {
        
        log.debug("Richiesta aggiornamento listing: {}", id);

        if (authentication == null || authentication.getPrincipal() == null) {
            return ResponseEntity.status(401).build();
        }
        
        var principal = authentication.getPrincipal();
        java.util.UUID userId = null;
        
        if (principal instanceof UserPrincipal userPrincipal) {
            userId = userPrincipal.getId();
        } else {
            return ResponseEntity.status(400).build();
        }
        
        try {
            // Parse JSON strings to objects
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            
            it.unina.dietiestates25.backend.dto.listing.UpdateListingRequest.PropertyUpdate property = null;
            it.unina.dietiestates25.backend.dto.listing.UpdateListingRequest.ListingUpdate listing = null;
            List<String> existingImageUrls = null;
            
            if (propertyJson != null) {
                property = mapper.readValue(propertyJson, it.unina.dietiestates25.backend.dto.listing.UpdateListingRequest.PropertyUpdate.class);
            }
            
            if (listingJson != null) {
                listing = mapper.readValue(listingJson, it.unina.dietiestates25.backend.dto.listing.UpdateListingRequest.ListingUpdate.class);
            }
            
            if (existingImageUrlsJson != null) {
                existingImageUrls = mapper.readValue(existingImageUrlsJson,
                    mapper.getTypeFactory().constructCollectionType(List.class, String.class));
            }
            
            // Crea il request object
            it.unina.dietiestates25.backend.dto.listing.UpdateListingRequest request = 
                new it.unina.dietiestates25.backend.dto.listing.UpdateListingRequest(property, listing);
            
            // ✅ IMPORTANTE: Aggiorna il listing con le immagini
            ListingResponse response = listingService.updateListingWithImages(id, userId, request, existingImageUrls, images);
            return ResponseEntity.ok(response);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            log.warn("Errore parsing JSON nell'aggiornamento listing");
            return ResponseEntity.status(400).body(null);
        } catch (IllegalArgumentException e) {
            log.warn("Argomento non valido nell'aggiornamento listing");
            return ResponseEntity.status(400).body(null);
        } catch (SecurityException e) {
            log.warn("Accesso negato nell'aggiornamento listing");
            return ResponseEntity.status(403).body(null);
        } catch (Exception e) {
            log.error("Errore inaspettato nell'aggiornamento listing");
            return ResponseEntity.status(500).body(null);
        }
    }
}
