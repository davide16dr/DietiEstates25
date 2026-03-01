package it.unina.dietiestates25.backend.dto.listing;

import com.fasterxml.jackson.annotation.JsonProperty;

public class CreateListingRequest {
    
    private PropertyRequest property;
    private ListingRequest listing;

    public CreateListingRequest() {}

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
        private String property_type;
        @JsonProperty("rooms")
        private int rooms;
        @JsonProperty("bathrooms")
        private int bathrooms;
        @JsonProperty("area_m2")
        private int area_m2;
        @JsonProperty("floor")
        private int floor;
        @JsonProperty("elevator")
        private boolean elevator;
        @JsonProperty("energy_class")
        private String energy_class;
        @JsonProperty("description")
        private String description;

        public PropertyRequest() {}

        public String getCity() { return city; }
        public void setCity(String city) { this.city = city; }

        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }

        public String getPropertyType() { return property_type; }
        public void setPropertyType(String property_type) { this.property_type = property_type; }

        public int getRooms() { return rooms; }
        public void setRooms(int rooms) { this.rooms = rooms; }

        public int getBathrooms() { return bathrooms; }
        public void setBathrooms(int bathrooms) { this.bathrooms = bathrooms; }

        public int getAreaM2() { return area_m2; }
        public void setAreaM2(int area_m2) { this.area_m2 = area_m2; }

        public int getFloor() { return floor; }
        public void setFloor(int floor) { this.floor = floor; }

        public boolean isElevator() { return elevator; }
        public void setElevator(boolean elevator) { this.elevator = elevator; }

        public String getEnergyClass() { return energy_class; }
        public void setEnergyClass(String energy_class) { this.energy_class = energy_class; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }

    public static class ListingRequest {
        @JsonProperty("title")
        private String title;
        @JsonProperty("type")
        private String type;
        @JsonProperty("listing_type")
        private String listing_type;
        @JsonProperty("price_amount")
        private int price_amount;
        @JsonProperty("currency")
        private String currency;

        public ListingRequest() {
            System.out.println("[ListingRequest] Costruttore invocato");
        }

        public String getTitle() { return title; }
        public void setTitle(String title) { 
            System.out.println("[ListingRequest.setTitle] " + title);
            this.title = title; 
        }

        public String getType() { 
            System.out.println("[ListingRequest.getType] type=" + type + ", listing_type=" + listing_type);
            return type != null ? type : listing_type;
        }
        public void setType(String type) { 
            System.out.println("[ListingRequest.setType] " + type);
            this.type = type; 
        }

        public String getListingType() { return listing_type; }
        public void setListingType(String listing_type) { 
            System.out.println("[ListingRequest.setListingType] " + listing_type);
            this.listing_type = listing_type; 
        }

        public int getPriceAmount() { return price_amount; }
        public void setPriceAmount(int price_amount) { 
            System.out.println("[ListingRequest.setPriceAmount] " + price_amount);
            this.price_amount = price_amount; 
        }

        public String getCurrency() { return currency; }
        public void setCurrency(String currency) { 
            System.out.println("[ListingRequest.setCurrency] " + currency);
            this.currency = currency; 
        }
    }
}
