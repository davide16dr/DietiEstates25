package it.unina.dietiestates25.backend.entities;

import java.time.Instant;
import java.util.UUID;

import it.unina.dietiestates25.backend.entities.enums.NotificationType;
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
@Table(name = "notifications", indexes = {
        @Index(name = "idx_notifications_user", columnList = "user_id, is_read")
})
public class Notification {

    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "notification_type")
    private NotificationType type;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "listing_id")
    private Listing listing; // ON DELETE SET NULL

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "saved_search_id")
    private SavedSearch savedSearch; // ON DELETE SET NULL

    @Column(nullable = false, length = 160)
    private String title;

    @Column(columnDefinition = "text")
    private String body;

    @Column(name = "is_read", nullable = false)
    private boolean read = false;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public Notification() {}

    @PrePersist
    public void ensureIdAndCreatedAt() {
        if (id == null) id = UUID.randomUUID();
        if (createdAt == null) createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public NotificationType getType() { return type; }
    public void setType(NotificationType type) { this.type = type; }

    public Listing getListing() { return listing; }
    public void setListing(Listing listing) { this.listing = listing; }

    public SavedSearch getSavedSearch() { return savedSearch; }
    public void setSavedSearch(SavedSearch savedSearch) { this.savedSearch = savedSearch; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }

    public boolean isRead() { return read; }
    public void setRead(boolean read) { this.read = read; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
