package it.unina.dietiestates25.backend.entities;

import it.unina.dietiestates25.backend.entities.enums.ListingStatus;
import it.unina.dietiestates25.backend.entities.enums.ListingType;
import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "listings", indexes = {
        @Index(name = "idx_listings_type_status", columnList = "type, status"),
        @Index(name = "idx_listings_price", columnList = "price_amount")
})
public class Listing extends Auditable {

    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "property_id", nullable = false)
    private Property property;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agent_id")
    private User agent; // ON DELETE SET NULL

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "listing_type")
    private ListingType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "listing_status")
    private ListingStatus status = ListingStatus.ACTIVE;

    @Column(name = "price_amount", nullable = false)
    private int priceAmount;

    @Column(nullable = false, length = 3)
    private String currency = "EUR";

    @Column(nullable = false, length = 160)
    private String title;

    @Column(name = "public_text", columnDefinition = "text")
    private String publicText;

    @OneToMany(mappedBy = "listing", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    private List<ListingImage> images = new ArrayList<>();

    public Listing() {}

    @PrePersist
    public void ensureId() {
        if (id == null) id = UUID.randomUUID();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Property getProperty() { return property; }
    public void setProperty(Property property) { this.property = property; }

    public User getAgent() { return agent; }
    public void setAgent(User agent) { this.agent = agent; }

    public ListingType getType() { return type; }
    public void setType(ListingType type) { this.type = type; }

    public ListingStatus getStatus() { return status; }
    public void setStatus(ListingStatus status) { this.status = status; }

    public int getPriceAmount() { return priceAmount; }
    public void setPriceAmount(int priceAmount) { this.priceAmount = priceAmount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getPublicText() { return publicText; }
    public void setPublicText(String publicText) { this.publicText = publicText; }

    public List<ListingImage> getImages() { return images; }
    public void setImages(List<ListingImage> images) { this.images = images; }
}
