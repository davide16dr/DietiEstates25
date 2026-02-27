package it.unina.dietiestates25.backend.dto.savedsearch;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public class SavedSearchResponse {
    private UUID id;
    private String name;
    private Map<String, Object> filters;
    private boolean active;
    private Instant createdAt;
    private Instant updatedAt;

    public SavedSearchResponse() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Map<String, Object> getFilters() { return filters; }
    public void setFilters(Map<String, Object> filters) { this.filters = filters; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
