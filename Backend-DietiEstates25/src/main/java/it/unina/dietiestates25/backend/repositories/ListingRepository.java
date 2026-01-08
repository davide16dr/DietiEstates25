package it.unina.dietiestates25.backend.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import it.unina.dietiestates25.backend.entities.Listing;
import it.unina.dietiestates25.backend.entities.enums.ListingStatus;
import it.unina.dietiestates25.backend.entities.enums.ListingType;

public interface ListingRepository extends JpaRepository<Listing, UUID> {

    List<Listing> findAllByTypeAndStatus(ListingType type, ListingStatus status);

    List<Listing> findAllByStatus(ListingStatus status);

    List<Listing> findAllByAgent_Id(UUID agentId);

    List<Listing> findAllByProperty_Agency_Id(UUID agencyId);

    List<Listing> findAllByProperty_Id(UUID propertyId);

    // utile per recuperare listing con prezzo in range
    List<Listing> findAllByPriceAmountBetween(int min, int max);
}
