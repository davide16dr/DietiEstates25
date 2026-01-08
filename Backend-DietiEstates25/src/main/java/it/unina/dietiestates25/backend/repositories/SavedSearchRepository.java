package it.unina.dietiestates25.backend.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import it.unina.dietiestates25.backend.entities.SavedSearch;

public interface SavedSearchRepository extends JpaRepository<SavedSearch, UUID> {

    List<SavedSearch> findAllByClient_Id(UUID clientId);

    List<SavedSearch> findAllByClient_IdAndActiveTrue(UUID clientId);
}
