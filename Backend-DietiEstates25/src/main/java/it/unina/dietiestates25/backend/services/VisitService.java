package it.unina.dietiestates25.backend.services;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.time.Instant;
import java.time.ZoneId;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import it.unina.dietiestates25.backend.dto.visit.VisitResponse;
import it.unina.dietiestates25.backend.dto.dashboard.ClientStatsResponse;
import it.unina.dietiestates25.backend.dto.dashboard.AgentStatsResponse;
import it.unina.dietiestates25.backend.entities.Visit;
import it.unina.dietiestates25.backend.entities.enums.VisitStatus;
import it.unina.dietiestates25.backend.repositories.VisitRepository;
import it.unina.dietiestates25.backend.entities.User;
import it.unina.dietiestates25.backend.entities.Listing;
import it.unina.dietiestates25.backend.repositories.UserRepository;
import it.unina.dietiestates25.backend.repositories.ListingRepository;

@Service
public class VisitService {

    private final VisitRepository visitRepository;
    private final UserRepository userRepository;
    private final ListingRepository listingRepository;

    public VisitService(VisitRepository visitRepository, UserRepository userRepository, ListingRepository listingRepository) {
        this.visitRepository = visitRepository;
        this.userRepository = userRepository;
        this.listingRepository = listingRepository;
    }

    // ============ CLIENT OPERATIONS ============

    public List<VisitResponse> getClientVisits(UUID clientId) {
        List<Visit> visits = visitRepository.findAllByClient_Id(clientId);
        return visits.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public VisitResponse createVisit(UUID clientId, UUID listingId, Instant scheduledFor, String notes) {
        User client = userRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Client not found"));
        
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new RuntimeException("Listing not found"));
        
        // Create new visit
        Visit visit = new Visit();
        visit.setClient(client);
        visit.setListing(listing);
        visit.setAgent(listing.getAgent());
        visit.setScheduledFor(scheduledFor);
        visit.setNote(notes);
        visit.setStatus(VisitStatus.REQUESTED);
        
        visit = visitRepository.save(visit);
        
        return mapToResponse(visit);
    }

    @Transactional
    public void cancelVisit(UUID clientId, UUID visitId) {
        Visit visit = visitRepository.findById(visitId)
                .orElseThrow(() -> new RuntimeException("Visit not found"));
        
        // Verify client owns this visit
        if (!visit.getClient().getId().equals(clientId)) {
            throw new RuntimeException("Unauthorized");
        }
        
        // Can only cancel if status is REQUESTED or CONFIRMED
        if (visit.getStatus() != VisitStatus.REQUESTED && visit.getStatus() != VisitStatus.CONFIRMED) {
            throw new RuntimeException("Cannot cancel this visit");
        }
        
        visit.setStatus(VisitStatus.CANCELLED);
        visitRepository.save(visit);
    }

    // ============ AGENT OPERATIONS ============

    public List<VisitResponse> getAgentVisits(UUID agentId) {
        List<Visit> visits = visitRepository.findAllByAgent_Id(agentId);
        return visits.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void confirmVisit(UUID agentId, UUID visitId) {
        Visit visit = visitRepository.findById(visitId)
                .orElseThrow(() -> new RuntimeException("Visit not found"));
        
        // Verify agent owns this visit
        if (visit.getAgent() == null || !visit.getAgent().getId().equals(agentId)) {
            throw new RuntimeException("Unauthorized");
        }
        
        visit.setStatus(VisitStatus.CONFIRMED);
        visitRepository.save(visit);
    }

    @Transactional
    public void completeVisit(UUID agentId, UUID visitId) {
        Visit visit = visitRepository.findById(visitId)
                .orElseThrow(() -> new RuntimeException("Visit not found"));
        
        // Verify agent owns this visit
        if (visit.getAgent() == null || !visit.getAgent().getId().equals(agentId)) {
            throw new RuntimeException("Unauthorized");
        }
        
        visit.setStatus(VisitStatus.DONE);
        visitRepository.save(visit);
    }

    @Transactional
    public void rejectVisit(UUID agentId, UUID visitId, String reason) {
        Visit visit = visitRepository.findById(visitId)
                .orElseThrow(() -> new RuntimeException("Visit not found"));
        
        // Verify agent owns this visit
        if (visit.getAgent() == null || !visit.getAgent().getId().equals(agentId)) {
            throw new RuntimeException("Unauthorized");
        }
        
        visit.setStatus(VisitStatus.CANCELLED);
        visit.setNote(reason != null ? reason : "Rejected by agent");
        visitRepository.save(visit);
    }

    // ============ STATISTICS ============

    public ClientStatsResponse getClientStats(UUID clientId) {
        List<Visit> visits = visitRepository.findAllByClient_Id(clientId);
        
        int pendingVisits = (int) visits.stream()
                .filter(v -> v.getStatus() == VisitStatus.REQUESTED || v.getStatus() == VisitStatus.CONFIRMED)
                .count();
        
        int completedVisits = (int) visits.stream()
                .filter(v -> v.getStatus() == VisitStatus.DONE)
                .count();
        
        int totalVisits = visits.size();
        
        return new ClientStatsResponse(pendingVisits, completedVisits, totalVisits);
    }

    public AgentStatsResponse getAgentStats(UUID agentId) {
        List<Visit> visits = visitRepository.findAllByAgent_Id(agentId);
        List<Listing> listings = listingRepository.findAllByAgent_Id(agentId);
        
        int totalProperties = listings.size();
        
        int pendingVisits = (int) visits.stream()
                .filter(v -> v.getStatus() == VisitStatus.REQUESTED)
                .count();
        
        // Count visits scheduled for today
        LocalDate today = LocalDate.now();
        int todayVisits = (int) visits.stream()
                .filter(v -> {
                    if (v.getScheduledFor() == null) return false;
                    LocalDate visitDate = ZonedDateTime.ofInstant(v.getScheduledFor(), ZoneId.systemDefault()).toLocalDate();
                    return visitDate.equals(today) && 
                           (v.getStatus() == VisitStatus.REQUESTED || v.getStatus() == VisitStatus.CONFIRMED);
                })
                .count();
        
        int completedVisits = (int) visits.stream()
                .filter(v -> v.getStatus() == VisitStatus.DONE)
                .count();
        
        return new AgentStatsResponse(totalProperties, pendingVisits, todayVisits, completedVisits);
    }

    // ============ HELPER METHODS ============

    private VisitResponse mapToResponse(Visit visit) {
        VisitResponse response = new VisitResponse();
        response.setId(visit.getId());
        
        // Property info
        response.setPropertyId(visit.getListing().getId());
        response.setPropertyTitle(visit.getListing().getTitle());
        response.setPropertyAddress(visit.getListing().getProperty().getAddress());
        
        // Property image
        if (visit.getListing().getImages() != null && !visit.getListing().getImages().isEmpty()) {
            response.setPropertyImage(visit.getListing().getImages().get(0).getUrl());
        }
        
        // Client info
        response.setClientId(visit.getClient().getId());
        response.setClientName(visit.getClient().getFirstName() + " " + visit.getClient().getLastName());
        response.setClientEmail(visit.getClient().getEmail());
        
        // Agent info
        if (visit.getAgent() != null) {
            response.setAgentId(visit.getAgent().getId());
            response.setAgentName(visit.getAgent().getFirstName() + " " + visit.getAgent().getLastName());
        }
        
        // Visit details
        response.setRequestedAt(visit.getRequestedAt());
        response.setScheduledFor(visit.getScheduledFor());
        response.setStatus(visit.getStatus().name());
        response.setNote(visit.getNote());
        
        // Format date and time for frontend
        if (visit.getScheduledFor() != null) {
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd")
                    .withZone(ZoneId.systemDefault());
            DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm")
                    .withZone(ZoneId.systemDefault());
            
            response.setScheduledDate(dateFormatter.format(visit.getScheduledFor()));
            response.setScheduledTime(timeFormatter.format(visit.getScheduledFor()));
        }
        
        return response;
    }
}
