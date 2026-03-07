package it.unina.dietiestates25.backend.services;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Servizio per inviare notifiche in tempo reale tramite WebSocket
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WebSocketNotificationService {

    private final SimpMessagingTemplate messagingTemplate;

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
