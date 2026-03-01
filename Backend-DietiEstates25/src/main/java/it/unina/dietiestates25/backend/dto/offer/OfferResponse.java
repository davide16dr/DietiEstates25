package it.unina.dietiestates25.backend.dto.offer;

import java.time.Instant;
import java.util.UUID;

import it.unina.dietiestates25.backend.entities.enums.OfferStatus;

public class OfferResponse {
    private UUID id;
    private UUID propertyId;
    private String propertyTitle;
    private String propertyAddress;
    private Integer propertyPrice;
    private String propertyImage;
    private int amount;
    private String currency;
    private OfferStatus status;
    private Integer counterOfferAmount;
    private String message;
    private String counterMessage;
    private String clientName;
    private String clientEmail;
    private Instant createdAt;
    private Instant updatedAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getPropertyId() { return propertyId; }
    public void setPropertyId(UUID propertyId) { this.propertyId = propertyId; }

    public String getPropertyTitle() { return propertyTitle; }
    public void setPropertyTitle(String propertyTitle) { this.propertyTitle = propertyTitle; }

    public String getPropertyAddress() { return propertyAddress; }
    public void setPropertyAddress(String propertyAddress) { this.propertyAddress = propertyAddress; }

    public Integer getPropertyPrice() { return propertyPrice; }
    public void setPropertyPrice(Integer propertyPrice) { this.propertyPrice = propertyPrice; }

    public String getPropertyImage() { return propertyImage; }
    public void setPropertyImage(String propertyImage) { this.propertyImage = propertyImage; }

    public int getAmount() { return amount; }
    public void setAmount(int amount) { this.amount = amount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public OfferStatus getStatus() { return status; }
    public void setStatus(OfferStatus status) { this.status = status; }

    public Integer getCounterOfferAmount() { return counterOfferAmount; }
    public void setCounterOfferAmount(Integer counterOfferAmount) { this.counterOfferAmount = counterOfferAmount; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getCounterMessage() { return counterMessage; }
    public void setCounterMessage(String counterMessage) { this.counterMessage = counterMessage; }

    public String getClientName() { return clientName; }
    public void setClientName(String clientName) { this.clientName = clientName; }

    public String getClientEmail() { return clientEmail; }
    public void setClientEmail(String clientEmail) { this.clientEmail = clientEmail; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
