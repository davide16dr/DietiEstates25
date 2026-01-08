package it.unina.dietiestates25.backend.entities;

import it.unina.dietiestates25.backend.entities.enums.VisitStatus;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "visit_status_history", indexes = {
        @Index(name = "idx_visit_status_history_visit", columnList = "visit_id, changed_at DESC")
})
public class VisitStatusHistory {

    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "visit_id", nullable = false)
    private Visit visit;

    @Enumerated(EnumType.STRING)
    @Column(name = "old_status", columnDefinition = "visit_status")
    private VisitStatus oldStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", nullable = false, columnDefinition = "visit_status")
    private VisitStatus newStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by")
    private User changedBy;

    @Column(name = "changed_at", nullable = false)
    private Instant changedAt;

    @Column(columnDefinition = "text")
    private String note;

    public VisitStatusHistory() {}

    @PrePersist
    public void ensureIdAndChangedAt() {
        if (id == null) id = UUID.randomUUID();
        if (changedAt == null) changedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Visit getVisit() { return visit; }
    public void setVisit(Visit visit) { this.visit = visit; }

    public VisitStatus getOldStatus() { return oldStatus; }
    public void setOldStatus(VisitStatus oldStatus) { this.oldStatus = oldStatus; }

    public VisitStatus getNewStatus() { return newStatus; }
    public void setNewStatus(VisitStatus newStatus) { this.newStatus = newStatus; }

    public User getChangedBy() { return changedBy; }
    public void setChangedBy(User changedBy) { this.changedBy = changedBy; }

    public Instant getChangedAt() { return changedAt; }
    public void setChangedAt(Instant changedAt) { this.changedAt = changedAt; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}
