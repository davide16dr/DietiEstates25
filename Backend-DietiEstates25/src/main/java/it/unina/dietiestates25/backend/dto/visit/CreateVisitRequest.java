package it.unina.dietiestates25.backend.dto.visit;

import java.time.Instant;

public class CreateVisitRequest {
    private String listingId;
    private Instant scheduledFor;
    private String notes;

    public CreateVisitRequest() {}

    public CreateVisitRequest(String listingId, Instant scheduledFor, String notes) {
        this.listingId = listingId;
        this.scheduledFor = scheduledFor;
        this.notes = notes;
    }

    public String getListingId() { return listingId; }
    public void setListingId(String listingId) { this.listingId = listingId; }

    public Instant getScheduledFor() { return scheduledFor; }
    public void setScheduledFor(Instant scheduledFor) { this.scheduledFor = scheduledFor; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
