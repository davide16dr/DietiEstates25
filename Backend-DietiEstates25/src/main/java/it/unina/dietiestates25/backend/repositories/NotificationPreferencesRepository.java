package it.unina.dietiestates25.backend.repositories;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import it.unina.dietiestates25.backend.entities.NotificationPreferences;

public interface NotificationPreferencesRepository extends JpaRepository<NotificationPreferences, UUID> {
    Optional<NotificationPreferences> findByUser_Id(UUID userId);
}
