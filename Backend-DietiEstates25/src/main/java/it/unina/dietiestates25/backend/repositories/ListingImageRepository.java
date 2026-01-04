package it.unina.dietiestates25.backend.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import it.unina.dietiestates25.backend.entities.ListingImage;

public interface ListingImageRepository extends JpaRepository<ListingImage, UUID> {
    List<ListingImage> findAllByListing_IdOrderBySortOrderAsc(UUID listingId);
}
