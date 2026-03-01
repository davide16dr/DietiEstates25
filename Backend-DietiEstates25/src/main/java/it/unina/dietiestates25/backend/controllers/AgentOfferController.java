package it.unina.dietiestates25.backend.controllers;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import it.unina.dietiestates25.backend.dto.offer.CounterOfferRequest;
import it.unina.dietiestates25.backend.dto.offer.OfferResponse;
import it.unina.dietiestates25.backend.dto.offer.OfferStatsResponse;
import it.unina.dietiestates25.backend.dto.offer.RejectOfferRequest;
import it.unina.dietiestates25.backend.security.UserPrincipal;
import it.unina.dietiestates25.backend.services.OfferService;

@RestController
@RequestMapping("/api/agent")
public class AgentOfferController {

    private final OfferService offerService;

    public AgentOfferController(OfferService offerService) {
        this.offerService = offerService;
    }

    /**
     * Get all offers for properties managed by this agent
     */
    @GetMapping("/offers")
    public ResponseEntity<List<OfferResponse>> getAgentOffers(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<OfferResponse> offers = offerService.getAgentOffers(principal.getId());
        return ResponseEntity.ok(offers);
    }

    /**
     * Get offers for a specific property
     */
    @GetMapping("/properties/{propertyId}/offers")
    public ResponseEntity<List<OfferResponse>> getPropertyOffers(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID propertyId) {
        try {
            List<OfferResponse> offers = offerService.getPropertyOffers(principal.getId(), propertyId);
            return ResponseEntity.ok(offers);
        } catch (RuntimeException e) {
            if (e.getMessage().contains("Unauthorized")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    /**
     * Accept an offer
     */
    @PatchMapping("/offers/{offerId}/accept")
    public ResponseEntity<Void> acceptOffer(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID offerId) {
        try {
            offerService.acceptOffer(principal.getId(), offerId);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            if (e.getMessage().contains("Unauthorized")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    /**
     * Reject an offer
     */
    @PatchMapping("/offers/{offerId}/reject")
    public ResponseEntity<Void> rejectOffer(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID offerId,
            @RequestBody(required = false) RejectOfferRequest request) {
        try {
            String reason = request != null ? request.getReason() : null;
            offerService.rejectOffer(principal.getId(), offerId, reason);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            if (e.getMessage().contains("Unauthorized")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    /**
     * Make a counter-offer
     */
    @PostMapping("/offers/{offerId}/counter")
    public ResponseEntity<Void> makeCounterOffer(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID offerId,
            @RequestBody CounterOfferRequest request) {
        try {
            offerService.makeCounterOffer(principal.getId(), offerId, request);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            if (e.getMessage().contains("Unauthorized")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    /**
     * Get offer statistics
     */
    @GetMapping("/offers/stats")
    public ResponseEntity<OfferStatsResponse> getOfferStats(
            @AuthenticationPrincipal UserPrincipal principal) {
        OfferStatsResponse stats = offerService.getOfferStats(principal.getId());
        return ResponseEntity.ok(stats);
    }
}
