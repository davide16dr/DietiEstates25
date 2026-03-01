package it.unina.dietiestates25.backend.controllers;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import it.unina.dietiestates25.backend.dto.listing.ListingFilterRequest;
import it.unina.dietiestates25.backend.dto.listing.ListingResponse;
import it.unina.dietiestates25.backend.entities.User;
import it.unina.dietiestates25.backend.services.ListingService;

@RestController
@RequestMapping("/api/listings")
public class ListingController {

    private final ListingService listingService;

    public ListingController(ListingService listingService) {
        this.listingService = listingService;
    }

    @GetMapping("/agent/my-listings")
    public ResponseEntity<List<ListingResponse>> getMyListings(Authentication authentication) {
        System.out.println("Authentication: " + authentication);
        System.out.println("Principal: " + (authentication != null ? authentication.getPrincipal() : "null"));
        
        if (authentication == null || authentication.getPrincipal() == null) {
            return ResponseEntity.status(401).build();
        }
        
        // Estrai l'ID dell'utente dal UserPrincipal
        var principal = authentication.getPrincipal();
        java.util.UUID agentId = null;
        
        if (principal instanceof it.unina.dietiestates25.backend.security.UserPrincipal) {
            agentId = ((it.unina.dietiestates25.backend.security.UserPrincipal) principal).getId();
        } else {
            return ResponseEntity.status(400).build();
        }
        
        if (agentId == null) {
            return ResponseEntity.status(400).build();
        }
        
        System.out.println("Recupero proprietà per agentId: " + agentId);
        List<ListingResponse> listings = listingService.getListingsByAgentId(agentId);
        return ResponseEntity.ok(listings);
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
            @RequestBody it.unina.dietiestates25.backend.dto.listing.CreateListingRequest request) {
        
        System.out.println("=== CREATE LISTING REQUEST ===");
        System.out.println("Request body: " + request);
        System.out.println("Request listing: " + (request.getListing() != null ? request.getListing() : "null"));
        System.out.println("Request listing type: " + (request.getListing() != null ? request.getListing().getType() : "null"));
        System.out.println("Request property: " + (request.getProperty() != null ? request.getProperty() : "null"));
        System.out.println("==============================");
        
        if (authentication == null || authentication.getPrincipal() == null) {
            return ResponseEntity.status(401).build();
        }
        
        var principal = authentication.getPrincipal();
        java.util.UUID agentId = null;
        
        if (principal instanceof it.unina.dietiestates25.backend.security.UserPrincipal) {
            agentId = ((it.unina.dietiestates25.backend.security.UserPrincipal) principal).getId();
        } else {
            return ResponseEntity.status(400).build();
        }
        
        try {
            ListingResponse response = listingService.createListingWithProperty(agentId, request);
            return ResponseEntity.status(201).body(response);
        } catch (IllegalArgumentException e) {
            System.err.println("Errore durante la creazione dell'annuncio: " + e.getMessage());
            return ResponseEntity.status(400).body(null);
        } catch (Exception e) {
            System.err.println("Errore inaspettato durante la creazione dell'annuncio: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(null);
        }
    }
}
