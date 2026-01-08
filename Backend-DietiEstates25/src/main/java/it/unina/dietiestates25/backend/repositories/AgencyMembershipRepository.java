package it.unina.dietiestates25.backend.repositories;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import it.unina.dietiestates25.backend.entities.AgencyMembership;
import it.unina.dietiestates25.backend.entities.enums.UserRole;

public interface AgencyMembershipRepository extends JpaRepository<AgencyMembership, UUID> {

    Optional<AgencyMembership> findByAgency_IdAndUser_Id(UUID agencyId, UUID userId);

    boolean existsByAgency_IdAndUser_Id(UUID agencyId, UUID userId);

    List<AgencyMembership> findAllByAgency_Id(UUID agencyId);

    List<AgencyMembership> findAllByUser_Id(UUID userId);

    List<AgencyMembership> findAllByAgency_IdAndMembershipRole(UUID agencyId, UserRole membershipRole);
}
