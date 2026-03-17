package it.unina.dietiestates25.backend.services;

import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private static final String TYPE_OFFER_STATUS_CHANGED = "OFFER_STATUS_CHANGED";
    private static final String TYPE_OFFER_UPDATES = "OFFER_UPDATES";
    private static final String TYPE_VISIT_STATUS_CHANGED = "VISIT_STATUS_CHANGED";
    private static final String TYPE_VISIT_UPDATES = "VISIT_UPDATES";
    private static final String TYPE_PRICE_CHANGED = "PRICE_CHANGED";
    private static final String TYPE_NEW_MATCHING_LISTING = "NEW_MATCHING_LISTING";
    private static final String TYPE_LISTING_UPDATED = "LISTING_UPDATED";
    private static final String STATUS_ACCEPTED = "ACCEPTED";
    private static final String STATUS_REJECTED = "REJECTED";
    private static final String STATUS_COUNTEROFFER = "COUNTEROFFER";
    private static final String STATUS_CANCELLED = "CANCELLED";
    private static final String STATUS_COMPLETED = "COMPLETED";
    private static final String STATUS_CANCELLED_BY_AGENT = "CANCELLED_BY_AGENT";
    private static final String LOG_PREFIX_SKIP = "⏭️ Notifica ";
    private static final String LOG_PREFIX_OK = "✅ Notifica ";
    private static final String LOG_INAPP_DISABLED = " - in-app disabilitato";
    private static final String LOG_PREFERENCE_DISABLED = " - preferenza disabilitata";
    private static final String TYPE_FALLBACK_OFFER = "OFFER_UPDATES";
    private static final String TYPE_FALLBACK_VISIT = "VISIT_UPDATES";
    private static final String KEY_VISITA = "visita";

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
            log.debug("{}{} NON inviata a {}{}", LOG_PREFIX_SKIP, notificationType, userId, LOG_INAPP_DISABLED);
            return false;
        }
        
        // Verifica la preferenza specifica per tipo di notifica
        boolean shouldSend = switch (notificationType) {
            case TYPE_OFFER_STATUS_CHANGED, TYPE_OFFER_UPDATES -> prefs.isNotifyOfferUpdates();
            case TYPE_VISIT_STATUS_CHANGED, TYPE_VISIT_UPDATES -> prefs.isNotifyVisitUpdates();
            case TYPE_PRICE_CHANGED -> prefs.isNotifyPriceChange();
            case TYPE_NEW_MATCHING_LISTING -> prefs.isNotifyNewMatching();
            case TYPE_LISTING_UPDATED -> prefs.isNotifyListingUpdates();
            default -> true;
        };
        
        if (!shouldSend) {
            log.debug("{}{} NON inviata a {}{}", LOG_PREFIX_SKIP, notificationType, userId, LOG_PREFERENCE_DISABLED);
        }
        
        return shouldSend;
    }

    @Transactional
    public void createOfferStatusNotification(UUID clientId, Listing listing, String status, Integer counterOfferAmount) {
        // ✅ CONTROLLO PREFERENZE
        if (!shouldSendNotification(clientId, TYPE_OFFER_UPDATES)) {
            return;
        }
        
        User client = userRepository.findById(clientId).orElse(null);
        if (client == null) return;

        String title;
        String body;

        switch (status) {
            case STATUS_ACCEPTED:
                title = "✅ Offerta Accettata!";
                body = String.format("La tua offerta per '%s' è stata accettata!", listing.getTitle());
                break;
            case STATUS_REJECTED:
                title = "❌ Offerta Rifiutata";
                body = String.format("La tua offerta per '%s' è stata rifiutata.", listing.getTitle());
                break;
            case STATUS_COUNTEROFFER:
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
        log.debug("{}OFFER inviata a {}", LOG_PREFIX_OK, clientId);
    }

    @Transactional
    public void createVisitStatusNotification(UUID clientId, Listing listing, String status) {
        // ✅ CONTROLLO PREFERENZE
        if (!shouldSendNotification(clientId, TYPE_VISIT_UPDATES)) {
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
            case STATUS_REJECTED:
                title = "❌ Visita Rifiutata";
                body = String.format("La tua richiesta di visita per '%s' è stata rifiutata.", listing.getTitle());
                break;
            case STATUS_CANCELLED:
                title = "🚫 Visita Cancellata";
                body = String.format("La visita per '%s' è stata cancellata.", listing.getTitle());
                break;
            case STATUS_COMPLETED:
                title = "✅ Visita Completata";
                body = String.format("La visita per '%s' è stata completata.", listing.getTitle());
                break;
            case STATUS_CANCELLED_BY_AGENT:
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
        log.debug("{}VISIT inviata a {}", LOG_PREFIX_OK, clientId);
    }

    @Transactional
    public void createPriceChangeNotification(UUID clientId, Listing listing, int oldPrice, int newPrice) {
        // ✅ CONTROLLO PREFERENZE
        if (!shouldSendNotification(clientId, TYPE_PRICE_CHANGED)) {
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
        log.debug("{}PRICE_CHANGE inviata a {}", LOG_PREFIX_OK, clientId);
    }

    @Transactional
    public void createNewMatchingListingNotification(UUID clientId, SavedSearch savedSearch, Listing listing) {
        // ✅ CONTROLLO PREFERENZE
        if (!shouldSendNotification(clientId, TYPE_NEW_MATCHING_LISTING)) {
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
        log.debug("{}NEW_MATCHING inviata a {}", LOG_PREFIX_OK, clientId);
    }

    @Transactional
    public void createListingUpdatedNotification(UUID clientId, Listing listing) {
        // ✅ CONTROLLO PREFERENZE
        if (!shouldSendNotification(clientId, TYPE_LISTING_UPDATED)) {
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
        log.debug("{}LISTING_UPDATED inviata a {}", LOG_PREFIX_OK, clientId);
    }
    
    /**
     * Crea una notifica generica per un agente (CON CONTROLLO PREFERENZE)
     */
    @Transactional
    public void createAgentNotification(UUID agentId, Listing listing, String title, String body) {
        // ✅ CONTROLLO PREFERENZE - Gli agenti ricevono notifiche su offerte/visite
        // Determina il tipo basandosi sul titolo
        String notificationType = TYPE_FALLBACK_OFFER;
        if (title.toLowerCase().contains(KEY_VISITA)) {
            notificationType = TYPE_FALLBACK_VISIT;
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
        log.debug("{}AGENT inviata a {} - tipo: {}", LOG_PREFIX_OK, agentId, notificationType);
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
        
        log.debug("Verifico matching per nuovo immobile: {}", newListing.getTitle());
        log.debug("Ricerche salvate attive trovate: {}", allActiveSearches.size());
        
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
        
        log.debug("{}Inviate {} notifiche per nuovo immobile corrispondente", LOG_PREFIX_OK, notificationsSent);
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
        if (value instanceof Integer integer) return integer;
        if (value instanceof Number number) return number.intValue();
        if (value instanceof String string) {
            try {
                return Integer.parseInt(string);
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
