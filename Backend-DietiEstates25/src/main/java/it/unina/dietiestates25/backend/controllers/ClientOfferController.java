package it.unina.dietiestates25.backend.controllers;

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
import org.springframework.web.bind.annotation.RestController;

import it.unina.dietiestates25.backend.dto.offer.CounterOfferRequest;
import it.unina.dietiestates25.backend.dto.offer.OfferRequest;
import it.unina.dietiestates25.backend.dto.offer.OfferResponse;
import it.unina.dietiestates25.backend.security.UserPrincipal;
import it.unina.dietiestates25.backend.services.OfferService;

@RestController
@RequestMapping("/api/client/offers")
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class ClientOfferController {

    private final OfferService offerService;

    public ClientOfferController(OfferService offerService) {
        this.offerService = offerService;
    }

    /**
     * Submit a new offer for a property
     */
    @PostMapping
    public ResponseEntity<OfferResponse> submitOffer(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody OfferRequest request) {
        try {
            OfferResponse offer = offerService.submitOffer(principal.getId(), request);
            return ResponseEntity.status(HttpStatus.CREATED).body(offer);
        } catch (RuntimeException e) {
            if (e.getMessage().contains("already have an active offer")) {
                return ResponseEntity.status(HttpStatus.CONFLICT).build();
            }
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    /**
     * Get all offers made by the current client
     */
    @GetMapping
    public ResponseEntity<List<OfferResponse>> getMyOffers(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<OfferResponse> offers = offerService.getClientOffers(principal.getId());
        return ResponseEntity.ok(offers);
    }

    /**
     * Accept a counter-offer from agent
     */
    @PatchMapping("/{offerId}/accept-counter")
    public ResponseEntity<Void> acceptCounterOffer(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID offerId) {
        try {
            offerService.acceptCounterOffer(principal.getId(), offerId);
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
     * Submit a counter to agent's counter-offer
     */
    @PostMapping("/{offerId}/counter")
    public ResponseEntity<Void> submitCounter(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID offerId,
            @RequestBody CounterOfferRequest request) {
        try {
            offerService.submitCounterToCounter(principal.getId(), offerId, request);
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
     * Withdraw an offer
     */
    @PatchMapping("/{offerId}/withdraw")
    public ResponseEntity<Void> withdrawOffer(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID offerId) {
        try {
            offerService.withdrawOffer(principal.getId(), offerId);
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
}
