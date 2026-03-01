package it.unina.dietiestates25.backend.entities;

import java.time.Instant;
import java.util.UUID;

import it.unina.dietiestates25.backend.entities.enums.OfferStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "offer_status_history", indexes = {
        @Index(name = "idx_offer_status_history_offer", columnList = "offer_id, changed_at DESC")
})
public class OfferStatusHistory {

    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "offer_id", nullable = false)
    private Offer offer;

    @Enumerated(EnumType.STRING)
    @Column(name = "old_status")
    private OfferStatus oldStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", nullable = false)
    private OfferStatus newStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by")
    private User changedBy;

    @Column(name = "changed_at", nullable = false)
    private Instant changedAt;

    @Column(columnDefinition = "text")
    private String note;

    public OfferStatusHistory() {}

    @PrePersist
    public void ensureIdAndChangedAt() {
        if (id == null) id = UUID.randomUUID();
        if (changedAt == null) changedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Offer getOffer() { return offer; }
    public void setOffer(Offer offer) { this.offer = offer; }

    public OfferStatus getOldStatus() { return oldStatus; }
    public void setOldStatus(OfferStatus oldStatus) { this.oldStatus = oldStatus; }

    public OfferStatus getNewStatus() { return newStatus; }
    public void setNewStatus(OfferStatus newStatus) { this.newStatus = newStatus; }

    public User getChangedBy() { return changedBy; }
    public void setChangedBy(User changedBy) { this.changedBy = changedBy; }

    public Instant getChangedAt() { return changedAt; }
    public void setChangedAt(Instant changedAt) { this.changedAt = changedAt; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}
