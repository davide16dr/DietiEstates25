package it.unina.dietiestates25.backend.services;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import it.unina.dietiestates25.backend.dto.listing.ListingFilterRequest;
import it.unina.dietiestates25.backend.dto.listing.ListingResponse;
import it.unina.dietiestates25.backend.entities.Listing;
import it.unina.dietiestates25.backend.entities.ListingImage;
import it.unina.dietiestates25.backend.entities.Property;
import it.unina.dietiestates25.backend.entities.enums.ListingStatus;
import it.unina.dietiestates25.backend.repositories.AgencyRepository;
import it.unina.dietiestates25.backend.repositories.ListingRepository;
import it.unina.dietiestates25.backend.repositories.PropertyRepository;
import it.unina.dietiestates25.backend.repositories.UserRepository;

@Service
public class ListingService {

    private final ListingRepository listingRepository;
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final AgencyRepository agencyRepository;

    public ListingService(ListingRepository listingRepository, PropertyRepository propertyRepository, UserRepository userRepository, AgencyRepository agencyRepository) {
        this.listingRepository = listingRepository;
        this.propertyRepository = propertyRepository;
        this.userRepository = userRepository;
        this.agencyRepository = agencyRepository;
    }

    @Transactional(readOnly = true)
    public List<ListingResponse> getFilteredListings(ListingFilterRequest filters) {
        // Se status non è specificato, cerco solo annunci ACTIVE
        String status = filters.getStatus() != null ? 
            filters.getStatus().name() : ListingStatus.ACTIVE.name();

        // Converto stringhe vuote in null per evitare problemi con la query
        String city = (filters.getCity() != null && !filters.getCity().trim().isEmpty()) 
            ? filters.getCity().trim() : null;
        String propertyType = (filters.getPropertyType() != null && !filters.getPropertyType().trim().isEmpty()) 
            ? filters.getPropertyType().trim() : null;
        String energyClass = (filters.getEnergyClass() != null && !filters.getEnergyClass().trim().isEmpty()) 
            ? filters.getEnergyClass().trim() : null;
        String type = filters.getType() != null ? filters.getType().name() : null;

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
            filters.getElevator()
        );

        return listings.stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ListingResponse getById(java.util.UUID id) {
        return listingRepository.findById(id).map(this::mapToResponse).orElse(null);
    }

    @Transactional(readOnly = true)
    public List<ListingResponse> getListingsByAgentId(java.util.UUID agentId) {
        List<Listing> listings = listingRepository.findAllByAgent_Id(agentId);
        System.out.println("Recupero proprietà per agentId: " + agentId);
        System.out.println("Proprietà trovate: " + listings.size());
        return listings.stream()
            .map(this::mapToResponse)
            .collect(Collectors.toList());
    }

    @Transactional
    public ListingResponse createListingWithProperty(
            java.util.UUID agentId,
            it.unina.dietiestates25.backend.dto.listing.CreateListingRequest request) {
        
        // Validazione dei dati ricevuti
        if (request.getListing() == null || request.getListing().getType() == null) {
            throw new IllegalArgumentException("Listing type cannot be null");
        }
        
        System.out.println("Listing type ricevuto: " + request.getListing().getType());
        
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
        
        // TODO: Implementare geolocalizzazione reale
        // Per ora usiamo valori di default (coordinate di Napoli)
        java.math.BigDecimal defaultLatitude = new java.math.BigDecimal("40.8517");
        java.math.BigDecimal defaultLongitude = new java.math.BigDecimal("14.2681");
        property.setLatitude(defaultLatitude);
        property.setLongitude(defaultLongitude);
        
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
        
        return mapToResponse(listing);
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

        // Dati della proprietà
        if (property != null) {
            response.setAddress(property.getAddress());
            response.setCity(property.getCity());
            response.setPropertyType(property.getPropertyType()); // AGGIUNTO propertyType
            response.setRooms(property.getRooms());
            response.setArea(property.getAreaM2()); // Corretto da getTotalArea() a getAreaM2()
            response.setFloor(property.getFloor());
            response.setEnergyClass(property.getEnergyClass());
            response.setHasElevator(property.isElevator()); // Corretto da getHasElevator() a isElevator()
            
            // Converti BigDecimal a Double per le coordinate
            response.setLatitude(property.getLatitude() != null ? property.getLatitude().doubleValue() : null);
            response.setLongitude(property.getLongitude() != null ? property.getLongitude().doubleValue() : null);
        }

        // Immagini
        List<String> imageUrls = listing.getImages().stream()
            .map(ListingImage::getUrl)
            .collect(Collectors.toList());
        response.setImageUrls(imageUrls);

        return response;
    }
}
