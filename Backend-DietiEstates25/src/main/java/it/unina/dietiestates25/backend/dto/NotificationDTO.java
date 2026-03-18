package it.unina.dietiestates25.backend.dto;

import java.util.UUID;

public class NotificationDTO {
    private UUID id;
    private String type;
    private String title;
    private String body;
    private boolean read;
    private String createdAt;
    private UUID listingId;
    private String listingTitle;
    private UUID savedSearchId;

    public NotificationDTO() {
        
    }

    
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }

    public boolean isRead() { return read; }
    public void setRead(boolean read) { this.read = read; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public UUID getListingId() { return listingId; }
    public void setListingId(UUID listingId) { this.listingId = listingId; }

    public String getListingTitle() { return listingTitle; }
    public void setListingTitle(String listingTitle) { this.listingTitle = listingTitle; }

    public UUID getSavedSearchId() { return savedSearchId; }
    public void setSavedSearchId(UUID savedSearchId) { this.savedSearchId = savedSearchId; }
}
