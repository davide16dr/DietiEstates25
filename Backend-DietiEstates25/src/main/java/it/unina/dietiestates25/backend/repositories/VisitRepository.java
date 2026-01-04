package it.unina.dietiestates25.backend.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import it.unina.dietiestates25.backend.entities.Visit;
import it.unina.dietiestates25.backend.entities.enums.VisitStatus;

public interface VisitRepository extends JpaRepository<Visit, UUID> {

    List<Visit> findAllByListing_Id(UUID listingId);

    List<Visit> findAllByClient_Id(UUID clientId);

    List<Visit> findAllByAgent_Id(UUID agentId);

    List<Visit> findAllByStatus(VisitStatus status);

    List<Visit> findAllByClient_IdAndStatus(UUID clientId, VisitStatus status);
}
