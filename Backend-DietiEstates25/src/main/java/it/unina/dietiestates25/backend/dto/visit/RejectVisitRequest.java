package it.unina.dietiestates25.backend.dto.visit;

public class RejectVisitRequest {
    private String reason;

    public RejectVisitRequest() {}

    public RejectVisitRequest(String reason) {
        this.reason = reason;
    }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
