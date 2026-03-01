package it.unina.dietiestates25.backend.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import it.unina.dietiestates25.backend.entities.Listing;

@Repository
public interface ListingRepository extends JpaRepository<Listing, UUID> {
    
    List<Listing> findAllByAgent_Id(UUID agentId);
    
    @Query(value = "SELECT DISTINCT l.* FROM listings l " +
           "LEFT JOIN properties p ON p.id = l.property_id " +
           "WHERE (CAST(:type AS VARCHAR) IS NULL OR l.type = :type) " +
           "AND (CAST(:status AS VARCHAR) IS NULL OR l.status = :status) " +
           "AND (CAST(:city AS VARCHAR) IS NULL OR p.city ILIKE '%' || :city || '%') " +
           "AND (CAST(:propertyType AS VARCHAR) IS NULL OR p.property_type = :propertyType) " +
           "AND (CAST(:priceMin AS INTEGER) IS NULL OR l.price_amount >= :priceMin) " +
           "AND (CAST(:priceMax AS INTEGER) IS NULL OR l.price_amount <= :priceMax) " +
           "AND (CAST(:roomsMin AS INTEGER) IS NULL OR p.rooms >= :roomsMin) " +
           "AND (CAST(:areaMin AS INTEGER) IS NULL OR p.area_m2 >= :areaMin) " +
           "AND (CAST(:areaMax AS INTEGER) IS NULL OR p.area_m2 <= :areaMax) " +
           "AND (CAST(:energyClass AS VARCHAR) IS NULL OR p.energy_class = :energyClass) " +
           "AND (CAST(:elevator AS BOOLEAN) IS NULL OR :elevator = false OR p.elevator = true)",
           nativeQuery = true)
    List<Listing> findByFilters(
        @Param("type") String type,
        @Param("status") String status,
        @Param("city") String city,
        @Param("propertyType") String propertyType,
        @Param("priceMin") Integer priceMin,
        @Param("priceMax") Integer priceMax,
        @Param("roomsMin") Integer roomsMin,
        @Param("areaMin") Integer areaMin,
        @Param("areaMax") Integer areaMax,
        @Param("energyClass") String energyClass,
        @Param("elevator") Boolean elevator
    );
}
