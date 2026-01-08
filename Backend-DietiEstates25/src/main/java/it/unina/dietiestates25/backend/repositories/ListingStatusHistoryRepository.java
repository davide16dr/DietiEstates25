package it.unina.dietiestates25.backend.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import it.unina.dietiestates25.backend.entities.ListingStatusHistory;

public interface ListingStatusHistoryRepository extends JpaRepository<ListingStatusHistory, UUID> {
    List<ListingStatusHistory> findAllByListing_IdOrderByChangedAtDesc(UUID listingId);
}
