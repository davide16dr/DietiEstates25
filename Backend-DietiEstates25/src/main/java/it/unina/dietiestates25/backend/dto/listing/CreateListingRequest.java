package it.unina.dietiestates25.backend.dto.listing;

import com.fasterxml.jackson.annotation.JsonProperty;

public class CreateListingRequest {
    
    private PropertyRequest property;
    private ListingRequest listing;

    public CreateListingRequest() {
        // Required by Jackson for request deserialization.
    }

    public CreateListingRequest(PropertyRequest property, ListingRequest listing) {
        this.property = property;
        this.listing = listing;
    }

    public PropertyRequest getProperty() {
        return property;
    }

    public void setProperty(PropertyRequest property) {
        this.property = property;
    }

    public ListingRequest getListing() {
        return listing;
    }

    public void setListing(ListingRequest listing) {
        this.listing = listing;
    }

    public static class PropertyRequest {
        @JsonProperty("city")
        private String city;
        @JsonProperty("address")
        private String address;
        @JsonProperty("property_type")
        private String propertyType;
        @JsonProperty("rooms")
        private int rooms;
        @JsonProperty("bathrooms")
        private int bathrooms;
        @JsonProperty("area_m2")
        private int areaM2;
        @JsonProperty("floor")
        private int floor;
        @JsonProperty("elevator")
        private boolean elevator;
        @JsonProperty("energy_class")
        private String energyClass;
        @JsonProperty("description")
        private String description;

        public PropertyRequest() {
            // Required by Jackson for request deserialization.
        }

        public String getCity() { return city; }
        public void setCity(String city) { this.city = city; }

        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }

        public String getPropertyType() { return propertyType; }
        public void setPropertyType(String propertyType) { this.propertyType = propertyType; }

        public int getRooms() { return rooms; }
        public void setRooms(int rooms) { this.rooms = rooms; }

        public int getBathrooms() { return bathrooms; }
        public void setBathrooms(int bathrooms) { this.bathrooms = bathrooms; }

        public int getAreaM2() { return areaM2; }
        public void setAreaM2(int areaM2) { this.areaM2 = areaM2; }

        public int getFloor() { return floor; }
        public void setFloor(int floor) { this.floor = floor; }

        public boolean isElevator() { return elevator; }
        public void setElevator(boolean elevator) { this.elevator = elevator; }

        public String getEnergyClass() { return energyClass; }
        public void setEnergyClass(String energyClass) { this.energyClass = energyClass; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }

    public static class ListingRequest {
        @JsonProperty("title")
        private String title;
        @JsonProperty("type")
        private String type;
        @JsonProperty("listing_type")
        private String listingType;
        @JsonProperty("price_amount")
        private int priceAmount;
        @JsonProperty("currency")
        private String currency;

        public ListingRequest() {
            // Required by Jackson for request deserialization.
        }

        public String getTitle() { return title; }
        public void setTitle(String title) { 
            this.title = title; 
        }

        public String getType() { 
            return type != null ? type : listingType;
        }
        public void setType(String type) { 
            this.type = type; 
        }

        public String getListingType() { return listingType; }
        public void setListingType(String listingType) { 
            this.listingType = listingType; 
        }

        public int getPriceAmount() { return priceAmount; }
        public void setPriceAmount(int priceAmount) { 
            this.priceAmount = priceAmount; 
        }

        public String getCurrency() { return currency; }
        public void setCurrency(String currency) { 
            this.currency = currency; 
        }
    }
}
