package it.unina.dietiestates25.backend.entities;

import it.unina.dietiestates25.backend.entities.enums.ListingStatus;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "listing_status_history", indexes = {
        @Index(name = "idx_listing_status_history_listing", columnList = "listing_id, changed_at DESC")
})
public class ListingStatusHistory {

    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "listing_id", nullable = false)
    private Listing listing;

    @Enumerated(EnumType.STRING)
    @Column(name = "old_status", columnDefinition = "listing_status")
    private ListingStatus oldStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", nullable = false, columnDefinition = "listing_status")
    private ListingStatus newStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by")
    private User changedBy;

    @Column(name = "changed_at", nullable = false)
    private Instant changedAt;

    @Column(columnDefinition = "text")
    private String reason;

    public ListingStatusHistory() {}

    @PrePersist
    public void ensureIdAndChangedAt() {
        if (id == null) id = UUID.randomUUID();
        if (changedAt == null) changedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Listing getListing() { return listing; }
    public void setListing(Listing listing) { this.listing = listing; }

    public ListingStatus getOldStatus() { return oldStatus; }
    public void setOldStatus(ListingStatus oldStatus) { this.oldStatus = oldStatus; }

    public ListingStatus getNewStatus() { return newStatus; }
    public void setNewStatus(ListingStatus newStatus) { this.newStatus = newStatus; }

    public User getChangedBy() { return changedBy; }
    public void setChangedBy(User changedBy) { this.changedBy = changedBy; }

    public Instant getChangedAt() { return changedAt; }
    public void setChangedAt(Instant changedAt) { this.changedAt = changedAt; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
