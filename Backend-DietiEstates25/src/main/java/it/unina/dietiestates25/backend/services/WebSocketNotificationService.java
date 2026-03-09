package it.unina.dietiestates25.backend.services;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

import it.unina.dietiestates25.backend.repositories.NotificationPreferencesRepository;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Servizio per inviare notifiche in tempo reale tramite WebSocket
 * ✅ AGGIORNATO: Con controllo delle preferenze utente
 */
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

    /**
     * ✅ Verifica se l'utente ha abilitato le notifiche WebSocket di un certo tipo
     */
    private boolean shouldSendWebSocketNotification(UUID userId, String notificationType) {
        try {
            it.unina.dietiestates25.backend.entities.NotificationPreferences prefs = 
                notificationPreferencesRepository.findByUser_Id(userId).orElse(null);
            
            if (prefs == null) return true; // Default: invia se preferenze non trovate
            
            // Se le notifiche in-app sono disabilitate, non inviare WebSocket
            if (!prefs.isInappEnabled()) {
                log.info("⏭️ WebSocket {} NON inviato a {} - in-app disabilitato", notificationType, userId);
                return false;
            }
            
            // Verifica la preferenza specifica per tipo di notifica
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
            return true; // In caso di errore, invia comunque
        }
    }

    /**
     * Invia una notifica a un utente specifico
     * 
     * @param userId ID dell'utente destinatario
     * @param notification Oggetto notifica da inviare
     */
    public void sendNotificationToUser(String userId, Object notification) {
        try {
            String destination = "/topic/notifications/" + userId;
            messagingTemplate.convertAndSend(destination, notification);
            log.info("📬 Notifica inviata via WebSocket a utente {} su topic {}", userId, destination);
        } catch (Exception e) {
            log.error("❌ Errore invio notifica WebSocket a utente {}: {}", userId, e.getMessage());
        }
    }

    /**
     * Invia una notifica broadcast a tutti gli utenti connessi
     * 
     * @param notification Oggetto notifica da inviare
     */
    public void sendBroadcastNotification(Object notification) {
        try {
            messagingTemplate.convertAndSend("/topic/notifications/broadcast", notification);
            log.info("📢 Notifica broadcast inviata via WebSocket");
        } catch (Exception e) {
            log.error("❌ Errore invio notifica broadcast WebSocket: {}", e.getMessage());
        }
    }

    /**
     * Invia una notifica di aggiornamento offerta
     * 
     * @param userId ID dell'utente destinatario
     * @param offerId ID dell'offerta
     * @param notification Dettagli notifica
     */
    public void sendOfferUpdateNotification(String userId, String offerId, Object notification) {
        try {
            String destination = "/topic/offers/" + userId;
            messagingTemplate.convertAndSend(destination, notification);
            log.info("💰 Notifica offerta {} inviata via WebSocket a utente {}", offerId, userId);
        } catch (Exception e) {
            log.error("❌ Errore invio notifica offerta WebSocket: {}", e.getMessage());
        }
    }

    /**
     * Invia una notifica di aggiornamento visita
     * 
     * @param userId ID dell'utente destinatario
     * @param visitId ID della visita
     * @param notification Dettagli notifica
     */
    public void sendVisitUpdateNotification(String userId, String visitId, Object notification) {
        try {
            String destination = "/topic/visits/" + userId;
            messagingTemplate.convertAndSend(destination, notification);
            log.info("📅 Notifica visita {} inviata via WebSocket a utente {}", visitId, userId);
        } catch (Exception e) {
            log.error("❌ Errore invio notifica visita WebSocket: {}", e.getMessage());
        }
    }

    /**
     * Invia una notifica di offerta in tempo reale
     * 
     * @param userId ID dell'utente destinatario
     * @param type Tipo di notifica (OFFER_ACCEPTED, OFFER_REJECTED, etc.)
     * @param title Titolo della notifica
     * @param body Corpo della notifica
     * @param listingId ID del listing
     * @param offerId ID dell'offerta
     */
    public void sendOfferNotification(UUID userId, String type, String title, String body, UUID listingId, UUID offerId) {
        // ✅ CONTROLLO PREFERENZE
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

    /**
     * Invia una notifica di visita in tempo reale
     * 
     * @param userId ID dell'utente destinatario
     * @param type Tipo di notifica (VISIT_CONFIRMED, VISIT_CANCELLED_BY_CLIENT, etc.)
     * @param title Titolo della notifica
     * @param message Corpo della notifica
     * @param listingId ID del listing
     * @param visitId ID della visita
     */
    public void sendVisitNotification(UUID userId, String type, String title, String message, UUID listingId, UUID visitId) {
        // ✅ CONTROLLO PREFERENZE
        if (!shouldSendWebSocketNotification(userId, type)) {
            return;
        }
        
        try {
            Map<String, Object> notification = new HashMap<>();
            notification.put("id", UUID.randomUUID().toString());
            notification.put("type", type);
            notification.put("title", title);
            notification.put("message", message);
            notification.put("body", message);  // Aggiungi anche 'body' per compatibilità
            notification.put("listingId", listingId.toString());
            notification.put("visitId", visitId.toString());
            notification.put("timestamp", LocalDateTime.now().toString());
            notification.put("createdAt", java.time.Instant.now().toString());

            // Invia al topic visite specifico dell'utente
            String destination = "/topic/visits/" + userId.toString();
            messagingTemplate.convertAndSend(destination, notification);
            
            log.info("📬 Notifica visita {} inviata a utente {} su topic {}", visitId, userId, destination);
        } catch (Exception e) {
            log.error("❌ Errore invio notifica visita WebSocket a utente {}: {}", userId, e.getMessage());
        }
    }
}
