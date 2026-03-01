package it.unina.dietiestates25.backend.dto.offer;

public class CounterOfferRequest {
    private int amount;
    private String message;

    public int getAmount() { return amount; }
    public void setAmount(int amount) { this.amount = amount; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
