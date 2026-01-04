package it.unina.dietiestates25.backend.entities;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "notification_preferences")
public class NotificationPreferences {

    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    @OneToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "email_enabled", nullable = false)
    private boolean emailEnabled = true;

    @Column(name = "inapp_enabled", nullable = false)
    private boolean inappEnabled = true;

    @Column(name = "notify_new_matching", nullable = false)
    private boolean notifyNewMatching = true;

    @Column(name = "notify_price_change", nullable = false)
    private boolean notifyPriceChange = true;

    @Column(name = "notify_listing_updates", nullable = false)
    private boolean notifyListingUpdates = true;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public NotificationPreferences() {}

    @PrePersist
    public void ensureIdAndUpdatedAt() {
        if (id == null) id = UUID.randomUUID();
        if (updatedAt == null) updatedAt = Instant.now();
    }

    @PreUpdate
    public void touchUpdatedAt() {
        updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public boolean isEmailEnabled() { return emailEnabled; }
    public void setEmailEnabled(boolean emailEnabled) { this.emailEnabled = emailEnabled; }

    public boolean isInappEnabled() { return inappEnabled; }
    public void setInappEnabled(boolean inappEnabled) { this.inappEnabled = inappEnabled; }

    public boolean isNotifyNewMatching() { return notifyNewMatching; }
    public void setNotifyNewMatching(boolean notifyNewMatching) { this.notifyNewMatching = notifyNewMatching; }

    public boolean isNotifyPriceChange() { return notifyPriceChange; }
    public void setNotifyPriceChange(boolean notifyPriceChange) { this.notifyPriceChange = notifyPriceChange; }

    public boolean isNotifyListingUpdates() { return notifyListingUpdates; }
    public void setNotifyListingUpdates(boolean notifyListingUpdates) { this.notifyListingUpdates = notifyListingUpdates; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
