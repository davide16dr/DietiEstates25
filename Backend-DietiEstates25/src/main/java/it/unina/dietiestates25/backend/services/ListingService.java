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
    
    private final jakarta.persistence.EntityManager entityManager;
    
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
        
        String status = filters.getStatus() != null ? filters.getStatus().name() : ListingStatus.ACTIVE.name();

        
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
                propertyType, 
                filters.getPriceMin(),
                filters.getPriceMax(),
                filters.getRoomsMin(),
                filters.getAreaMin(),
                filters.getAreaMax(),
                energyClass,
                filters.getElevator());

        log.debug("Risultati query SQL: {} listings trovati", listings.size());

        
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

    


    @Transactional(readOnly = true)
    public List<ListingResponse> getAllAgencyListings(java.util.UUID userId) {
        
        it.unina.dietiestates25.backend.entities.User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        
        if (user.getAgencyId() == null) {
            throw new IllegalArgumentException("User does not have an associated agency");
        }

        java.util.UUID agencyId = user.getAgencyId();
        log.debug("Recupero immobili per agenzia: {}", agencyId);

        
        List<it.unina.dietiestates25.backend.entities.User> agents = userRepository.findByAgencyIdAndRole(
                agencyId,
                it.unina.dietiestates25.backend.entities.enums.UserRole.AGENT);

        log.debug("Agenti trovati: {}", agents.size());

        
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

        
        if (request.getListing() == null || request.getListing().getType() == null) {
            throw new IllegalArgumentException("Listing type cannot be null");
        }

        log.debug("Listing type ricevuto: {}", request.getListing().getType());
        log.debug("Numero immagini ricevute: {}", images != null ? images.size() : 0);

        
        it.unina.dietiestates25.backend.entities.User agent = userRepository.findById(agentId)
                .orElseThrow(() -> new IllegalArgumentException("Agent not found"));

        
        if (agent.getAgencyId() == null) {
            throw new IllegalArgumentException("Agent does not have an associated agency");
        }

        
        it.unina.dietiestates25.backend.entities.Agency agency = agencyRepository.findById(agent.getAgencyId())
                .orElseThrow(() -> new IllegalArgumentException("Agency not found"));

        
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

        
        property.setAgency(agency);

        
        String fullAddress = request.getProperty().getAddress() + ", " + request.getProperty().getCity();
        log.debug("Geocoding indirizzo: {}", fullAddress);

        GoogleGeocodingService.GeocodingResult geocodingResult = googleGeocodingService.geocodeAddress(fullAddress);

        if (geocodingResult != null) {
            
            property.setLatitude(java.math.BigDecimal.valueOf(geocodingResult.latitude()));
            property.setLongitude(java.math.BigDecimal.valueOf(geocodingResult.longitude()));
            log.debug("Coordinate GPS ottenute: lat={}, lng={}", geocodingResult.latitude(), geocodingResult.longitude());
        } else {
            
            log.warn("Geocoding fallito per: {} - uso coordinate di default", fullAddress);
            property.setLatitude(java.math.BigDecimal.valueOf(41.9028)); 
            property.setLongitude(java.math.BigDecimal.valueOf(12.4964));
        }
        
        property = propertyRepository.save(property);

        
        Listing listing = new Listing();
        listing.setProperty(property);
        listing.setAgent(agent);

        
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

        
        listing = listingRepository.save(listing);

        
        if (images != null && !images.isEmpty()) {
            log.debug("Salvataggio {} immagini...", images.size());
            try {
                List<String> imagePaths = imageStorageService.storeImages(images, listing.getId());

                
                int sortOrder = 0;
                for (String imagePath : imagePaths) {
                    ListingImage listingImage = new ListingImage();
                    listingImage.setListing(listing);
                    
                    listingImage.setUrl("http://localhost:8080" + LISTINGS_UPLOADS_PATH + imagePath);
                    listingImage.setSortOrder(sortOrder++);
                    listingImageRepository.save(listingImage);
                }

                log.debug("Salvate {} immagini per listing {}", imagePaths.size(), listing.getId());
            } catch (Exception e) {
                log.error("Errore nel salvataggio delle immagini: {}", e.getMessage(), e);
                
            }
        }

        
        
        notificationService.checkMatchingSearchesAndNotify(listing);

        return mapToResponse(listing);
    }

    
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

        
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new IllegalArgumentException("Listing not found"));

        
        
        it.unina.dietiestates25.backend.entities.User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        
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

        int oldPrice = listing.getPriceAmount();
        boolean priceChanged = applyListingUpdate(listing, request.getListing(), oldPrice);
        applyPropertyUpdate(listing, request.getProperty());

        
        listing = listingRepository.save(listing);

        
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

    private boolean applyListingUpdate(Listing listing,
            it.unina.dietiestates25.backend.dto.listing.UpdateListingRequest.ListingUpdate listingUpdate,
            int oldPrice) {
        if (listingUpdate == null) {
            return false;
        }

        boolean priceChanged = false;

        if (listingUpdate.getTitle() != null) {
            listing.setTitle(listingUpdate.getTitle());
        }
        if (listingUpdate.getType() != null) {
            listing.setType(it.unina.dietiestates25.backend.entities.enums.ListingType.valueOf(listingUpdate.getType()));
        }
        if (listingUpdate.getPriceAmount() != null && listingUpdate.getPriceAmount() != oldPrice) {
            priceChanged = true;
            listing.setPriceAmount(listingUpdate.getPriceAmount());
        }
        if (listingUpdate.getCurrency() != null) {
            listing.setCurrency(listingUpdate.getCurrency());
        }
        if (listingUpdate.getStatus() != null) {
            applyListingStatus(listing, listingUpdate.getStatus());
        }

        return priceChanged;
    }

    private void applyListingStatus(Listing listing, String status) {
        log.debug("=== DEBUG CAMBIO STATUS ===");
        log.debug("Status ricevuto dal frontend: {}", status);
        log.debug("Status attuale nel DB: {}", listing.getStatus());

        switch (status) {
            case "disponibile" -> {
                listing.setStatus(ListingStatus.ACTIVE);
                log.debug("Nuovo status impostato: ACTIVE");
            }
            case "venduto" -> {
                listing.setStatus(ListingStatus.SOLD);
                log.debug("Nuovo status impostato: SOLD");
            }
            case "affittato" -> {
                listing.setStatus(ListingStatus.RENTED);
                log.debug("Nuovo status impostato: RENTED");
            }
            case "in_trattativa" -> {
                listing.setStatus(ListingStatus.SUSPENDED);
                log.debug("Nuovo status impostato: SUSPENDED");
            }
            default -> log.warn("Status non riconosciuto: {}", status);
        }

        log.debug("Status dopo setStatus(): {}", listing.getStatus());
        log.debug(DEBUG_END_MARKER);
    }

    private void applyPropertyUpdate(Listing listing,
            it.unina.dietiestates25.backend.dto.listing.UpdateListingRequest.PropertyUpdate propertyUpdate) {
        if (propertyUpdate == null) {
            return;
        }

        Property property = listing.getProperty();
        boolean addressChanged = false;
        String oldAddress = property.getAddress();
        String oldCity = property.getCity();

        if (propertyUpdate.getCity() != null) {
            property.setCity(propertyUpdate.getCity());
            addressChanged = !propertyUpdate.getCity().equals(oldCity) || addressChanged;
        }
        if (propertyUpdate.getAddress() != null) {
            property.setAddress(propertyUpdate.getAddress());
            addressChanged = !propertyUpdate.getAddress().equals(oldAddress) || addressChanged;
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

        if (addressChanged) {
            updatePropertyCoordinates(property, propertyUpdate);
        }

        propertyRepository.save(property);
    }

    private void updatePropertyCoordinates(Property property,
            it.unina.dietiestates25.backend.dto.listing.UpdateListingRequest.PropertyUpdate propertyUpdate) {
        if (propertyUpdate.getLatitude() != null && propertyUpdate.getLongitude() != null) {
            property.setLatitude(java.math.BigDecimal.valueOf(propertyUpdate.getLatitude()));
            property.setLongitude(java.math.BigDecimal.valueOf(propertyUpdate.getLongitude()));
            log.debug("Coordinate GPS ricevute dal frontend: lat={}, lng={}", propertyUpdate.getLatitude(),
                    propertyUpdate.getLongitude());
            return;
        }

        String fullAddress = property.getAddress() + ", " + property.getCity();
        log.debug("Indirizzo modificato! Ri-geocoding: {}", fullAddress);

        GoogleGeocodingService.GeocodingResult geocodingResult = googleGeocodingService.geocodeAddress(fullAddress);

        if (geocodingResult != null) {
            property.setLatitude(java.math.BigDecimal.valueOf(geocodingResult.latitude()));
            property.setLongitude(java.math.BigDecimal.valueOf(geocodingResult.longitude()));
            log.debug("Coordinate GPS aggiornate: lat={}, lng={}", geocodingResult.latitude(),
                    geocodingResult.longitude());
        } else {
            log.warn("Geocoding fallito per: {} - mantengo coordinate esistenti", fullAddress);
        }
    }

    private void logCurrentAndKeptImages(List<ListingImage> currentImages, List<String> existingImageUrls) {
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
    }

    private List<ListingImage> determineImagesToDelete(List<ListingImage> currentImages, List<String> existingImageUrls) {
        List<ListingImage> imagesToDelete = new java.util.ArrayList<>();
        if (existingImageUrls != null && !existingImageUrls.isEmpty()) {
            for (ListingImage img : currentImages) {
                boolean shouldKeep = existingImageUrls.contains(img.getUrl());
                log.debug("Confronto: {} -> shouldKeep: {}", img.getUrl(), shouldKeep);
                if (!shouldKeep) {
                    imagesToDelete.add(img);
                }
            }
        } else {
            log.warn("existingImageUrls è vuoto o null - eliminazione di tutte le immagini");
            imagesToDelete.addAll(currentImages);
        }

        log.debug("Immagini da eliminare: {}", imagesToDelete.size());
        log.debug("Immagini da mantenere: {}", currentImages.size() - imagesToDelete.size());
        return imagesToDelete;
    }

    private void deleteImagesAndFlush(java.util.UUID listingId, List<String> existingImageUrls,
            List<ListingImage> imagesToDelete) {
        for (ListingImage img : imagesToDelete) {
            log.debug("Eliminazione file fisico: {}", img.getUrl());
            String url = img.getUrl();
            if (url.contains(LISTINGS_UPLOADS_PATH)) {
                String relativePath = url.substring(url.indexOf(LISTINGS_UPLOADS_PATH) + LISTINGS_UPLOADS_PATH.length());
                deleteListingImageSafely(relativePath);
            }
        }

        if (existingImageUrls != null && !existingImageUrls.isEmpty()) {
            log.debug("Esecuzione DELETE SQL per immagini non in existingImageUrls");
            listingImageRepository.deleteByListingIdAndUrlNotIn(listingId, existingImageUrls);
        } else {
            log.debug("Esecuzione DELETE SQL per tutte le immagini");
            listingImageRepository.deleteAllByListingId(listingId);
        }

        log.debug("DELETE SQL eseguito con successo");
        listingImageRepository.flush();
        entityManager.clear();
        log.debug("Cache Hibernate svuotata - le prossime query caricheranno dati freschi dal DB");
    }

    private void storeNewImages(Listing listing, java.util.UUID listingId, List<MultipartFile> newImages) {
        if (newImages == null || newImages.isEmpty()) {
            return;
        }

        log.debug("Caricamento {} nuove immagini...", newImages.size());
        List<String> newImagePaths = imageStorageService.storeImages(newImages, listingId);
        log.debug("File salvati: {}", newImagePaths.size());

        List<ListingImage> remainingImages = listingImageRepository.findByListingIdNative(listingId);
        int nextSortOrder = remainingImages.size();

        log.debug("Immagini rimaste dopo eliminazione: {}", remainingImages.size());
        log.debug("Prossimo sortOrder: {}", nextSortOrder);

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

    private void reorderKeptImages(java.util.UUID listingId, List<String> existingImageUrls) {
        if (existingImageUrls == null || existingImageUrls.isEmpty()) {
            return;
        }

        List<ListingImage> finalImages = listingImageRepository.findByListingIdNative(listingId);

        log.debug("=== RIORDINAMENTO IMMAGINI ===");
        log.debug("Immagini da riordinare: {}", finalImages.size());

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

        listingImageRepository.flush();
        log.debug("=== FINE RIORDINAMENTO ===");
    }

    


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

        
        updateListing(listingId, userId, request);

        
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new IllegalArgumentException("Listing not found"));

        
        try {
            List<ListingImage> currentImages = listingImageRepository.findByListingId(listingId);
            logCurrentAndKeptImages(currentImages, existingImageUrls);
            List<ListingImage> imagesToDelete = determineImagesToDelete(currentImages, existingImageUrls);
            deleteImagesAndFlush(listingId, existingImageUrls, imagesToDelete);
            storeNewImages(listing, listingId, newImages);
            reorderKeptImages(listingId, existingImageUrls);

            List<ListingImage> finalImagesCount = listingImageRepository.findByListingIdNative(listingId);
            log.debug("Gestione immagini completata. Totale immagini finali: {}", finalImagesCount.size());

        } catch (Exception e) {
            log.error("Errore nella gestione delle immagini: {}", e.getMessage(), e);
            
        }

        
        
        listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new IllegalArgumentException("Listing not found after update"));

        
        return mapToResponse(listing);
    }

    


    private void notifyInterestedClients(Listing listing, int oldPrice, int newPrice) {
        log.debug("Variazione prezzo rilevata: da €{} a €{}", oldPrice, newPrice);

        
        List<it.unina.dietiestates25.backend.entities.Offer> offers = offerRepository
                .findAllByListing_Id(listing.getId());
        Set<java.util.UUID> notifiedClients = new java.util.HashSet<>();

        
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

        
        List<it.unina.dietiestates25.backend.entities.Visit> visits = visitRepository
                .findAllByListing_Id(listing.getId());

        
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

        
        if (listing.getAgent() != null) {
            String agentName = listing.getAgent().getFirstName() + " " + listing.getAgent().getLastName();
            response.setAgentName(agentName);
            response.setAgentEmail(listing.getAgent().getEmail());
            response.setAgentPhone(listing.getAgent().getPhoneE164());

            
            if (listing.getAgent().getAgencyId() != null) {
                agencyRepository.findById(listing.getAgent().getAgencyId())
                        .ifPresent(agency -> response.setAgencyName(agency.getName()));
            }
        }

        
        if (property != null) {
            response.setAddress(property.getAddress());
            response.setCity(property.getCity());
            response.setPropertyType(property.getPropertyType());
            response.setRooms(property.getRooms());
            response.setBathrooms(property.getBathrooms()); 
            response.setArea(property.getAreaM2());
            response.setFloor(property.getFloor());
            response.setEnergyClass(property.getEnergyClass());
            response.setHasElevator(property.isElevator());

            
            response.setLatitude(property.getLatitude() != null ? property.getLatitude().doubleValue() : null);
            response.setLongitude(property.getLongitude() != null ? property.getLongitude().doubleValue() : null);
        }

        
        List<String> imageUrls = listing.getImages().stream()
                .map(ListingImage::getUrl)
            .toList();
        response.setImageUrls(imageUrls);

        return response;
    }
}
