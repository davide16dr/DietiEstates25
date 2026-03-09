package it.unina.dietiestates25.backend.controllers;

import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import it.unina.dietiestates25.backend.dto.visit.CreateVisitRequest;
import it.unina.dietiestates25.backend.dto.visit.VisitResponse;
import it.unina.dietiestates25.backend.security.UserPrincipal;
import it.unina.dietiestates25.backend.services.VisitService;

@RestController
@RequestMapping("/api/client/visits")
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class ClientVisitController {
    
    private final VisitService visitService;

    public ClientVisitController(VisitService visitService) {
        this.visitService = visitService;
    }

    /**
     * Get all visits for the current client
     */
    @GetMapping
    public ResponseEntity<List<VisitResponse>> getMyVisits(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<VisitResponse> visits = visitService.getClientVisits(principal.getId());
        return ResponseEntity.ok(visits);
    }

    /**
     * Get available time slots for a listing on a specific date
     * Returns the list of occupied time slots (in HH:mm format)
     */
    @GetMapping("/available-slots")
    public ResponseEntity<List<String>> getAvailableTimeSlots(
            @RequestParam String listingId,
            @RequestParam String date) {
        try {
            UUID listingUuid = UUID.fromString(listingId);
            
            List<String> occupiedSlots = visitService.getOccupiedTimeSlots(listingUuid, date);
            return ResponseEntity.ok(occupiedSlots);
        } catch (IllegalArgumentException | DateTimeParseException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    /**
     * Get occupied time slots for a listing on a specific date
     * Returns the list of occupied time slots (in HH:mm format)
     */
    @GetMapping("/listings/{listingId}/occupied-timeslots")
    public ResponseEntity<List<String>> getOccupiedTimeSlots(
            @PathVariable UUID listingId,
            @RequestParam String date) {
        List<String> occupiedSlots = visitService.getOccupiedTimeSlots(listingId, date);
        return ResponseEntity.ok(occupiedSlots);
    }

    /**
     * Create a new visit request
     */
    @PostMapping
    public ResponseEntity<VisitResponse> createVisit(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody CreateVisitRequest request) {
        try {
            UUID listingId = UUID.fromString(request.getListingId());
            
            // Convert scheduledFor or build from date/time
            Instant scheduledFor = request.getScheduledFor();
            
            VisitResponse visit = visitService.createVisit(
                principal.getId(), 
                listingId, 
                scheduledFor, 
                request.getNotes()
            );
            
            return ResponseEntity.status(HttpStatus.CREATED).body(visit);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (RuntimeException e) {
            String msg = e.getMessage() != null ? e.getMessage() : "";
            if (msg.contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    /**
     * Cancel a visit
     */
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<Void> cancelVisit(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        try {
            visitService.cancelVisit(principal.getId(), id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            String msg = e.getMessage() != null ? e.getMessage() : "";
            if (msg.contains("Unauthorized")) {
                return ResponseEntity.status(403).build();
            }
            if (msg.contains("not found")) {
                return ResponseEntity.status(404).build();
            }
            return ResponseEntity.status(400).build();
        }
    }
}
