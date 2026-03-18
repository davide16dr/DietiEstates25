package it.unina.dietiestates25.backend.services;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

import it.unina.dietiestates25.backend.repositories.NotificationPreferencesRepository;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;





@Service
@Slf4j
public class WebSocketNotificationService {

    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationPreferencesRepository notificationPreferencesRepository;

    public WebSocketNotificationService(
            SimpMessagingTemplate messagingTemplate,
            NotificationPreferencesRepository notificationPreferencesRepository) {
        this.messagingTemplate = messagingTemplate;
        this.notificationPreferencesRepository = notificationPreferencesRepository;
    }

    


    private boolean shouldSendWebSocketNotification(UUID userId, String notificationType) {
        try {
            it.unina.dietiestates25.backend.entities.NotificationPreferences prefs = 
                notificationPreferencesRepository.findByUser_Id(userId).orElse(null);
            
            if (prefs == null) return true; 
            
            
            if (!prefs.isInappEnabled()) {
                log.info("⏭️ WebSocket {} NON inviato a {} - in-app disabilitato", notificationType, userId);
                return false;
            }
            
            
            boolean shouldSend = switch (notificationType) {
                case "NEW_OFFER", "OFFER_ACCEPTED", "OFFER_REJECTED", "COUNTEROFFER", 
                     "COUNTER_TO_COUNTER", "OFFER_WITHDRAWN" -> prefs.isNotifyOfferUpdates();
                case "NEW_VISIT_REQUEST", "VISIT_CONFIRMED", "VISIT_REJECTED", "VISIT_COMPLETED",
                     "VISIT_CANCELLED_BY_CLIENT", "VISIT_CANCELLED_BY_AGENT" -> prefs.isNotifyVisitUpdates();
                case "PRICE_CHANGED" -> prefs.isNotifyPriceChange();
                case "NEW_MATCHING_LISTING" -> prefs.isNotifyNewMatching();
                case "LISTING_UPDATED" -> prefs.isNotifyListingUpdates();
                default -> true;
            };
            
            if (!shouldSend) {
                log.info("⏭️ WebSocket {} NON inviato a {} - preferenza disabilitata", notificationType, userId);
            }
            
            return shouldSend;
        } catch (Exception e) {
            log.error("❌ Errore controllo preferenze per {}: {}", userId, e.getMessage());
            return true; 
        }
    }

    





    public void sendNotificationToUser(String userId, Object notification) {
        try {
            String destination = "/topic/notifications/" + userId;
            messagingTemplate.convertAndSend(destination, notification);
            log.info("📬 Notifica inviata via WebSocket a utente {} su topic {}", userId, destination);
        } catch (Exception e) {
            log.error("❌ Errore invio notifica WebSocket a utente {}: {}", userId, e.getMessage());
        }
    }

    




    public void sendBroadcastNotification(Object notification) {
        try {
            messagingTemplate.convertAndSend("/topic/notifications/broadcast", notification);
            log.info("📢 Notifica broadcast inviata via WebSocket");
        } catch (Exception e) {
            log.error("❌ Errore invio notifica broadcast WebSocket: {}", e.getMessage());
        }
    }

    






    public void sendOfferUpdateNotification(String userId, String offerId, Object notification) {
        try {
            String destination = "/topic/offers/" + userId;
            messagingTemplate.convertAndSend(destination, notification);
            log.info("💰 Notifica offerta {} inviata via WebSocket a utente {}", offerId, userId);
        } catch (Exception e) {
            log.error("❌ Errore invio notifica offerta WebSocket: {}", e.getMessage());
        }
    }

    






    public void sendVisitUpdateNotification(String userId, String visitId, Object notification) {
        try {
            String destination = "/topic/visits/" + userId;
            messagingTemplate.convertAndSend(destination, notification);
            log.info("📅 Notifica visita {} inviata via WebSocket a utente {}", visitId, userId);
        } catch (Exception e) {
            log.error("❌ Errore invio notifica visita WebSocket: {}", e.getMessage());
        }
    }

    









    public void sendOfferNotification(UUID userId, String type, String title, String body, UUID listingId, UUID offerId) {
        
        if (!shouldSendWebSocketNotification(userId, type)) {
            return;
        }
        
        try {
            Map<String, Object> notification = new HashMap<>();
            notification.put("id", UUID.randomUUID().toString());
            notification.put("type", type);
            notification.put("title", title);
            notification.put("body", body);
            notification.put("listingId", listingId.toString());
            notification.put("offerId", offerId.toString());
            notification.put("createdAt", java.time.Instant.now().toString());
            
            String destination = "/topic/offers/" + userId.toString();
            messagingTemplate.convertAndSend(destination, notification);
            log.info("💰 Notifica offerta {} inviata via WebSocket a utente {} su topic {}", offerId, userId, destination);
        } catch (Exception e) {
            log.error("❌ Errore invio notifica offerta WebSocket a utente {}: {}", userId, e.getMessage());
        }
    }

    









    public void sendVisitNotification(UUID userId, String type, String title, String message, UUID listingId, UUID visitId) {
        
        if (!shouldSendWebSocketNotification(userId, type)) {
            return;
        }
        
        try {
            Map<String, Object> notification = new HashMap<>();
            notification.put("id", UUID.randomUUID().toString());
            notification.put("type", type);
            notification.put("title", title);
            notification.put("message", message);
            notification.put("body", message);  
            notification.put("listingId", listingId.toString());
            notification.put("visitId", visitId.toString());
            notification.put("timestamp", LocalDateTime.now().toString());
            notification.put("createdAt", java.time.Instant.now().toString());

            
            String destination = "/topic/visits/" + userId.toString();
            messagingTemplate.convertAndSend(destination, notification);
            
            log.info("📬 Notifica visita {} inviata a utente {} su topic {}", visitId, userId, destination);
        } catch (Exception e) {
            log.error("❌ Errore invio notifica visita WebSocket a utente {}: {}", userId, e.getMessage());
        }
    }
}
