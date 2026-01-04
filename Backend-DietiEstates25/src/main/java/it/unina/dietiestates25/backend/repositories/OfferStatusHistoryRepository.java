package it.unina.dietiestates25.backend.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import it.unina.dietiestates25.backend.entities.OfferStatusHistory;

public interface OfferStatusHistoryRepository extends JpaRepository<OfferStatusHistory, UUID> {
    List<OfferStatusHistory> findAllByOffer_IdOrderByChangedAtDesc(UUID offerId);
}
