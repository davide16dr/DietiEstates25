package it.unina.dietiestates25.backend.controllers;

import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
import it.unina.dietiestates25.backend.dto.offer.OfferRequest;
import it.unina.dietiestates25.backend.dto.offer.OfferResponse;
import it.unina.dietiestates25.backend.security.UserPrincipal;
import it.unina.dietiestates25.backend.services.OfferService;

@RestController
@RequestMapping("/api/client/offers")
public class ClientOfferController {

    private static final String MSG_UNAUTHORIZED = "Unauthorized";
    private static final String MSG_NOT_FOUND = "not found";
    private static final String MSG_ACTIVE_OFFER = "already have an active offer";

    private static final Logger log = LoggerFactory.getLogger(ClientOfferController.class);
    private final OfferService offerService;

    public ClientOfferController(OfferService offerService) {
        this.offerService = offerService;
    }

    


    @PostMapping
    public ResponseEntity<OfferResponse> submitOffer(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody OfferRequest request) {
        try {
            log.info("📥 Ricevuta richiesta offerta da user: {}, propertyId: {}, amount: {}", 
                principal.getId(), request.getPropertyId(), request.getAmount());
            OfferResponse offer = offerService.submitOffer(principal.getId(), request);
            return ResponseEntity.status(HttpStatus.CREATED).body(offer);
        } catch (RuntimeException e) {
            log.error("❌ Errore invio offerta: {}", e.getMessage(), e);
            if (e.getMessage().contains(MSG_ACTIVE_OFFER)) {
                return ResponseEntity.status(HttpStatus.CONFLICT).build();
            }
            if (e.getMessage().contains(MSG_NOT_FOUND)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    


    @GetMapping
    public ResponseEntity<List<OfferResponse>> getMyOffers(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<OfferResponse> offers = offerService.getClientOffers(principal.getId());
        return ResponseEntity.ok(offers);
    }

    


    @PatchMapping("/{offerId}/accept-counter")
    public ResponseEntity<Void> acceptCounterOffer(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID offerId) {
        try {
            offerService.acceptCounterOffer(principal.getId(), offerId);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains(MSG_UNAUTHORIZED)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            if (e.getMessage() != null && e.getMessage().contains(MSG_NOT_FOUND)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    


    @PostMapping("/{offerId}/counter")
    public ResponseEntity<Void> submitCounter(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID offerId,
            @RequestBody CounterOfferRequest request) {
        try {
            offerService.submitCounterToCounter(principal.getId(), offerId, request);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains(MSG_UNAUTHORIZED)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            if (e.getMessage() != null && e.getMessage().contains(MSG_NOT_FOUND)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    


    @PatchMapping("/{offerId}/withdraw")
    public ResponseEntity<Void> withdrawOffer(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID offerId) {
        try {
            offerService.withdrawOffer(principal.getId(), offerId);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains(MSG_UNAUTHORIZED)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            if (e.getMessage() != null && e.getMessage().contains(MSG_NOT_FOUND)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
}
