package it.unina.dietiestates25.backend.services;

import java.util.List;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import it.unina.dietiestates25.backend.dto.listing.ListingFilterRequest;
import it.unina.dietiestates25.backend.dto.listing.ListingResponse;
import it.unina.dietiestates25.backend.entities.Listing;
import it.unina.dietiestates25.backend.entities.ListingImage;
import it.unina.dietiestates25.backend.entities.Property;
import it.unina.dietiestates25.backend.entities.enums.ListingStatus;
import it.unina.dietiestates25.backend.repositories.AgencyRepository;
import it.unina.dietiestates25.backend.repositories.ListingRepository;
import it.unina.dietiestates25.backend.repositories.OfferRepository;
import it.unina.dietiestates25.backend.repositories.PropertyRepository;
import it.unina.dietiestates25.backend.repositories.UserRepository;
import it.unina.dietiestates25.backend.repositories.VisitRepository;
import it.unina.dietiestates25.backend.repositories.ListingImageRepository;

@Service
public class ListingService {

    private static final Logger log = LoggerFactory.getLogger(ListingService.class);
    private static final String DEBUG_END_MARKER = "=== FINE DEBUG ===";
    private static final String LISTINGS_UPLOADS_PATH = "/uploads/listings/";

    private final ListingRepository listingRepository;
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final AgencyRepository agencyRepository;
    private final NotificationService notificationService;
    private final OfferRepository offerRepository;
    private final VisitRepository visitRepository;
    private final ListingImageRepository listingImageRepository;
    private final ImageStorageService imageStorageService;
    // ✅ AGGIUNTO: EntityManager per gestire la cache di Hibernate
    private final jakarta.persistence.EntityManager entityManager;
    // ✅ AGGIUNTO: GoogleGeocodingService per geocodificare gli indirizzi
    private final GoogleGeocodingService googleGeocodingService;

    public ListingService(ListingRepository listingRepository, PropertyRepository propertyRepository,
            UserRepository userRepository, AgencyRepository agencyRepository,
            NotificationService notificationService, OfferRepository offerRepository,
            VisitRepository visitRepository, ListingImageRepository listingImageRepository,
            ImageStorageService imageStorageService,
            jakarta.persistence.EntityManager entityManager,
            GoogleGeocodingService googleGeocodingService) {
        this.listingRepository = listingRepository;
        this.propertyRepository = propertyRepository;
        this.userRepository = userRepository;
        this.agencyRepository = agencyRepository;
        this.notificationService = notificationService;
        this.offerRepository = offerRepository;
        this.visitRepository = visitRepository;
        this.listingImageRepository = listingImageRepository;
        this.imageStorageService = imageStorageService;
        this.entityManager = entityManager;
        this.googleGeocodingService = googleGeocodingService;
        // Inizializza la directory di storage all'avvio
        this.imageStorageService.init();
    }

    @Transactional(readOnly = true)
    public List<ListingResponse> getFilteredListings(ListingFilterRequest filters) {
        log.debug("=== DEBUG RICERCA BACKEND ===");
        log.debug("Filtri ricevuti dal frontend: city={}, type={}, status={}, propertyType={}, priceMin={}, priceMax={}, roomsMin={}, areaMin={}, areaMax={}, energyClass={}, elevator={}",
            filters.getCity(),
            filters.getType() != null ? filters.getType().name() : null,
            filters.getStatus() != null ? filters.getStatus().name() : null,
            filters.getPropertyType(),
            filters.getPriceMin(),
            filters.getPriceMax(),
            filters.getRoomsMin(),
            filters.getAreaMin(),
            filters.getAreaMax(),
            filters.getEnergyClass(),
            filters.getElevator());
        // Se status non è specificato, cerco solo annunci ACTIVE
        String status = filters.getStatus() != null ? filters.getStatus().name() : ListingStatus.ACTIVE.name();

        // Converto stringhe vuote in null per evitare problemi con la query
        String city = (filters.getCity() != null && !filters.getCity().trim().isEmpty())
                ? filters.getCity().trim()
                : null;
        String propertyType = (filters.getPropertyType() != null && !filters.getPropertyType().trim().isEmpty())
                ? filters.getPropertyType().trim()
                : null;
        String energyClass = (filters.getEnergyClass() != null && !filters.getEnergyClass().trim().isEmpty())
                ? filters.getEnergyClass().trim()
                : null;
        String type = filters.getType() != null ? filters.getType().name() : null;

        log.debug("Parametri query SQL: type={}, status={}, city={}, propertyType={}", type, status, city, propertyType);

        List<Listing> listings = listingRepository.findByFilters(
                type,
                status,
                city,
                propertyType, // AGGIUNTO: filtro per tipo di proprietà
                filters.getPriceMin(),
                filters.getPriceMax(),
                filters.getRoomsMin(),
                filters.getAreaMin(),
                filters.getAreaMax(),
                energyClass,
                filters.getElevator());

        log.debug("Risultati query SQL: {} listings trovati", listings.size());

        // Log dettagliato dei risultati
        for (int i = 0; i < listings.size(); i++) {
            Listing l = listings.get(i);
            log.debug("  [{}] {} - {}", i, l.getTitle(), l.getProperty().getCity());
        }

        log.debug(DEBUG_END_MARKER);

        return listings.stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ListingResponse getById(java.util.UUID id) {
        return listingRepository.findById(id).map(this::mapToResponse).orElse(null);
    }

    @Transactional(readOnly = true)
    public List<ListingResponse> getListingsByAgentId(java.util.UUID agentId) {
        List<Listing> listings = listingRepository.findAllByAgent_Id(agentId);
        log.debug("Recupero proprietà per agentId: {}", agentId);
        log.debug("Proprietà trovate: {}", listings.size());
        return listings.stream()
                .map(this::mapToResponse)
            .toList();
    }

    /**
     * Recupera tutti gli immobili dell'agenzia per il manager loggato
     */
    @Transactional(readOnly = true)
    public List<ListingResponse> getAllAgencyListings(java.util.UUID userId) {
        // Recupera l'utente (manager) dal database
        it.unina.dietiestates25.backend.entities.User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Verifica che l'utente abbia un'agenzia associata
        if (user.getAgencyId() == null) {
            throw new IllegalArgumentException("User does not have an associated agency");
        }

        java.util.UUID agencyId = user.getAgencyId();
        log.debug("Recupero immobili per agenzia: {}", agencyId);

        // Recupera tutti gli agenti dell'agenzia
        List<it.unina.dietiestates25.backend.entities.User> agents = userRepository.findByAgencyIdAndRole(
                agencyId,
                it.unina.dietiestates25.backend.entities.enums.UserRole.AGENT);

        log.debug("Agenti trovati: {}", agents.size());

        // Recupera tutti gli immobili degli agenti
        List<java.util.UUID> agentIds = agents.stream()
                .map(it.unina.dietiestates25.backend.entities.User::getId)
            .toList();

        List<Listing> listings = listingRepository.findByAgentIdIn(agentIds);
        log.debug("Immobili trovati: {}", listings.size());

        return listings.stream()
                .map(this::mapToResponse)
            .toList();
    }

    @Transactional
    public ListingResponse createListingWithProperty(
            java.util.UUID agentId,
            it.unina.dietiestates25.backend.dto.listing.CreateListingRequest request,
            List<MultipartFile> images) {

        // Validazione dei dati ricevuti
        if (request.getListing() == null || request.getListing().getType() == null) {
            throw new IllegalArgumentException("Listing type cannot be null");
        }

        log.debug("Listing type ricevuto: {}", request.getListing().getType());
        log.debug("Numero immagini ricevute: {}", images != null ? images.size() : 0);

        // Recupera l'agente dal database
        it.unina.dietiestates25.backend.entities.User agent = userRepository.findById(agentId)
                .orElseThrow(() -> new IllegalArgumentException("Agent not found"));

        // Verifica che l'agente abbia un'agenzia associata
        if (agent.getAgencyId() == null) {
            throw new IllegalArgumentException("Agent does not have an associated agency");
        }

        // Recupera l'agenzia dal database
        it.unina.dietiestates25.backend.entities.Agency agency = agencyRepository.findById(agent.getAgencyId())
                .orElseThrow(() -> new IllegalArgumentException("Agency not found"));

        // Crea la proprietà
        Property property = new Property();
        property.setCity(request.getProperty().getCity());
        property.setAddress(request.getProperty().getAddress());
        property.setPropertyType(request.getProperty().getPropertyType());
        property.setRooms(request.getProperty().getRooms());
        property.setBathrooms(request.getProperty().getBathrooms());
        property.setAreaM2(request.getProperty().getAreaM2());
        property.setFloor(request.getProperty().getFloor());
        property.setElevator(request.getProperty().isElevator());
        property.setEnergyClass(request.getProperty().getEnergyClass());
        property.setDescription(request.getProperty().getDescription());

        // Imposta l'agenzia della proprietà da quella dell'agente
        property.setAgency(agency);

        // ✅ GEOCODIFICA L'INDIRIZZO per ottenere coordinate GPS precise
        String fullAddress = request.getProperty().getAddress() + ", " + request.getProperty().getCity();
        log.debug("Geocoding indirizzo: {}", fullAddress);

        GoogleGeocodingService.GeocodingResult geocodingResult = googleGeocodingService.geocodeAddress(fullAddress);

        if (geocodingResult != null) {
            // Usa le coordinate geocodificate
            property.setLatitude(java.math.BigDecimal.valueOf(geocodingResult.latitude()));
            property.setLongitude(java.math.BigDecimal.valueOf(geocodingResult.longitude()));
            log.debug("Coordinate GPS ottenute: lat={}, lng={}", geocodingResult.latitude(), geocodingResult.longitude());
        } else {
            // Fallback: coordinate di default (centro Italia)
            log.warn("Geocoding fallito per: {} - uso coordinate di default", fullAddress);
            property.setLatitude(java.math.BigDecimal.valueOf(41.9028)); // Roma
            property.setLongitude(java.math.BigDecimal.valueOf(12.4964));
        }
        // Salva la proprietà
        property = propertyRepository.save(property);

        // Crea l'annuncio
        Listing listing = new Listing();
        listing.setProperty(property);
        listing.setAgent(agent);

        // Converti il tipo di annuncio (SALE -> SALE, RENT -> RENT)
        String listingTypeStr = request.getListing().getType();
        try {
            listing.setType(it.unina.dietiestates25.backend.entities.enums.ListingType.valueOf(listingTypeStr));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid listing type: " + listingTypeStr + ". Expected SALE or RENT");
        }

        listing.setTitle(request.getListing().getTitle());
        listing.setPriceAmount(request.getListing().getPriceAmount());
        listing.setCurrency(request.getListing().getCurrency());
        listing.setPublicText(request.getProperty().getDescription());

        // Salva l'annuncio
        listing = listingRepository.save(listing);

        // ✅ GESTIONE IMMAGINI
        if (images != null && !images.isEmpty()) {
            log.debug("Salvataggio {} immagini...", images.size());
            try {
                List<String> imagePaths = imageStorageService.storeImages(images, listing.getId());

                // Crea le entity ListingImage
                int sortOrder = 0;
                for (String imagePath : imagePaths) {
                    ListingImage listingImage = new ListingImage();
                    listingImage.setListing(listing);
                    // ✅ Salva URL completo per il frontend
                    listingImage.setUrl("http://localhost:8080" + LISTINGS_UPLOADS_PATH + imagePath);
                    listingImage.setSortOrder(sortOrder++);
                    listingImageRepository.save(listingImage);
                }

                log.debug("Salvate {} immagini per listing {}", imagePaths.size(), listing.getId());
            } catch (Exception e) {
                log.error("Errore nel salvataggio delle immagini: {}", e.getMessage(), e);
                // Non bloccare la creazione dell'annuncio se fallisce l'upload delle immagini
            }
        }

        // 📧 Verifica se il nuovo immobile corrisponde a ricerche salvate e invia
        // notifiche
        notificationService.checkMatchingSearchesAndNotify(listing);

        return mapToResponse(listing);
    }

    // Mantieni anche il vecchio metodo per retrocompatibilità
    @Transactional
    public ListingResponse createListingWithProperty(
            java.util.UUID agentId,
            it.unina.dietiestates25.backend.dto.listing.CreateListingRequest request) {
        return createListingWithProperty(agentId, request, null);
    }

    @Transactional
    public ListingResponse updateListing(
            java.util.UUID listingId,
            java.util.UUID userId,
            it.unina.dietiestates25.backend.dto.listing.UpdateListingRequest request) {

        log.debug("Aggiornamento listing ID: {}", listingId);

        // Recupera il listing esistente
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new IllegalArgumentException("Listing not found"));

        // Verifica che l'utente abbia i permessi (deve essere l'agente proprietario o
        // un manager della stessa agenzia)
        it.unina.dietiestates25.backend.entities.User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // 🔍 LOG DI DEBUG PER IL CHECK DI SICUREZZA
        log.debug("=== DEBUG CHECK SICUREZZA ===");
        log.debug("User ID: {}", userId);
        log.debug("User Role: {}", user.getRole());
        log.debug("User AgencyId: {}", user.getAgencyId());
        log.debug("Listing ID: {}", listingId);
        log.debug("Agent ID: {}", listing.getAgent().getId());
        log.debug("Agent AgencyId: {}", listing.getAgent().getAgencyId());

        boolean isAgent = listing.getAgent().getId().equals(userId);
        boolean isManager = user.getRole() == it.unina.dietiestates25.backend.entities.enums.UserRole.AGENCY_MANAGER
                && user.getAgencyId() != null
                && user.getAgencyId().equals(listing.getAgent().getAgencyId());

        log.debug("isAgent: {}", isAgent);
        log.debug("isManager: {}", isManager);
        log.debug(DEBUG_END_MARKER);

        if (!isAgent && !isManager) {
            throw new SecurityException("User does not have permission to update this listing");
        }

        // Salva il prezzo originale per rilevare variazioni
        int oldPrice = listing.getPriceAmount();
        boolean priceChanged = false;

        // Aggiorna i dati del listing
        if (request.getListing() != null) {
            it.unina.dietiestates25.backend.dto.listing.UpdateListingRequest.ListingUpdate listingUpdate = request
                    .getListing();

            if (listingUpdate.getTitle() != null) {
                listing.setTitle(listingUpdate.getTitle());
            }
            if (listingUpdate.getType() != null) {
                listing.setType(
                        it.unina.dietiestates25.backend.entities.enums.ListingType.valueOf(listingUpdate.getType()));
            }
            if (listingUpdate.getPriceAmount() != null && listingUpdate.getPriceAmount() != oldPrice) {
                priceChanged = true;
                listing.setPriceAmount(listingUpdate.getPriceAmount());
            }
            if (listingUpdate.getCurrency() != null) {
                listing.setCurrency(listingUpdate.getCurrency());
            }
            if (listingUpdate.getStatus() != null) {
                // Mappa lo status dal frontend al backend
                String status = listingUpdate.getStatus();
                log.debug("=== DEBUG CAMBIO STATUS ===");
                log.debug("Status ricevuto dal frontend: {}", status);
                log.debug("Status attuale nel DB: {}", listing.getStatus());

                if ("disponibile".equals(status)) {
                    listing.setStatus(ListingStatus.ACTIVE);
                    log.debug("Nuovo status impostato: ACTIVE");
                } else if ("venduto".equals(status)) {
                    listing.setStatus(ListingStatus.SOLD);
                    log.debug("Nuovo status impostato: SOLD");
                } else if ("affittato".equals(status)) {
                    listing.setStatus(ListingStatus.RENTED);
                    log.debug("Nuovo status impostato: RENTED");
                } else if ("in_trattativa".equals(status)) {
                    listing.setStatus(ListingStatus.SUSPENDED);
                    log.debug("Nuovo status impostato: SUSPENDED");
                } else {
                    log.warn("Status non riconosciuto: {}", status);
                }

                log.debug("Status dopo setStatus(): {}", listing.getStatus());
                log.debug(DEBUG_END_MARKER);
            }
        }

        // Aggiorna i dati della proprietà
        if (request.getProperty() != null) {
            Property property = listing.getProperty();
            it.unina.dietiestates25.backend.dto.listing.UpdateListingRequest.PropertyUpdate propertyUpdate = request
                    .getProperty();

            // ✅ Traccia se l'indirizzo è cambiato per ri-geocodificare
            boolean addressChanged = false;
            String oldAddress = property.getAddress();
            String oldCity = property.getCity();
            if (propertyUpdate.getCity() != null) {
                property.setCity(propertyUpdate.getCity());
                if (!propertyUpdate.getCity().equals(oldCity)) {
                    addressChanged = true;
                }
            }
            if (propertyUpdate.getAddress() != null) {
                property.setAddress(propertyUpdate.getAddress());
                if (!propertyUpdate.getAddress().equals(oldAddress)) {
                    addressChanged = true;
                }
            }
            if (propertyUpdate.getPropertyType() != null) {
                property.setPropertyType(propertyUpdate.getPropertyType());
            }
            if (propertyUpdate.getRooms() != null) {
                property.setRooms(propertyUpdate.getRooms());
            }
            if (propertyUpdate.getBathrooms() != null) {
                property.setBathrooms(propertyUpdate.getBathrooms());
            }
            if (propertyUpdate.getAreaM2() != null) {
                property.setAreaM2(propertyUpdate.getAreaM2());
            }
            if (propertyUpdate.getFloor() != null) {
                property.setFloor(propertyUpdate.getFloor());
            }
            if (propertyUpdate.getElevator() != null) {
                property.setElevator(propertyUpdate.getElevator());
            }
            if (propertyUpdate.getEnergyClass() != null) {
                property.setEnergyClass(propertyUpdate.getEnergyClass());
            }
            if (propertyUpdate.getDescription() != null) {
                property.setDescription(propertyUpdate.getDescription());
                listing.setPublicText(propertyUpdate.getDescription());
            }

            // ✅ Se l'indirizzo è cambiato, ri-geocodifica per ottenere nuove coordinate GPS
            if (addressChanged) {
                // ✅ PRIORITÀ 1: Usa le coordinate inviate dal frontend (da Google Places
                // Autocomplete)
                if (propertyUpdate.getLatitude() != null && propertyUpdate.getLongitude() != null) {
                    property.setLatitude(java.math.BigDecimal.valueOf(propertyUpdate.getLatitude()));
                    property.setLongitude(java.math.BigDecimal.valueOf(propertyUpdate.getLongitude()));
                        log.debug("Coordinate GPS ricevute dal frontend: lat={}, lng={}", propertyUpdate.getLatitude(), propertyUpdate.getLongitude());
                } else {
                    // ✅ PRIORITÀ 2: Fallback alla geocodifica lato server (solo se non ricevute dal
                    // frontend)
                    String fullAddress = property.getAddress() + ", " + property.getCity();
                    log.debug("Indirizzo modificato! Ri-geocoding: {}", fullAddress);

                    GoogleGeocodingService.GeocodingResult geocodingResult = googleGeocodingService
                            .geocodeAddress(fullAddress);

                    if (geocodingResult != null) {
                        property.setLatitude(java.math.BigDecimal.valueOf(geocodingResult.latitude()));
                        property.setLongitude(java.math.BigDecimal.valueOf(geocodingResult.longitude()));
                        log.debug("Coordinate GPS aggiornate: lat={}, lng={}", geocodingResult.latitude(), geocodingResult.longitude());
                    } else {
                        log.warn("Geocoding fallito per: {} - mantengo coordinate esistenti", fullAddress);
                    }
                }
            }

            propertyRepository.save(property);
        }

        // Salva il listing aggiornato
        listing = listingRepository.save(listing);

        // 📧 Se il prezzo è cambiato, invia notifiche ai clienti interessati
        if (priceChanged) {
            notifyInterestedClients(listing, oldPrice, listing.getPriceAmount());
        }

        log.debug("Listing aggiornato con successo");
        return mapToResponse(listing);
    }

    private void deleteListingImageSafely(String relativePath) {
        try {
            imageStorageService.deleteImage(relativePath);
            log.debug("File fisico eliminato: {}", relativePath);
        } catch (Exception e) {
            log.warn("Errore eliminazione file fisico: {}", e.getMessage());
        }
    }

    /**
     * Aggiorna un listing con gestione delle immagini (esistenti + nuove)
     */
    @Transactional
    public ListingResponse updateListingWithImages(
            java.util.UUID listingId,
            java.util.UUID userId,
            it.unina.dietiestates25.backend.dto.listing.UpdateListingRequest request,
            List<String> existingImageUrls,
            List<MultipartFile> newImages) {

        log.debug("=== AGGIORNAMENTO LISTING CON IMMAGINI ===");
        log.debug("Listing ID: {}", listingId);
        log.debug("Immagini esistenti da mantenere: {}", existingImageUrls != null ? existingImageUrls.size() : 0);
        log.debug("Nuove immagini da caricare: {}", newImages != null ? newImages.size() : 0);

        // Prima aggiorna i dati del listing (usa il metodo esistente)
        updateListing(listingId, userId, request);

        // Recupera il listing aggiornato
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new IllegalArgumentException("Listing not found"));

        // ✅ GESTIONE IMMAGINI
        try {
            // 1. Ottieni tutte le immagini attuali del listing
            List<ListingImage> currentImages = listingImageRepository.findByListingId(listingId);
            log.debug("Immagini attualmente nel DB: {}", currentImages.size());
            log.debug("=== DEBUG IMMAGINI CORRENTI ===");
            for (int i = 0; i < currentImages.size(); i++) {
                log.debug("  [{}] URL: {}", i, currentImages.get(i).getUrl());
            }
            log.debug("=== DEBUG IMMAGINI DA MANTENERE ===");
            if (existingImageUrls != null) {
                for (int i = 0; i < existingImageUrls.size(); i++) {
                    log.debug("  [{}] URL: {}", i, existingImageUrls.get(i));
                }
            } else {
                log.debug("  NESSUNA (existingImageUrls è null)");
            }
            log.debug(DEBUG_END_MARKER);

            // 2. Identifica le immagini da eliminare
            List<ListingImage> imagesToDelete = new java.util.ArrayList<>();
            if (existingImageUrls != null && !existingImageUrls.isEmpty()) {
                // Rimuovi solo le immagini che NON sono nella lista existingImageUrls
                for (ListingImage img : currentImages) {
                    boolean shouldKeep = existingImageUrls.contains(img.getUrl());
                    log.debug("Confronto: {} -> shouldKeep: {}", img.getUrl(), shouldKeep);
                    if (!shouldKeep) {
                        imagesToDelete.add(img);
                    }
                }
            } else {
                // Se existingImageUrls è vuoto, elimina tutte le immagini esistenti
                log.warn("existingImageUrls è vuoto o null - eliminazione di tutte le immagini");
                imagesToDelete.addAll(currentImages);
            }

            log.debug("Immagini da eliminare: {}", imagesToDelete.size());
            log.debug("Immagini da mantenere: {}", currentImages.size() - imagesToDelete.size());

            // 3. Elimina le immagini non volute
            // ✅ PRIMA: Elimina i file fisici
            for (ListingImage img : imagesToDelete) {
                log.debug("Eliminazione file fisico: {}", img.getUrl());

                // Estrai il path relativo dall'URL completo
                String url = img.getUrl();
                if (url.contains(LISTINGS_UPLOADS_PATH)) {
                    String relativePath = url
                            .substring(url.indexOf(LISTINGS_UPLOADS_PATH) + LISTINGS_UPLOADS_PATH.length());
                    deleteListingImageSafely(relativePath);
                }
            }

            // ✅ POI: Elimina dal database con query SQL diretta
            if (existingImageUrls != null && !existingImageUrls.isEmpty()) {
                // Elimina solo le immagini che NON sono nella lista existingImageUrls
                log.debug("Esecuzione DELETE SQL per immagini non in existingImageUrls");
                listingImageRepository.deleteByListingIdAndUrlNotIn(listingId, existingImageUrls);
                log.debug("DELETE SQL eseguito con successo");
            } else {
                // Elimina tutte le immagini
                log.debug("Esecuzione DELETE SQL per tutte le immagini");
                listingImageRepository.deleteAllByListingId(listingId);
                log.debug("DELETE SQL eseguito con successo");
            }

            // ✅ FLUSH delle modifiche per assicurare che siano persistite
            listingImageRepository.flush();

            // ✅ CRITICO: Clear della cache di Hibernate per forzare il reload dal DB
            // Questo risolve il problema delle entità eliminate che riappaiono dalla cache
            entityManager.clear();
            log.debug("Cache Hibernate svuotata - le prossime query caricheranno dati freschi dal DB");

            // 4. Carica le nuove immagini
            if (newImages != null && !newImages.isEmpty()) {
                log.debug("Caricamento {} nuove immagini...", newImages.size());

                List<String> newImagePaths = imageStorageService.storeImages(newImages, listingId);
                log.debug("File salvati: {}", newImagePaths.size());

                // ✅ USA QUERY NATIVA per bypassare completamente la cache
                List<ListingImage> remainingImages = listingImageRepository.findByListingIdNative(listingId);
                int nextSortOrder = remainingImages.size(); // Il prossimo sortOrder dopo le esistenti

                log.debug("Immagini rimaste dopo eliminazione: {}", remainingImages.size());
                log.debug("Prossimo sortOrder: {}", nextSortOrder);

                // Salva le nuove immagini nel database
                for (int i = 0; i < newImagePaths.size(); i++) {
                    ListingImage listingImage = new ListingImage();
                    listingImage.setListing(listing);
                    listingImage.setUrl("http://localhost:8080" + LISTINGS_UPLOADS_PATH + newImagePaths.get(i));
                    listingImage.setSortOrder(nextSortOrder + i);
                    listingImageRepository.save(listingImage);
                    log.debug("Salvata immagine {}/{} con sortOrder={}", i + 1, newImagePaths.size(), nextSortOrder + i);
                }

                log.debug("Salvate {} nuove immagini", newImagePaths.size());
            }

            // 5. Riordina le immagini esistenti mantenute (se necessario)
            if (existingImageUrls != null && !existingImageUrls.isEmpty()) {
                // ✅ USA QUERY NATIVA per recuperare le immagini DOPO l'eliminazione
                List<ListingImage> finalImages = listingImageRepository.findByListingIdNative(listingId);

                log.debug("=== RIORDINAMENTO IMMAGINI ===");
                log.debug("Immagini da riordinare: {}", finalImages.size());

                // Riordina in base all'ordine in existingImageUrls
                for (int i = 0; i < existingImageUrls.size(); i++) {
                    String urlToFind = existingImageUrls.get(i);
                    log.debug("Cerco URL per sortOrder {}: {}", i, urlToFind);

                    boolean found = false;
                    for (ListingImage img : finalImages) {
                        if (img.getUrl().equals(urlToFind)) {
                            found = true;
                            if (img.getSortOrder() != i) {
                                log.debug("Riordino immagine da sortOrder {} a {}", img.getSortOrder(), i);
                                img.setSortOrder(i);
                                listingImageRepository.save(img);
                            } else {
                                log.debug("Immagine già nel sortOrder corretto: {}", i);
                            }
                            break;
                        }
                    }

                    if (!found) {
                        log.warn("URL non trovato nelle immagini finali: {}", urlToFind);
                    }
                }

                // Flush finale per salvare i riordinamenti
                listingImageRepository.flush();
                log.debug("=== FINE RIORDINAMENTO ===");
            }

            // ✅ IMPORTANTE: USA QUERY NATIVA per il conteggio finale
            List<ListingImage> finalImagesCount = listingImageRepository.findByListingIdNative(listingId);
            log.debug("Gestione immagini completata. Totale immagini finali: {}", finalImagesCount.size());

        } catch (Exception e) {
            log.error("Errore nella gestione delle immagini: {}", e.getMessage(), e);
            // Non bloccare l'aggiornamento se fallisce la gestione delle immagini
        }

        // ✅ Ricarica il listing dal database per ottenere i dati freschi
        // Questo forzerà Hibernate a recuperare i dati aggiornati
        listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new IllegalArgumentException("Listing not found after update"));

        // Ritorna la response aggiornata con le nuove immagini
        return mapToResponse(listing);
    }

    /**
     * Invia notifiche ai clienti interessati quando cambia il prezzo di un immobile
     */
    private void notifyInterestedClients(Listing listing, int oldPrice, int newPrice) {
        log.debug("Variazione prezzo rilevata: da €{} a €{}", oldPrice, newPrice);

        // Recupera clienti con offerte attive per questo immobile
        List<it.unina.dietiestates25.backend.entities.Offer> offers = offerRepository
                .findAllByListing_Id(listing.getId());
        Set<java.util.UUID> notifiedClients = new java.util.HashSet<>();

        // Invia notifica ai clienti con offerte attive
        offers.stream()
                .filter(offer -> offer
                        .getStatus() == it.unina.dietiestates25.backend.entities.enums.OfferStatus.SUBMITTED ||
                        offer.getStatus() == it.unina.dietiestates25.backend.entities.enums.OfferStatus.COUNTEROFFER)
                .forEach(offer -> {
                    java.util.UUID clientId = offer.getClient().getId();
                    if (!notifiedClients.contains(clientId)) {
                        notificationService.createPriceChangeNotification(clientId, listing, oldPrice, newPrice);
                        notifiedClients.add(clientId);
                    }
                });

        // Recupera clienti con visite programmate per questo immobile
        List<it.unina.dietiestates25.backend.entities.Visit> visits = visitRepository
                .findAllByListing_Id(listing.getId());

        // Invia notifica ai clienti con visite future
        visits.stream()
                .filter(visit -> visit
                        .getStatus() == it.unina.dietiestates25.backend.entities.enums.VisitStatus.REQUESTED ||
                        visit.getStatus() == it.unina.dietiestates25.backend.entities.enums.VisitStatus.CONFIRMED)
                .forEach(visit -> {
                    java.util.UUID clientId = visit.getClient().getId();
                    if (!notifiedClients.contains(clientId)) {
                        notificationService.createPriceChangeNotification(clientId, listing, oldPrice, newPrice);
                        notifiedClients.add(clientId);
                    }
                });

            log.debug("Inviate {} notifiche per variazione prezzo", notifiedClients.size());
    }

    /**
     * 🗺️ Trova immobili in un'area geografica definita da bounds (lat/lng)
     * Utilizzato per ricerca per indirizzo con Google Maps API
     */
    @Transactional(readOnly = true)
    public List<it.unina.dietiestates25.backend.dto.listing.ListingResponseDto> findListingsInBounds(
            double minLat, double maxLat, double minLng, double maxLng,
            String type, Integer priceMin, Integer priceMax) {

        log.debug("Ricerca immobili in bounds geografici: lat=[{}, {}], lng=[{}, {}]", minLat, maxLat, minLng, maxLng);

        List<Listing> listings = listingRepository.findInGeoBounds(
                minLat, maxLat, minLng, maxLng, type, priceMin, priceMax);

        log.debug("Trovati {} immobili", listings.size());

        return listings.stream()
                .map(this::mapToResponseDto)
            .toList();
    }

    /**
     * Mapper per ListingResponseDto (usato per ricerca geografica)
     */
    private it.unina.dietiestates25.backend.dto.listing.ListingResponseDto mapToResponseDto(Listing listing) {
        it.unina.dietiestates25.backend.dto.listing.ListingResponseDto dto = new it.unina.dietiestates25.backend.dto.listing.ListingResponseDto();

        Property property = listing.getProperty();

        dto.setId(listing.getId());
        dto.setTitle(listing.getTitle());
        dto.setType(listing.getType());
        dto.setStatus(listing.getStatus());
        dto.setPriceAmount(listing.getPriceAmount());
        dto.setCurrency(listing.getCurrency());
        dto.setPublicText(listing.getPublicText());

        // Property info
        it.unina.dietiestates25.backend.dto.listing.ListingResponseDto.PropertyInfo propInfo = new it.unina.dietiestates25.backend.dto.listing.ListingResponseDto.PropertyInfo();
        propInfo.setCity(property.getCity());
        propInfo.setAddress(property.getAddress());
        propInfo.setLatitude(property.getLatitude());
        propInfo.setLongitude(property.getLongitude());
        propInfo.setPropertyType(property.getPropertyType());
        propInfo.setRooms(property.getRooms());
        propInfo.setBathrooms(property.getBathrooms());
        propInfo.setAreaM2(property.getAreaM2());
        propInfo.setFloor(property.getFloor());
        propInfo.setElevator(property.isElevator());
        propInfo.setEnergyClass(property.getEnergyClass());
        dto.setProperty(propInfo);

        // Images
        List<String> imageUrls = listing.getImages().stream()
                .map(ListingImage::getUrl)
            .toList();
        dto.setImageUrls(imageUrls);

        return dto;
    }

    private ListingResponse mapToResponse(Listing listing) {
        ListingResponse response = new ListingResponse();
        Property property = listing.getProperty();

        response.setId(listing.getId());
        response.setTitle(listing.getTitle());
        response.setDescription(listing.getPublicText());
        response.setType(listing.getType().name());
        response.setStatus(listing.getStatus().name());
        response.setPrice(listing.getPriceAmount());
        response.setCurrency(listing.getCurrency());

        // Dati dell'agente
        if (listing.getAgent() != null) {
            String agentName = listing.getAgent().getFirstName() + " " + listing.getAgent().getLastName();
            response.setAgentName(agentName);
            response.setAgentEmail(listing.getAgent().getEmail());
            response.setAgentPhone(listing.getAgent().getPhoneE164());

            // Dati dell'agenzia
            if (listing.getAgent().getAgencyId() != null) {
                agencyRepository.findById(listing.getAgent().getAgencyId())
                        .ifPresent(agency -> response.setAgencyName(agency.getName()));
            }
        }

        // Dati della proprietà
        if (property != null) {
            response.setAddress(property.getAddress());
            response.setCity(property.getCity());
            response.setPropertyType(property.getPropertyType());
            response.setRooms(property.getRooms());
            response.setBathrooms(property.getBathrooms()); // ✅ AGGIUNTO mapping bagni
            response.setArea(property.getAreaM2());
            response.setFloor(property.getFloor());
            response.setEnergyClass(property.getEnergyClass());
            response.setHasElevator(property.isElevator());

            // Converti BigDecimal a Double per les coordinate
            response.setLatitude(property.getLatitude() != null ? property.getLatitude().doubleValue() : null);
            response.setLongitude(property.getLongitude() != null ? property.getLongitude().doubleValue() : null);
        }

        // Immagini
        List<String> imageUrls = listing.getImages().stream()
                .map(ListingImage::getUrl)
            .toList();
        response.setImageUrls(imageUrls);

        return response;
    }
}
