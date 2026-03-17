package it.unina.dietiestates25.backend.controllers;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import it.unina.dietiestates25.backend.dto.NotificationDTO;
import it.unina.dietiestates25.backend.dto.NotificationPreferencesDTO;
import it.unina.dietiestates25.backend.entities.Notification;
import it.unina.dietiestates25.backend.security.UserPrincipal;
import it.unina.dietiestates25.backend.services.NotificationService;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<List<NotificationDTO>> getNotifications(@AuthenticationPrincipal UserPrincipal principal) {
        List<Notification> notifications = notificationService.getUserNotifications(principal.getId());
        List<NotificationDTO> dtos = notifications.stream()
                .map(this::mapToDTO)
            .toList();
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/unread")
    public ResponseEntity<List<NotificationDTO>> getUnreadNotifications(@AuthenticationPrincipal UserPrincipal principal) {
        List<Notification> notifications = notificationService.getUnreadNotifications(principal.getId());
        List<NotificationDTO> dtos = notifications.stream()
                .map(this::mapToDTO)
            .toList();
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/unread/count")
    public ResponseEntity<Long> getUnreadCount(@AuthenticationPrincipal UserPrincipal principal) {
        long count = notificationService.countUnreadNotifications(principal.getId());
        return ResponseEntity.ok(count);
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable UUID id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(@AuthenticationPrincipal UserPrincipal principal) {
        notificationService.markAllAsRead(principal.getId());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(@PathVariable UUID id) {
        notificationService.deleteNotification(id);
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/preferences")
    public ResponseEntity<NotificationPreferencesDTO> getPreferences(@AuthenticationPrincipal UserPrincipal principal) {
        it.unina.dietiestates25.backend.entities.NotificationPreferences prefs = 
            notificationService.getUserPreferences(principal.getId());
        
        if (prefs == null) {
            return ResponseEntity.notFound().build();
        }
        
        NotificationPreferencesDTO dto = mapPreferencesToDTO(prefs);
        return ResponseEntity.ok(dto);
    }
    
    @PutMapping("/preferences")
    public ResponseEntity<NotificationPreferencesDTO> updatePreferences(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody NotificationPreferencesDTO dto) {
        
        it.unina.dietiestates25.backend.entities.NotificationPreferences prefs = 
            new it.unina.dietiestates25.backend.entities.NotificationPreferences();
        prefs.setEmailEnabled(dto.isEmailEnabled());
        prefs.setInappEnabled(dto.isInappEnabled());
        prefs.setNotifyNewMatching(dto.isNotifyNewMatching());
        prefs.setNotifyPriceChange(dto.isNotifyPriceChange());
        prefs.setNotifyListingUpdates(dto.isNotifyListingUpdates());
        prefs.setNotifyVisitUpdates(dto.isNotifyVisitUpdates());
        prefs.setNotifyOfferUpdates(dto.isNotifyOfferUpdates());
        
        it.unina.dietiestates25.backend.entities.NotificationPreferences updated = 
            notificationService.updateUserPreferences(principal.getId(), prefs);
        
        if (updated == null) {
            return ResponseEntity.notFound().build();
        }
        
        return ResponseEntity.ok(mapPreferencesToDTO(updated));
    }

    private NotificationPreferencesDTO mapPreferencesToDTO(it.unina.dietiestates25.backend.entities.NotificationPreferences prefs) {
        NotificationPreferencesDTO dto = new NotificationPreferencesDTO();
        dto.setEmailEnabled(prefs.isEmailEnabled());
        dto.setInappEnabled(prefs.isInappEnabled());
        dto.setNotifyNewMatching(prefs.isNotifyNewMatching());
        dto.setNotifyPriceChange(prefs.isNotifyPriceChange());
        dto.setNotifyListingUpdates(prefs.isNotifyListingUpdates());
        dto.setNotifyVisitUpdates(prefs.isNotifyVisitUpdates());
        dto.setNotifyOfferUpdates(prefs.isNotifyOfferUpdates());
        return dto;
    }

    private NotificationDTO mapToDTO(Notification notification) {
        NotificationDTO dto = new NotificationDTO();
        dto.setId(notification.getId());
        dto.setType(notification.getType().name());
        dto.setTitle(notification.getTitle());
        dto.setBody(notification.getBody());
        dto.setRead(notification.isRead());
        dto.setCreatedAt(notification.getCreatedAt().toString());
        
        if (notification.getListing() != null) {
            dto.setListingId(notification.getListing().getId());
            dto.setListingTitle(notification.getListing().getTitle());
        }
        
        if (notification.getSavedSearch() != null) {
            dto.setSavedSearchId(notification.getSavedSearch().getId());
        }
        
        return dto;
    }
}
