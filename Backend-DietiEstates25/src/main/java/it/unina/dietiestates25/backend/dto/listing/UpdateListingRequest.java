package it.unina.dietiestates25.backend.dto.listing;

import com.fasterxml.jackson.annotation.JsonProperty;

public class UpdateListingRequest {

    private PropertyUpdate property;
    private ListingUpdate listing;

    
    public UpdateListingRequest() {
    }

    public UpdateListingRequest(PropertyUpdate property, ListingUpdate listing) {
        this.property = property;
        this.listing = listing;
    }

    public PropertyUpdate getProperty() {
        return property;
    }

    public void setProperty(PropertyUpdate property) {
        this.property = property;
    }

    public ListingUpdate getListing() {
        return listing;
    }

    public void setListing(ListingUpdate listing) {
        this.listing = listing;
    }

    public static class PropertyUpdate {
        @JsonProperty("city")
        private String city;
        @JsonProperty("address")
        private String address;
        @JsonProperty("property_type")
        private String propertyType;
        @JsonProperty("rooms")
        private Integer rooms;
        @JsonProperty("bathrooms")
        private Integer bathrooms;
        @JsonProperty("area_m2")
        private Integer areaM2;
        @JsonProperty("floor")
        private Integer floor;
        @JsonProperty("elevator")
        private Boolean elevator;
        @JsonProperty("energy_class")
        private String energyClass;
        @JsonProperty("description")
        private String description;
        @JsonProperty("latitude")
        private Double latitude;
        @JsonProperty("longitude")
        private Double longitude;

        
        public PropertyUpdate() {
        }

        public String getCity() {
            return city;
        }

        public void setCity(String city) {
            this.city = city;
        }

        public String getAddress() {
            return address;
        }

        public void setAddress(String address) {
            this.address = address;
        }

        public String getPropertyType() {
            return propertyType;
        }

        public void setPropertyType(String propertyType) {
            this.propertyType = propertyType;
        }

        public Integer getRooms() {
            return rooms;
        }

        public void setRooms(Integer rooms) {
            this.rooms = rooms;
        }

        public Integer getBathrooms() {
            return bathrooms;
        }

        public void setBathrooms(Integer bathrooms) {
            this.bathrooms = bathrooms;
        }

        public Integer getAreaM2() {
            return areaM2;
        }

        public void setAreaM2(Integer areaM2) {
            this.areaM2 = areaM2;
        }

        public Integer getFloor() {
            return floor;
        }

        public void setFloor(Integer floor) {
            this.floor = floor;
        }

        public Boolean getElevator() {
            return elevator;
        }

        public void setElevator(Boolean elevator) {
            this.elevator = elevator;
        }

        public String getEnergyClass() {
            return energyClass;
        }

        public void setEnergyClass(String energyClass) {
            this.energyClass = energyClass;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public Double getLatitude() {
            return latitude;
        }

        public void setLatitude(Double latitude) {
            this.latitude = latitude;
        }

        public Double getLongitude() {
            return longitude;
        }

        public void setLongitude(Double longitude) {
            this.longitude = longitude;
        }
    }

    public static class ListingUpdate {
        @JsonProperty("title")
        private String title;
        @JsonProperty("type")
        private String type;
        @JsonProperty("listing_type")
        private String listingType;
        @JsonProperty("price_amount")
        private Integer priceAmount;
        @JsonProperty("currency")
        private String currency;
        @JsonProperty("status")
        private String status;

        
        public ListingUpdate() {
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getType() {
            return type != null ? type : listingType;
        }

        public void setType(String type) {
            this.type = type;
        }

        public String getListingType() {
            return listingType;
        }

        public void setListingType(String listingType) {
            this.listingType = listingType;
        }

        public Integer getPriceAmount() {
            return priceAmount;
        }

        public void setPriceAmount(Integer priceAmount) {
            this.priceAmount = priceAmount;
        }

        public String getCurrency() {
            return currency;
        }

        public void setCurrency(String currency) {
            this.currency = currency;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }
    }
}
