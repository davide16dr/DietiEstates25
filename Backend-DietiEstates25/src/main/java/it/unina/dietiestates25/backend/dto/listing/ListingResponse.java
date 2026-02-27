package it.unina.dietiestates25.backend.dto.listing;

import java.util.List;
import java.util.UUID;

public class ListingResponse {
    private UUID id;
    private String title;
    private String description;
    private String type; // "SALE" o "RENT"
    private String status; // "ACTIVE", "SOLD", etc.
    private Integer price;
    private String currency;
    
    // Dati della proprietà
    private String address;
    private String city;
    private String propertyType; // "Appartamento", "Villa", "Attico", etc.
    private Integer rooms;
    private Integer area;
    private Integer floor;
    private String energyClass;
    private Boolean hasElevator;
    
    // Coordinate per la mappa
    private Double latitude;
    private Double longitude;
    
    // Immagini
    private List<String> imageUrls;
    
    // Costruttore vuoto
    public ListingResponse() {}

    // Getters e Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getPrice() { return price; }
    public void setPrice(Integer price) { this.price = price; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getPropertyType() { return propertyType; }
    public void setPropertyType(String propertyType) { this.propertyType = propertyType; }

    public Integer getRooms() { return rooms; }
    public void setRooms(Integer rooms) { this.rooms = rooms; }

    public Integer getArea() { return area; }
    public void setArea(Integer area) { this.area = area; }

    public Integer getFloor() { return floor; }
    public void setFloor(Integer floor) { this.floor = floor; }

    public String getEnergyClass() { return energyClass; }
    public void setEnergyClass(String energyClass) { this.energyClass = energyClass; }

    public Boolean getHasElevator() { return hasElevator; }
    public void setHasElevator(Boolean hasElevator) { this.hasElevator = hasElevator; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public List<String> getImageUrls() { return imageUrls; }
    public void setImageUrls(List<String> imageUrls) { this.imageUrls = imageUrls; }
}
