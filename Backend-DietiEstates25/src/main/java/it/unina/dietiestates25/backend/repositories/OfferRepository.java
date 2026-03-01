package it.unina.dietiestates25.backend.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import it.unina.dietiestates25.backend.entities.Offer;
import it.unina.dietiestates25.backend.entities.enums.OfferStatus;

public interface OfferRepository extends JpaRepository<Offer, UUID> {

    List<Offer> findAllByListing_Id(UUID listingId);

    List<Offer> findAllByClient_Id(UUID clientId);

    List<Offer> findAllByStatus(OfferStatus status);

    List<Offer> findAllByListing_IdAndStatus(UUID listingId, OfferStatus status);
    
    List<Offer> findAllByListing_IdAndClient_Id(UUID listingId, UUID clientId);
}
