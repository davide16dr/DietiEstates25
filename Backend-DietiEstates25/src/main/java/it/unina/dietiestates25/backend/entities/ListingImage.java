package it.unina.dietiestates25.backend.entities;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "listing_images", indexes = {
        @Index(name = "idx_listing_images_listing", columnList = "listing_id")
})
public class ListingImage {

    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "listing_id", nullable = false)
    private Listing listing;

    @Column(nullable = false, columnDefinition = "text")
    private String url;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;

    @Column(name = "created_at", nullable = false)
    private java.time.Instant createdAt;

    public ListingImage() {}

    @PrePersist
    public void ensureIdAndCreatedAt() {
        if (id == null) id = UUID.randomUUID();
        if (createdAt == null) createdAt = java.time.Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Listing getListing() { return listing; }
    public void setListing(Listing listing) { this.listing = listing; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public int getSortOrder() { return sortOrder; }
    public void setSortOrder(int sortOrder) { this.sortOrder = sortOrder; }

    public java.time.Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(java.time.Instant createdAt) { this.createdAt = createdAt; }
}
