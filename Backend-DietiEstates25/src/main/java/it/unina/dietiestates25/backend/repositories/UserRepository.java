package it.unina.dietiestates25.backend.repositories;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import it.unina.dietiestates25.backend.entities.User;
import it.unina.dietiestates25.backend.entities.enums.UserRole;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    
    /**
     * Trova tutti gli utenti di una specifica agenzia con un determinato ruolo
     */
    List<User> findByAgencyIdAndRole(UUID agencyId, UserRole role);
    
    /**
     * Trova tutti gli utenti di una specifica agenzia
     */
    List<User> findByAgencyId(UUID agencyId);
}
