package it.unina.dietiestates25.backend.dto.offer;

import java.util.UUID;

public class OfferRequest {
    private UUID propertyId;
    private int amount;
    private String message;

    public UUID getPropertyId() { return propertyId; }
    public void setPropertyId(UUID propertyId) { this.propertyId = propertyId; }

    public int getAmount() { return amount; }
    public void setAmount(int amount) { this.amount = amount; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
