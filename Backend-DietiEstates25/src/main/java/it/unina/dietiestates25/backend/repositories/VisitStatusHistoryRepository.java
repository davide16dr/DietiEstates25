package it.unina.dietiestates25.backend.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import it.unina.dietiestates25.backend.entities.VisitStatusHistory;

public interface VisitStatusHistoryRepository extends JpaRepository<VisitStatusHistory, UUID> {
    List<VisitStatusHistory> findAllByVisit_IdOrderByChangedAtDesc(UUID visitId);
}
