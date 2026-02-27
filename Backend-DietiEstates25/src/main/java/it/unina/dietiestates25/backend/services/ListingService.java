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
import it.unina.dietiestates25.backend.repositories.ListingRepository;

@Service
public class ListingService {

    private final ListingRepository listingRepository;

    public ListingService(ListingRepository listingRepository) {
        this.listingRepository = listingRepository;
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
