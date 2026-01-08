package it.unina.dietiestates25.backend.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import it.unina.dietiestates25.backend.entities.Notification;
import it.unina.dietiestates25.backend.entities.enums.NotificationType;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    List<Notification> findAllByUser_IdOrderByCreatedAtDesc(UUID userId);

    List<Notification> findAllByUser_IdAndReadFalseOrderByCreatedAtDesc(UUID userId);

    long countByUser_IdAndReadFalse(UUID userId);

    List<Notification> findAllByUser_IdAndTypeOrderByCreatedAtDesc(UUID userId, NotificationType type);
}
