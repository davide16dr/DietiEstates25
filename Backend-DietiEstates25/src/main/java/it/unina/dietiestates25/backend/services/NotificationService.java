package it.unina.dietiestates25.backend.services;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import it.unina.dietiestates25.backend.entities.Listing;
import it.unina.dietiestates25.backend.entities.Notification;
import it.unina.dietiestates25.backend.entities.SavedSearch;
import it.unina.dietiestates25.backend.entities.User;
import it.unina.dietiestates25.backend.entities.enums.NotificationType;
import it.unina.dietiestates25.backend.repositories.NotificationPreferencesRepository;
import it.unina.dietiestates25.backend.repositories.NotificationRepository;
import it.unina.dietiestates25.backend.repositories.SavedSearchRepository;
import it.unina.dietiestates25.backend.repositories.UserRepository;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SavedSearchRepository savedSearchRepository;
    private final NotificationPreferencesRepository notificationPreferencesRepository;

    public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository,
                               SavedSearchRepository savedSearchRepository,
                               NotificationPreferencesRepository notificationPreferencesRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.savedSearchRepository = savedSearchRepository;
        this.notificationPreferencesRepository = notificationPreferencesRepository;
    }

    @Transactional(readOnly = true)
    public List<Notification> getUserNotifications(UUID userId) {
        return notificationRepository.findAllByUser_IdOrderByCreatedAtDesc(userId);
    }

    @Transactional(readOnly = true)
    public List<Notification> getUnreadNotifications(UUID userId) {
        return notificationRepository.findAllByUser_IdAndReadFalseOrderByCreatedAtDesc(userId);
    }

    @Transactional(readOnly = true)
    public long countUnreadNotifications(UUID userId) {
        return notificationRepository.countByUser_IdAndReadFalse(userId);
    }

    @Transactional
    public void markAsRead(UUID notificationId) {
        notificationRepository.findById(notificationId).ifPresent(notification -> {
            notification.setRead(true);
            notificationRepository.save(notification);
        });
    }

    @Transactional
    public void markAllAsRead(UUID userId) {
        List<Notification> unreadNotifications = notificationRepository.findAllByUser_IdAndReadFalseOrderByCreatedAtDesc(userId);
        unreadNotifications.forEach(notification -> notification.setRead(true));
        notificationRepository.saveAll(unreadNotifications);
    }

    @Transactional
    public void deleteNotification(UUID notificationId) {
        notificationRepository.deleteById(notificationId);
    }

    // ============ NOTIFICATION CREATION METHODS (WITH PREFERENCES CHECK) ============

    /**
     * ✅ NUOVO: Verifica se l'utente ha abilitato le notifiche di un certo tipo
     */
    private boolean shouldSendNotification(UUID userId, String notificationType) {
        it.unina.dietiestates25.backend.entities.NotificationPreferences prefs = getUserPreferences(userId);
        if (prefs == null) return true; // Default: invia se preferenze non trovate
        
        // Se le notifiche in-app sono disabilitate, non inviare NESSUNA notifica
        if (!prefs.isInappEnabled()) {
            System.out.println("⏭️ Notifica " + notificationType + " NON inviata a " + userId + " - in-app disabilitato");
            return false;
        }
        
        // Verifica la preferenza specifica per tipo di notifica
        boolean shouldSend = switch (notificationType) {
            case "OFFER_STATUS_CHANGED", "OFFER_UPDATES" -> prefs.isNotifyOfferUpdates();
            case "VISIT_STATUS_CHANGED", "VISIT_UPDATES" -> prefs.isNotifyVisitUpdates();
            case "PRICE_CHANGED" -> prefs.isNotifyPriceChange();
            case "NEW_MATCHING_LISTING" -> prefs.isNotifyNewMatching();
            case "LISTING_UPDATED" -> prefs.isNotifyListingUpdates();
            default -> true;
        };
        
        if (!shouldSend) {
            System.out.println("⏭️ Notifica " + notificationType + " NON inviata a " + userId + " - preferenza disabilitata");
        }
        
        return shouldSend;
    }

    @Transactional
    public void createOfferStatusNotification(UUID clientId, Listing listing, String status, Integer counterOfferAmount) {
        // ✅ CONTROLLO PREFERENZE
        if (!shouldSendNotification(clientId, "OFFER_UPDATES")) {
            return;
        }
        
        User client = userRepository.findById(clientId).orElse(null);
        if (client == null) return;

        String title;
        String body;

        switch (status) {
            case "ACCEPTED":
                title = "✅ Offerta Accettata!";
                body = String.format("La tua offerta per '%s' è stata accettata!", listing.getTitle());
                break;
            case "REJECTED":
                title = "❌ Offerta Rifiutata";
                body = String.format("La tua offerta per '%s' è stata rifiutata.", listing.getTitle());
                break;
            case "COUNTEROFFER":
                title = "🔄 Controproposta Ricevuta";
                body = String.format("Hai ricevuto una controproposta di €%,d per '%s'", counterOfferAmount, listing.getTitle());
                break;
            default:
                return;
        }

        Notification notification = new Notification();
        notification.setUser(client);
        notification.setType(NotificationType.OFFER_STATUS_CHANGED);
        notification.setListing(listing);
        notification.setTitle(title);
        notification.setBody(body);

        notificationRepository.save(notification);
        System.out.println("✅ Notifica OFFER inviata a " + clientId);
    }

    @Transactional
    public void createVisitStatusNotification(UUID clientId, Listing listing, String status) {
        // ✅ CONTROLLO PREFERENZE
        if (!shouldSendNotification(clientId, "VISIT_UPDATES")) {
            return;
        }
        
        User client = userRepository.findById(clientId).orElse(null);
        if (client == null) return;

        String title;
        String body;

        switch (status) {
            case "CONFIRMED":
                title = "✅ Visita Confermata";
                body = String.format("La tua visita per '%s' è stata confermata!", listing.getTitle());
                break;
            case "REJECTED":
                title = "❌ Visita Rifiutata";
                body = String.format("La tua richiesta di visita per '%s' è stata rifiutata.", listing.getTitle());
                break;
            case "CANCELLED":
                title = "🚫 Visita Cancellata";
                body = String.format("La visita per '%s' è stata cancellata.", listing.getTitle());
                break;
            case "COMPLETED":
                title = "✅ Visita Completata";
                body = String.format("La visita per '%s' è stata completata.", listing.getTitle());
                break;
            case "CANCELLED_BY_AGENT":
                title = "🚫 Visita Annullata";
                body = String.format("L'agente ha annullato la visita per '%s'.", listing.getTitle());
                break;
            default:
                return;
        }

        Notification notification = new Notification();
        notification.setUser(client);
        notification.setType(NotificationType.VISIT_STATUS_CHANGED);
        notification.setListing(listing);
        notification.setTitle(title);
        notification.setBody(body);

        notificationRepository.save(notification);
        System.out.println("✅ Notifica VISIT inviata a " + clientId);
    }

    @Transactional
    public void createPriceChangeNotification(UUID clientId, Listing listing, int oldPrice, int newPrice) {
        // ✅ CONTROLLO PREFERENZE
        if (!shouldSendNotification(clientId, "PRICE_CHANGED")) {
            return;
        }
        
        User client = userRepository.findById(clientId).orElse(null);
        if (client == null) return;

        String priceDirection = newPrice < oldPrice ? "📉 Prezzo Ridotto!" : "📈 Prezzo Aumentato";
        String body = String.format("Il prezzo di '%s' è cambiato da €%,d a €%,d", 
            listing.getTitle(), oldPrice, newPrice);

        Notification notification = new Notification();
        notification.setUser(client);
        notification.setType(NotificationType.PRICE_CHANGED);
        notification.setListing(listing);
        notification.setTitle(priceDirection);
        notification.setBody(body);

        notificationRepository.save(notification);
        System.out.println("✅ Notifica PRICE_CHANGE inviata a " + clientId);
    }

    @Transactional
    public void createNewMatchingListingNotification(UUID clientId, SavedSearch savedSearch, Listing listing) {
        // ✅ CONTROLLO PREFERENZE
        if (!shouldSendNotification(clientId, "NEW_MATCHING_LISTING")) {
            return;
        }
        
        User client = userRepository.findById(clientId).orElse(null);
        if (client == null) return;

        String title = "🏠 Nuovo Immobile Corrispondente";
        String body = String.format("Abbiamo trovato un nuovo immobile che corrisponde ai tuoi criteri: '%s' a %s", 
            listing.getTitle(), listing.getProperty().getCity());

        Notification notification = new Notification();
        notification.setUser(client);
        notification.setType(NotificationType.NEW_MATCHING_LISTING);
        notification.setListing(listing);
        notification.setSavedSearch(savedSearch);
        notification.setTitle(title);
        notification.setBody(body);

        notificationRepository.save(notification);
        System.out.println("✅ Notifica NEW_MATCHING inviata a " + clientId);
    }

    @Transactional
    public void createListingUpdatedNotification(UUID clientId, Listing listing) {
        // ✅ CONTROLLO PREFERENZE
        if (!shouldSendNotification(clientId, "LISTING_UPDATED")) {
            return;
        }
        
        User client = userRepository.findById(clientId).orElse(null);
        if (client == null) return;

        String title = "🔄 Immobile Aggiornato";
        String body = String.format("L'immobile '%s' è stato aggiornato. Controlla le modifiche!", listing.getTitle());

        Notification notification = new Notification();
        notification.setUser(client);
        notification.setType(NotificationType.LISTING_UPDATED);
        notification.setListing(listing);
        notification.setTitle(title);
        notification.setBody(body);

        notificationRepository.save(notification);
        System.out.println("✅ Notifica LISTING_UPDATED inviata a " + clientId);
    }
    
    /**
     * Crea una notifica generica per un agente (CON CONTROLLO PREFERENZE)
     */
    @Transactional
    public void createAgentNotification(UUID agentId, Listing listing, String title, String body) {
        // ✅ CONTROLLO PREFERENZE - Gli agenti ricevono notifiche su offerte/visite
        // Determina il tipo basandosi sul titolo
        String notificationType = "OFFER_UPDATES";
        if (title.toLowerCase().contains("visita")) {
            notificationType = "VISIT_UPDATES";
        }
        
        if (!shouldSendNotification(agentId, notificationType)) {
            return;
        }
        
        User agent = userRepository.findById(agentId).orElse(null);
        if (agent == null) return;

        Notification notification = new Notification();
        notification.setUser(agent);
        notification.setType(NotificationType.OFFER_STATUS_CHANGED);
        notification.setListing(listing);
        notification.setTitle(title);
        notification.setBody(body);

        notificationRepository.save(notification);
        System.out.println("✅ Notifica AGENT inviata a " + agentId + " - tipo: " + notificationType);
    }
    
    /**
     * Verifica se un nuovo immobile corrisponde alle ricerche salvate e invia notifiche
     */
    @Transactional
    public void checkMatchingSearchesAndNotify(Listing newListing) {
        // Recupera tutte le ricerche salvate attive
        List<SavedSearch> allActiveSearches = savedSearchRepository.findAll().stream()
                .filter(SavedSearch::isActive)
                .toList();
        
        System.out.println("🔍 Verifico matching per nuovo immobile: " + newListing.getTitle());
        System.out.println("📋 Ricerche salvate attive trovate: " + allActiveSearches.size());
        
        int notificationsSent = 0;
        
        for (SavedSearch search : allActiveSearches) {
            if (listingMatchesSearch(newListing, search)) {
                createNewMatchingListingNotification(
                    search.getClient().getId(), 
                    search, 
                    newListing
                );
                notificationsSent++;
            }
        }
        
        System.out.println("✅ Inviate " + notificationsSent + " notifiche per nuovo immobile corrispondente");
    }
    
    /**
     * Verifica se un immobile corrisponde ai criteri di una ricerca salvata
     */
    private boolean listingMatchesSearch(Listing listing, SavedSearch search) {
        java.util.Map<String, Object> filters = search.getFilters();
        it.unina.dietiestates25.backend.entities.Property property = listing.getProperty();
        
        // Verifica tipo (SALE/RENT)
        if (filters.containsKey("type")) {
            String searchType = (String) filters.get("type");
            if (!listing.getType().name().equals(searchType)) {
                return false;
            }
        }
        
        // Verifica città
        if (filters.containsKey("city")) {
            String searchCity = (String) filters.get("city");
            if (searchCity != null && !searchCity.isEmpty() && 
                !searchCity.equalsIgnoreCase(property.getCity())) {
                return false;
            }
        }
        
        // Verifica tipo di proprietà
        if (filters.containsKey("propertyType")) {
            String searchPropertyType = (String) filters.get("propertyType");
            if (searchPropertyType != null && !searchPropertyType.isEmpty() && 
                !searchPropertyType.equalsIgnoreCase(property.getPropertyType())) {
                return false;
            }
        }
        
        // Verifica prezzo minimo
        if (filters.containsKey("priceMin")) {
            Integer priceMin = getIntegerFromFilter(filters.get("priceMin"));
            if (priceMin != null && listing.getPriceAmount() < priceMin) {
                return false;
            }
        }
        
        // Verifica prezzo massimo
        if (filters.containsKey("priceMax")) {
            Integer priceMax = getIntegerFromFilter(filters.get("priceMax"));
            if (priceMax != null && listing.getPriceAmount() > priceMax) {
                return false;
            }
        }
        
        // Verifica numero minimo di stanze
        if (filters.containsKey("roomsMin")) {
            Integer roomsMin = getIntegerFromFilter(filters.get("roomsMin"));
            if (roomsMin != null && property.getRooms() < roomsMin) {
                return false;
            }
        }
        
        // Verifica area minima
        if (filters.containsKey("areaMin")) {
            Integer areaMin = getIntegerFromFilter(filters.get("areaMin"));
            if (areaMin != null && property.getAreaM2() < areaMin) {
                return false;
            }
        }
        
        // Verifica area massima
        if (filters.containsKey("areaMax")) {
            Integer areaMax = getIntegerFromFilter(filters.get("areaMax"));
            if (areaMax != null && property.getAreaM2() > areaMax) {
                return false;
            }
        }
        
        // Verifica presenza ascensore
        if (filters.containsKey("elevator")) {
            Boolean needsElevator = (Boolean) filters.get("elevator");
            if (needsElevator != null && needsElevator && !property.isElevator()) {
                return false;
            }
        }
        
        // Verifica classe energetica
        if (filters.containsKey("energyClass")) {
            String searchEnergyClass = (String) filters.get("energyClass");
            if (searchEnergyClass != null && !searchEnergyClass.isEmpty() && 
                !searchEnergyClass.equalsIgnoreCase(property.getEnergyClass())) {
                return false;
            }
        }
        
        // Se tutti i filtri corrispondono
        return true;
    }
    
    /**
     * Helper per convertire valori del filtro in Integer
     */
    private Integer getIntegerFromFilter(Object value) {
        if (value == null) return null;
        if (value instanceof Integer) return (Integer) value;
        if (value instanceof Number) return ((Number) value).intValue();
        if (value instanceof String) {
            try {
                return Integer.parseInt((String) value);
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }
    
    // ============ NOTIFICATION PREFERENCES ============
    
    /**
     * Recupera le preferenze notifiche dell'utente
     */
    @Transactional(readOnly = true)
    public it.unina.dietiestates25.backend.entities.NotificationPreferences getUserPreferences(UUID userId) {
        return notificationPreferencesRepository.findByUser_Id(userId)
                .orElseGet(() -> {
                    // Se non esistono, crea preferenze di default
                    User user = userRepository.findById(userId).orElse(null);
                    if (user == null) return null;
                    
                    it.unina.dietiestates25.backend.entities.NotificationPreferences prefs = 
                        new it.unina.dietiestates25.backend.entities.NotificationPreferences();
                    prefs.setUser(user);
                    return notificationPreferencesRepository.save(prefs);
                });
    }
    
    /**
     * Aggiorna le preferenze notifiche dell'utente
     */
    @Transactional
    public it.unina.dietiestates25.backend.entities.NotificationPreferences updateUserPreferences(
            UUID userId, 
            it.unina.dietiestates25.backend.entities.NotificationPreferences updatedPrefs) {
        
        it.unina.dietiestates25.backend.entities.NotificationPreferences existing = 
            getUserPreferences(userId);
        
        if (existing == null) return null;
        
        // Aggiorna i campi
        existing.setEmailEnabled(updatedPrefs.isEmailEnabled());
        existing.setInappEnabled(updatedPrefs.isInappEnabled());
        existing.setNotifyNewMatching(updatedPrefs.isNotifyNewMatching());
        existing.setNotifyPriceChange(updatedPrefs.isNotifyPriceChange());
        existing.setNotifyListingUpdates(updatedPrefs.isNotifyListingUpdates());
        existing.setNotifyVisitUpdates(updatedPrefs.isNotifyVisitUpdates());
        existing.setNotifyOfferUpdates(updatedPrefs.isNotifyOfferUpdates());
        
        return notificationPreferencesRepository.save(existing);
    }
}
