package it.unina.dietiestates25.backend.repositories;

import it.unina.dietiestates25.backend.entities.ListingImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ListingImageRepository extends JpaRepository<ListingImage, UUID> {
}
