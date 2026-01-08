package it.unina.dietiestates25.backend.entities;

import java.time.Instant;
import java.util.UUID;

import it.unina.dietiestates25.backend.entities.enums.VisitStatus;
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
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
    name = "visits",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_visits_listing_client_requested",
        columnNames = {"listing_id", "client_id", "requested_at"}
    ),
    indexes = {
        @Index(name = "idx_visits_listing", columnList = "listing_id"),
        @Index(name = "idx_visits_client", columnList = "client_id")
    }
)
public class Visit extends Auditable {

    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "listing_id", nullable = false)
    private Listing listing;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private User client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agent_id")
    private User agent; // ON DELETE SET NULL

    @Column(name = "requested_at", nullable = false)
    private Instant requestedAt;

    @Column(name = "scheduled_for")
    private Instant scheduledFor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "visit_status")
    private VisitStatus status = VisitStatus.REQUESTED;

    @Column(columnDefinition = "text")
    private String note;

    public Visit() {}

    @PrePersist
    public void ensureIdAndRequestedAt() {
        if (id == null) id = UUID.randomUUID();
        if (requestedAt == null) requestedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Listing getListing() { return listing; }
    public void setListing(Listing listing) { this.listing = listing; }

    public User getClient() { return client; }
    public void setClient(User client) { this.client = client; }

    public User getAgent() { return agent; }
    public void setAgent(User agent) { this.agent = agent; }

    public Instant getRequestedAt() { return requestedAt; }
    public void setRequestedAt(Instant requestedAt) { this.requestedAt = requestedAt; }

    public Instant getScheduledFor() { return scheduledFor; }
    public void setScheduledFor(Instant scheduledFor) { this.scheduledFor = scheduledFor; }

    public VisitStatus getStatus() { return status; }
    public void setStatus(VisitStatus status) { this.status = status; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}
