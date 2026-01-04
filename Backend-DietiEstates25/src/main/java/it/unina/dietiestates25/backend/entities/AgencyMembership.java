package it.unina.dietiestates25.backend.entities;

import java.util.UUID;

import it.unina.dietiestates25.backend.entities.enums.UserRole;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
    name = "agency_memberships",
    uniqueConstraints = @UniqueConstraint(name = "uk_agency_user", columnNames = {"agency_id", "user_id"})
)
public class AgencyMembership extends Auditable {

    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "agency_id", nullable = false)
    private Agency agency;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "membership_role", nullable = false, columnDefinition = "user_role")
    private UserRole membershipRole; // AGENCY_MANAGER / AGENT

    public AgencyMembership() {}

    @PrePersist
    public void ensureId() {
        if (id == null) id = UUID.randomUUID();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Agency getAgency() { return agency; }
    public void setAgency(Agency agency) { this.agency = agency; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public UserRole getMembershipRole() { return membershipRole; }
    public void setMembershipRole(UserRole membershipRole) { this.membershipRole = membershipRole; }
}
