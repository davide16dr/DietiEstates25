package it.unina.dietiestates25.backend.entities;

import java.util.UUID;

import it.unina.dietiestates25.backend.entities.enums.UserRole;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
public class User extends Auditable {

    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private UserRole role;

    @Column(name = "first_name", nullable = false, length = 80)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 80)
    private String lastName;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password_hash", nullable = false, columnDefinition = "text")
    private String passwordHash;

    @Column(name = "phone_e164", length = 20)
    private String phoneE164;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "created_by", columnDefinition = "uuid")
    private UUID createdBy;

    @Column(name = "agency_id", columnDefinition = "uuid")
    private UUID agencyId;

    public User() {}

    @PrePersist
    public void ensureId() {
        if (id == null) id = UUID.randomUUID();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UserRole getRole() { return role; }
    public void setRole(UserRole role) { this.role = role; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getPhoneE164() { return phoneE164; }
    public void setPhoneE164(String phoneE164) { this.phoneE164 = phoneE164; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public UUID getCreatedBy() { return createdBy; }
    public void setCreatedBy(UUID createdBy) { this.createdBy = createdBy; }

    public UUID getAgencyId() { return agencyId; }
    public void setAgencyId(UUID agencyId) { this.agencyId = agencyId; }
}