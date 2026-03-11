package it.unina.dietiestates25.backend.dto.listing;

import it.unina.dietiestates25.backend.entities.enums.ListingStatus;
import it.unina.dietiestates25.backend.entities.enums.ListingType;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
public class ListingResponseDto {
    private UUID id;
    private String title;
    private ListingType type;
    private ListingStatus status;
    private Integer priceAmount;
    private String currency;
    private String publicText;
    private PropertyInfo property;
    private List<String> imageUrls;

    @Data
    public static class PropertyInfo {
        private String city;
        private String address;
        private BigDecimal latitude;
        private BigDecimal longitude;
        private String propertyType;
        private Integer rooms;
        private Integer bathrooms;
        private Integer areaM2;
        private Integer floor;
        private boolean elevator;
        private String energyClass;
    }
}
