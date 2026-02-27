package it.unina.dietiestates25.backend.dto.listing;

import it.unina.dietiestates25.backend.entities.enums.ListingStatus;
import it.unina.dietiestates25.backend.entities.enums.ListingType;

public class ListingFilterRequest {
    private ListingType type; // SALE o RENT
    private ListingStatus status; // ACTIVE, SOLD, etc.
    private String city;
    private String propertyType; // Appartamento, Villa, Attico, etc.
    private Integer priceMin;
    private Integer priceMax;
    private Integer roomsMin;
    private Integer areaMin;
    private Integer areaMax;
    private String energyClass;
    private Boolean elevator;

    public ListingType getType() { return type; }
    public void setType(ListingType type) { this.type = type; }

    public ListingStatus getStatus() { return status; }
    public void setStatus(ListingStatus status) { this.status = status; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getPropertyType() { return propertyType; }
    public void setPropertyType(String propertyType) { this.propertyType = propertyType; }

    public Integer getPriceMin() { return priceMin; }
    public void setPriceMin(Integer priceMin) { this.priceMin = priceMin; }

    public Integer getPriceMax() { return priceMax; }
    public void setPriceMax(Integer priceMax) { this.priceMax = priceMax; }

    public Integer getRoomsMin() { return roomsMin; }
    public void setRoomsMin(Integer roomsMin) { this.roomsMin = roomsMin; }

    public Integer getAreaMin() { return areaMin; }
    public void setAreaMin(Integer areaMin) { this.areaMin = areaMin; }

    public Integer getAreaMax() { return areaMax; }
    public void setAreaMax(Integer areaMax) { this.areaMax = areaMax; }

    public String getEnergyClass() { return energyClass; }
    public void setEnergyClass(String energyClass) { this.energyClass = energyClass; }

    public Boolean getElevator() { return elevator; }
    public void setElevator(Boolean elevator) { this.elevator = elevator; }
}
