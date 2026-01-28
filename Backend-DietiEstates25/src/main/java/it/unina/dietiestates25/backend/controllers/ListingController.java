package it.unina.dietiestates25.backend.controllers;

import it.unina.dietiestates25.backend.dto.listing.ListingFilterRequest;
import it.unina.dietiestates25.backend.dto.listing.ListingResponse;
import it.unina.dietiestates25.backend.services.ListingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/listings")
public class ListingController {

    private final ListingService listingService;

    public ListingController(ListingService listingService) {
        this.listingService = listingService;
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
}
