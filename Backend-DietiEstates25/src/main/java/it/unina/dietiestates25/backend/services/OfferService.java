package it.unina.dietiestates25.backend.services;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import it.unina.dietiestates25.backend.dto.offer.CounterOfferRequest;
import it.unina.dietiestates25.backend.dto.offer.OfferRequest;
import it.unina.dietiestates25.backend.dto.offer.OfferResponse;
import it.unina.dietiestates25.backend.dto.offer.OfferStatsResponse;
import it.unina.dietiestates25.backend.entities.Listing;
import it.unina.dietiestates25.backend.entities.Offer;
import it.unina.dietiestates25.backend.entities.OfferStatusHistory;
import it.unina.dietiestates25.backend.entities.User;
import it.unina.dietiestates25.backend.entities.enums.OfferStatus;
import it.unina.dietiestates25.backend.repositories.ListingRepository;
import it.unina.dietiestates25.backend.repositories.OfferRepository;
import it.unina.dietiestates25.backend.repositories.OfferStatusHistoryRepository;
import it.unina.dietiestates25.backend.repositories.UserRepository;

@Service
public class OfferService {

    private final OfferRepository offerRepository;
    private final OfferStatusHistoryRepository offerStatusHistoryRepository;
    private final ListingRepository listingRepository;
    private final UserRepository userRepository;

    public OfferService(
            OfferRepository offerRepository,
            OfferStatusHistoryRepository offerStatusHistoryRepository,
            ListingRepository listingRepository,
            UserRepository userRepository) {
        this.offerRepository = offerRepository;
        this.offerStatusHistoryRepository = offerStatusHistoryRepository;
        this.listingRepository = listingRepository;
        this.userRepository = userRepository;
    }

    // ============ CLIENT OPERATIONS ============

    @Transactional
    public OfferResponse submitOffer(UUID clientId, OfferRequest request) {
        // Validate listing exists
        Listing listing = listingRepository.findById(request.getPropertyId())
                .orElseThrow(() -> new RuntimeException("Listing not found"));

        // Get client
        User client = userRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Client not found"));

        // Check if client already has an active offer for this listing
        List<Offer> existingOffers = offerRepository.findAllByListing_IdAndClient_Id(
            listing.getId(), clientId);
        
        boolean hasActiveOffer = existingOffers.stream()
            .anyMatch(o -> o.getStatus() == OfferStatus.SUBMITTED || 
                          o.getStatus() == OfferStatus.COUNTEROFFER);
        
        if (hasActiveOffer) {
            throw new RuntimeException("You already have an active offer for this property");
        }

        // Create offer
        Offer offer = new Offer();
        offer.setListing(listing);
        offer.setClient(client);
        offer.setAmount(request.getAmount());
        offer.setCurrency("EUR");
        offer.setMessage(request.getMessage());
        offer.setStatus(OfferStatus.SUBMITTED);

        offer = offerRepository.save(offer);

        // Create status history
        createStatusHistory(offer, OfferStatus.SUBMITTED, "Offer submitted by client");

        return mapToResponse(offer);
    }

    public List<OfferResponse> getClientOffers(UUID clientId) {
        List<Offer> offers = offerRepository.findAllByClient_Id(clientId);
        return offers.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void acceptCounterOffer(UUID clientId, UUID offerId) {
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new RuntimeException("Offer not found"));

        // Verify client owns this offer
        if (!offer.getClient().getId().equals(clientId)) {
            throw new RuntimeException("Unauthorized");
        }

        // Verify status is COUNTEROFFER
        if (offer.getStatus() != OfferStatus.COUNTEROFFER) {
            throw new RuntimeException("Offer is not in counter-offer state");
        }

        offer.setStatus(OfferStatus.ACCEPTED);
        offerRepository.save(offer);

        createStatusHistory(offer, OfferStatus.ACCEPTED, "Counter-offer accepted by client");
    }

    @Transactional
    public void submitCounterToCounter(UUID clientId, UUID offerId, CounterOfferRequest request) {
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new RuntimeException("Offer not found"));

        // Verify client owns this offer
        if (!offer.getClient().getId().equals(clientId)) {
            throw new RuntimeException("Unauthorized");
        }

        // Update offer with new amount
        offer.setAmount(request.getAmount());
        offer.setMessage(request.getMessage());
        offer.setStatus(OfferStatus.SUBMITTED);
        offerRepository.save(offer);

        createStatusHistory(offer, OfferStatus.SUBMITTED, "Client submitted new counter-offer");
    }

    @Transactional
    public void withdrawOffer(UUID clientId, UUID offerId) {
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new RuntimeException("Offer not found"));

        // Verify client owns this offer
        if (!offer.getClient().getId().equals(clientId)) {
            throw new RuntimeException("Unauthorized");
        }

        offer.setStatus(OfferStatus.WITHDRAWN);
        offerRepository.save(offer);

        createStatusHistory(offer, OfferStatus.WITHDRAWN, "Offer withdrawn by client");
    }

    // ============ AGENT OPERATIONS ============

    public List<OfferResponse> getAgentOffers(UUID agentId) {
        // Get all listings for this agent
        List<Listing> agentListings = listingRepository.findAllByAgent_Id(agentId);
        
        // Get all offers for these listings
        return agentListings.stream()
                .flatMap(listing -> offerRepository.findAllByListing_Id(listing.getId()).stream())
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<OfferResponse> getPropertyOffers(UUID agentId, UUID propertyId) {
        // Verify agent owns this listing
        Listing listing = listingRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Listing not found"));

        if (!listing.getAgent().getId().equals(agentId)) {
            throw new RuntimeException("Unauthorized");
        }

        List<Offer> offers = offerRepository.findAllByListing_Id(propertyId);
        return offers.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void acceptOffer(UUID agentId, UUID offerId) {
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new RuntimeException("Offer not found"));

        // Verify agent owns the listing
        if (!offer.getListing().getAgent().getId().equals(agentId)) {
            throw new RuntimeException("Unauthorized");
        }

        offer.setStatus(OfferStatus.ACCEPTED);
        offerRepository.save(offer);

        createStatusHistory(offer, OfferStatus.ACCEPTED, "Offer accepted by agent");
    }

    @Transactional
    public void rejectOffer(UUID agentId, UUID offerId, String reason) {
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new RuntimeException("Offer not found"));

        // Verify agent owns the listing
        if (!offer.getListing().getAgent().getId().equals(agentId)) {
            throw new RuntimeException("Unauthorized");
        }

        offer.setStatus(OfferStatus.REJECTED);
        offerRepository.save(offer);

        String note = reason != null ? "Offer rejected: " + reason : "Offer rejected by agent";
        createStatusHistory(offer, OfferStatus.REJECTED, note);
    }

    @Transactional
    public void makeCounterOffer(UUID agentId, UUID offerId, CounterOfferRequest request) {
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new RuntimeException("Offer not found"));

        // Verify agent owns the listing
        if (!offer.getListing().getAgent().getId().equals(agentId)) {
            throw new RuntimeException("Unauthorized");
        }

        // Store counter offer details in message field (simplified approach)
        String counterMessage = "COUNTER:" + request.getAmount();
        if (request.getMessage() != null) {
            counterMessage += "|" + request.getMessage();
        }
        
        offer.setMessage(counterMessage);
        offer.setStatus(OfferStatus.COUNTEROFFER);
        offerRepository.save(offer);

        createStatusHistory(offer, OfferStatus.COUNTEROFFER, 
            "Agent made counter-offer: €" + request.getAmount());
    }

    public OfferStatsResponse getOfferStats(UUID agentId) {
        List<Listing> agentListings = listingRepository.findAllByAgent_Id(agentId);
        List<Offer> allOffers = agentListings.stream()
                .flatMap(listing -> offerRepository.findAllByListing_Id(listing.getId()).stream())
                .collect(Collectors.toList());

        long total = allOffers.size();
        long pending = allOffers.stream().filter(o -> o.getStatus() == OfferStatus.SUBMITTED).count();
        long accepted = allOffers.stream().filter(o -> o.getStatus() == OfferStatus.ACCEPTED).count();
        long rejected = allOffers.stream().filter(o -> o.getStatus() == OfferStatus.REJECTED).count();
        long counteroffers = allOffers.stream().filter(o -> o.getStatus() == OfferStatus.COUNTEROFFER).count();

        return new OfferStatsResponse(total, pending, accepted, rejected, counteroffers);
    }

    // ============ HELPER METHODS ============

    private void createStatusHistory(Offer offer, OfferStatus status, String note) {
        OfferStatusHistory history = new OfferStatusHistory();
        history.setOffer(offer);
        history.setNewStatus(status);
        history.setNote(note);
        offerStatusHistoryRepository.save(history);
    }

    private OfferResponse mapToResponse(Offer offer) {
        OfferResponse response = new OfferResponse();
        response.setId(offer.getId());
        response.setPropertyId(offer.getListing().getId());
        response.setPropertyTitle(offer.getListing().getTitle());
        response.setPropertyAddress(offer.getListing().getProperty().getAddress());
        response.setPropertyPrice(offer.getListing().getPriceAmount());
        response.setAmount(offer.getAmount());
        response.setCurrency(offer.getCurrency());
        response.setStatus(offer.getStatus());
        response.setCreatedAt(offer.getCreatedAt());
        response.setUpdatedAt(offer.getUpdatedAt());

        // Extract counter offer details from message if present
        if (offer.getMessage() != null && offer.getMessage().startsWith("COUNTER:")) {
            String[] parts = offer.getMessage().substring(8).split("\\|");
            try {
                response.setCounterOfferAmount(Integer.parseInt(parts[0]));
                if (parts.length > 1) {
                    response.setCounterMessage(parts[1]);
                }
            } catch (NumberFormatException e) {
                // Ignore parsing error
            }
        } else {
            response.setMessage(offer.getMessage());
        }

        // Add client info for agent view
        response.setClientName(offer.getClient().getFirstName() + " " + offer.getClient().getLastName());
        response.setClientEmail(offer.getClient().getEmail());

        // Add property image if available
        if (offer.getListing().getImages() != null && !offer.getListing().getImages().isEmpty()) {
            response.setPropertyImage(offer.getListing().getImages().get(0).getUrl());
        }

        return response;
    }
}
