package it.unina.dietiestates25.backend.entities;

import jakarta.persistence.*;

import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "saved_searches", indexes = {
        @Index(name = "idx_saved_searches_client", columnList = "client_id")
})
public class SavedSearch extends Auditable {

    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private User client;

    @Column(nullable = false, length = 120)
    private String name;

    @Convert(converter = JsonbConverter.class)
    @Column(nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> filters;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    public SavedSearch() {}

    @PrePersist
    public void ensureId() {
        if (id == null) id = UUID.randomUUID();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public User getClient() { return client; }
    public void setClient(User client) { this.client = client; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Map<String, Object> getFilters() { return filters; }
    public void setFilters(Map<String, Object> filters) { this.filters = filters; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
}
