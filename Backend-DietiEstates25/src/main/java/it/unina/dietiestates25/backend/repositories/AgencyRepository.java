package it.unina.dietiestates25.backend.repositories;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import it.unina.dietiestates25.backend.entities.Agency;

public interface AgencyRepository extends JpaRepository<Agency, UUID> {
    Optional<Agency> findByVatNumber(String vatNumber);
    boolean existsByVatNumber(String vatNumber);
}
