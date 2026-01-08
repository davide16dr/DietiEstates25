package it.unina.dietiestates25.backend.entities;

import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "agencies")
public class Agency extends Auditable {

    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(name = "vat_number", nullable = false, unique = true, length = 32)
    private String vatNumber;

    @Column(nullable = false, length = 120)
    private String city;

    @Column(length = 255)
    private String address;

    @Column(name = "phone_e164", length = 20)
    private String phoneE164;

    @Column(length = 255)
    private String email;

    public Agency() {}

    @PrePersist
    public void ensureId() {
        if (id == null) id = UUID.randomUUID();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getVatNumber() { return vatNumber; }
    public void setVatNumber(String vatNumber) { this.vatNumber = vatNumber; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getPhoneE164() { return phoneE164; }
    public void setPhoneE164(String phoneE164) { this.phoneE164 = phoneE164; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
