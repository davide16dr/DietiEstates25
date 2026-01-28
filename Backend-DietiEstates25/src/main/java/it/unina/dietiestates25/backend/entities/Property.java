package it.unina.dietiestates25.backend.entities;

import java.math.BigDecimal;
import java.util.UUID;

import it.unina.dietiestates25.backend.entities.enums.PropertyStatus;
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
@Table(name = "properties", indexes = {
        @Index(name = "idx_properties_city", columnList = "city"),
        @Index(name = "idx_properties_geo", columnList = "latitude, longitude")
})
public class Property extends Auditable {

    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "agency_id", nullable = false)
    private Agency agency;

    @Column(nullable = false, length = 120)
    private String city;

    @Column(nullable = false, length = 255)
    private String address;

    @Column(precision = 9, scale = 6)
    private BigDecimal latitude;

    @Column(precision = 9, scale = 6)
    private BigDecimal longitude;

    @Column(name = "property_type", nullable = false, length = 40)
    private String propertyType;

    @Column(nullable = false)
    private int rooms;

    private Integer bathrooms;

    @Column(name = "area_m2", nullable = false)
    private int areaM2;

    private Integer floor;

    @Column(nullable = false)
    private boolean elevator = false;

    @Column(name = "energy_class", length = 4)
    private String energyClass;

    @Column(columnDefinition = "text")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private PropertyStatus status = PropertyStatus.AVAILABLE;

    public Property() {}

    @PrePersist
    public void ensureId() {
        if (id == null) id = UUID.randomUUID();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public Agency getAgency() { return agency; }
    public void setAgency(Agency agency) { this.agency = agency; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public BigDecimal getLatitude() { return latitude; }
    public void setLatitude(BigDecimal latitude) { this.latitude = latitude; }

    public BigDecimal getLongitude() { return longitude; }
    public void setLongitude(BigDecimal longitude) { this.longitude = longitude; }

    public String getPropertyType() { return propertyType; }
    public void setPropertyType(String propertyType) { this.propertyType = propertyType; }

    public int getRooms() { return rooms; }
    public void setRooms(int rooms) { this.rooms = rooms; }

    public Integer getBathrooms() { return bathrooms; }
    public void setBathrooms(Integer bathrooms) { this.bathrooms = bathrooms; }

    public int getAreaM2() { return areaM2; }
    public void setAreaM2(int areaM2) { this.areaM2 = areaM2; }

    public Integer getFloor() { return floor; }
    public void setFloor(Integer floor) { this.floor = floor; }

    public boolean isElevator() { return elevator; }
    public void setElevator(boolean elevator) { this.elevator = elevator; }

    public String getEnergyClass() { return energyClass; }
    public void setEnergyClass(String energyClass) { this.energyClass = energyClass; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public PropertyStatus getStatus() { return status; }
    public void setStatus(PropertyStatus status) { this.status = status; }
}
