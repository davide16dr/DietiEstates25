package it.unina.dietiestates25.backend.dto.visits;

import it.unina.dietiestates25.backend.entities.enums.VisitStatus;
import java.time.LocalDateTime;

public class VisitUpdateDto {
    private VisitStatus status;
    private LocalDateTime scheduledFor;
    private String notes;

    public VisitUpdateDto() {}

    public VisitUpdateDto(VisitStatus status, LocalDateTime scheduledFor, String notes) {
        this.status = status;
        this.scheduledFor = scheduledFor;
        this.notes = notes;
    }

    public VisitStatus getStatus() { return status; }
    public void setStatus(VisitStatus status) { this.status = status; }

    public LocalDateTime getScheduledFor() { return scheduledFor; }
    public void setScheduledFor(LocalDateTime scheduledFor) { this.scheduledFor = scheduledFor; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
