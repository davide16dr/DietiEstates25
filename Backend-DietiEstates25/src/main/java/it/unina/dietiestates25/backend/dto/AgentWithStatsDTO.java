package it.unina.dietiestates25.backend.dto;

import java.util.UUID;

public class AgentWithStatsDTO {
    private UUID id;
    private String email;
    private String firstName;
    private String lastName;
    private String phoneE164;
    private boolean active;
    private UUID agencyId;
    private int totalProperties;
    private int activeProperties;
    private int soldProperties;
    private int rentedProperties;

    
    public AgentWithStatsDTO() {
    }

    
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getPhoneE164() { return phoneE164; }
    public void setPhoneE164(String phoneE164) { this.phoneE164 = phoneE164; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public UUID getAgencyId() { return agencyId; }
    public void setAgencyId(UUID agencyId) { this.agencyId = agencyId; }

    public int getTotalProperties() { return totalProperties; }
    public void setTotalProperties(int totalProperties) { this.totalProperties = totalProperties; }

    public int getActiveProperties() { return activeProperties; }
    public void setActiveProperties(int activeProperties) { this.activeProperties = activeProperties; }

    public int getSoldProperties() { return soldProperties; }
    public void setSoldProperties(int soldProperties) { this.soldProperties = soldProperties; }

    public int getRentedProperties() { return rentedProperties; }
    public void setRentedProperties(int rentedProperties) { this.rentedProperties = rentedProperties; }
}
