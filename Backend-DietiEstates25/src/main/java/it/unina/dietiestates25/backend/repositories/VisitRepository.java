package it.unina.dietiestates25.backend.repositories;

import java.util.List;
import java.util.UUID;
import java.time.Instant;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import it.unina.dietiestates25.backend.entities.Visit;
import it.unina.dietiestates25.backend.entities.enums.VisitStatus;

public interface VisitRepository extends JpaRepository<Visit, UUID> {

    List<Visit> findAllByListing_Id(UUID listingId);

    List<Visit> findAllByClient_Id(UUID clientId);

    List<Visit> findAllByAgent_Id(UUID agentId);

    List<Visit> findAllByStatus(VisitStatus status);

    List<Visit> findAllByClient_IdAndStatus(UUID clientId, VisitStatus status);

    List<Visit> findAllByAgent_IdAndStatusAndScheduledForBetween(
        UUID agentId, 
        VisitStatus status, 
        Instant startDate, 
        Instant endDate
    );

    
    boolean existsByListing_IdAndScheduledForAndStatusIn(
        UUID listingId, 
        Instant scheduledFor, 
        List<VisitStatus> statuses
    );

    
    boolean existsByClient_IdAndScheduledForAndStatusIn(
        UUID clientId, 
        Instant scheduledFor, 
        List<VisitStatus> statuses
    );

    
    @Query("SELECT CASE WHEN COUNT(v) > 0 THEN true ELSE false END FROM Visit v " +
           "WHERE v.client.id = :clientId " +
           "AND v.scheduledFor BETWEEN :startTime AND :endTime " +
           "AND v.status IN :statuses")
    boolean hasClientVisitInTimeRange(
        @Param("clientId") UUID clientId,
        @Param("startTime") Instant startTime,
        @Param("endTime") Instant endTime,
        @Param("statuses") List<VisitStatus> statuses
    );

    
    @Query("SELECT CASE WHEN COUNT(v) > 0 THEN true ELSE false END FROM Visit v " +
           "WHERE v.listing.agent.id = :agentId " +
           "AND v.scheduledFor BETWEEN :startTime AND :endTime " +
           "AND v.status IN :statuses")
    boolean hasAgentVisitInTimeRange(
        @Param("agentId") UUID agentId,
        @Param("startTime") Instant startTime,
        @Param("endTime") Instant endTime,
        @Param("statuses") List<VisitStatus> statuses
    );
}
