package it.unina.dietiestates25.backend.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import it.unina.dietiestates25.backend.entities.Property;
import it.unina.dietiestates25.backend.entities.enums.PropertyStatus;

public interface PropertyRepository extends JpaRepository<Property, UUID> {

    List<Property> findAllByAgency_Id(UUID agencyId);

    List<Property> findAllByCityIgnoreCase(String city);

    List<Property> findAllByStatus(PropertyStatus status);

    List<Property> findAllByAgency_IdAndStatus(UUID agencyId, PropertyStatus status);
}
