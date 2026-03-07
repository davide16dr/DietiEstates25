package it.unina.dietiestates25.backend.dto.visits;

import java.time.LocalDateTime;
import java.util.UUID;

public class VisitRequestDto {
    private UUID listingId;
    private LocalDateTime scheduledFor;
    private String notes;

    public VisitRequestDto() {}

    public VisitRequestDto(UUID listingId, LocalDateTime scheduledFor, String notes) {
        this.listingId = listingId;
        this.scheduledFor = scheduledFor;
        this.notes = notes;
    }

    public UUID getListingId() { return listingId; }
    public void setListingId(UUID listingId) { this.listingId = listingId; }

    public LocalDateTime getScheduledFor() { return scheduledFor; }
    public void setScheduledFor(LocalDateTime scheduledFor) { this.scheduledFor = scheduledFor; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
