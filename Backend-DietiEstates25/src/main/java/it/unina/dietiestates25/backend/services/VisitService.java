package it.unina.dietiestates25.backend.services;

import it.unina.dietiestates25.backend.dto.dashboard.ClientStatsResponse;
import it.unina.dietiestates25.backend.dto.visits.VisitRequestDto;
import it.unina.dietiestates25.backend.dto.visits.VisitResponseDto;
import it.unina.dietiestates25.backend.dto.visits.VisitUpdateDto;
import it.unina.dietiestates25.backend.entities.Listing;
import it.unina.dietiestates25.backend.entities.User;
import it.unina.dietiestates25.backend.entities.Visit;
import it.unina.dietiestates25.backend.entities.enums.ListingStatus;
import it.unina.dietiestates25.backend.entities.enums.VisitStatus;
import it.unina.dietiestates25.backend.exceptions.BadRequestException;
import it.unina.dietiestates25.backend.exceptions.ForbiddenException;
import it.unina.dietiestates25.backend.exceptions.NotFoundException;
import it.unina.dietiestates25.backend.repositories.ListingRepository;
import it.unina.dietiestates25.backend.repositories.VisitRepository;
import it.unina.dietiestates25.backend.repositories.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Slf4j
public class VisitService {

    private static final String MSG_NEW_VISIT_REQUEST = "Nuova Richiesta di Visita";
    private static final String MSG_VISIT_NOT_FOUND = "Visit not found";
    private static final String MSG_UNAUTHORIZED = "Unauthorized";
    private static final String TIME_ZONE_ROME = "Europe/Rome";

    private final VisitRepository visitRepository;
    private final ListingRepository listingRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final WebSocketNotificationService webSocketNotificationService;

    @Autowired
    public VisitService(VisitRepository visitRepository, 
                       ListingRepository listingRepository,
                       UserRepository userRepository,
                       NotificationService notificationService,
                       WebSocketNotificationService webSocketNotificationService) {
        this.visitRepository = visitRepository;
        this.listingRepository = listingRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.webSocketNotificationService = webSocketNotificationService;
    }

    @Transactional
    public VisitResponseDto requestVisit(VisitRequestDto visitRequestDto, User client) {
        Listing listing = listingRepository.findById(visitRequestDto.getListingId())
            .orElseThrow(() -> new NotFoundException(MSG_VISIT_NOT_FOUND));

        if (listing.getStatus() != ListingStatus.ACTIVE) {
            throw new BadRequestException("Cannot request visit for inactive listing");
        }

        Instant scheduledFor = convertToInstant(visitRequestDto.getScheduledFor());
        if (scheduledFor.isBefore(Instant.now())) {
            throw new BadRequestException("Cannot schedule visit in the past");
        }

        
        boolean hasConflict = visitRepository.existsByListing_IdAndScheduledForAndStatusIn(
            visitRequestDto.getListingId(),
            scheduledFor,
            List.of(VisitStatus.CONFIRMED, VisitStatus.REQUESTED)
        );
        
        if (hasConflict) {
            throw new BadRequestException("Questo orario è già occupato. Per favore scegli un altro orario.");
        }

        
        Instant startRange = scheduledFor.minusSeconds(30L * 60); 
        Instant endRange = scheduledFor.plusSeconds(30L * 60);    
        
        boolean clientHasConflict = visitRepository.hasClientVisitInTimeRange(
            client.getId(),
            startRange,
            endRange,
            List.of(VisitStatus.CONFIRMED, VisitStatus.REQUESTED)
        );
        
        if (clientHasConflict) {
            throw new BadRequestException("Hai già una visita prenotata in questo intervallo di tempo. Non puoi prenotare due visite contemporaneamente.");
        }

        
        if (listing.getAgent() != null) {
            boolean agentHasConflict = visitRepository.hasAgentVisitInTimeRange(
                listing.getAgent().getId(),
                startRange,
                endRange,
                List.of(VisitStatus.CONFIRMED, VisitStatus.REQUESTED)
            );
            
            if (agentHasConflict) {
                throw new BadRequestException("L'agente non è disponibile in questo orario. Per favore scegli un altro orario.");
            }
        }

        Visit visit = new Visit();
        visit.setListing(listing);
        visit.setClient(client);
        
        visit.setAgent(listing.getAgent());
        visit.setScheduledFor(scheduledFor);
        visit.setStatus(VisitStatus.REQUESTED);
        visit.setNote(visitRequestDto.getNotes());

        Visit savedVisit = visitRepository.save(visit);

        
        if (listing.getAgent() != null) {
            String propertyAddress = listing.getProperty().getAddress();
            notificationService.createAgentNotification(
                listing.getAgent().getId(),
                listing,
                MSG_NEW_VISIT_REQUEST,
                String.format("Nuova richiesta di visita per la proprietà in %s", propertyAddress)
            );
            
            webSocketNotificationService.sendVisitNotification(
                listing.getAgent().getId(),
                "NEW_VISIT_REQUEST",
                MSG_NEW_VISIT_REQUEST,
                String.format("Nuova richiesta di visita per %s", propertyAddress),
                listing.getId(),
                savedVisit.getId()
            );
        }

        log.info("Visit requested: ID={}, Client={}, Listing={}", savedVisit.getId(), client.getId(), listing.getId());
        return toDto(savedVisit);
    }

    @Transactional
    public VisitResponseDto updateVisitStatus(UUID visitId, VisitUpdateDto updateDto, User agent) {
        Visit visit = visitRepository.findById(visitId)
                .orElseThrow(() -> new NotFoundException(MSG_VISIT_NOT_FOUND));

        Listing listing = visit.getListing();
        if (listing.getAgent() == null || !listing.getAgent().getId().equals(agent.getId())) {
            throw new ForbiddenException(MSG_UNAUTHORIZED);
        }

        VisitStatus newStatus = updateDto.getStatus();
        if (!isValidStatusTransition(visit.getStatus(), newStatus)) {
            throw new BadRequestException("Invalid status transition from " + visit.getStatus() + " to " + newStatus);
        }

        visit.setStatus(newStatus);
        if (updateDto.getScheduledFor() != null) {
            Instant scheduledFor = convertToInstant(updateDto.getScheduledFor());
            if (scheduledFor.isBefore(Instant.now())) {
                throw new BadRequestException("Cannot schedule visit in the past");
            }
            visit.setScheduledFor(scheduledFor);
        }
        if (updateDto.getNotes() != null) {
            visit.setNote(updateDto.getNotes());
        }

        Visit updatedVisit = visitRepository.save(visit);

        
        notificationService.createVisitStatusNotification(
            visit.getClient().getId(),
            listing,
            newStatus.name()
        );

        log.info("Visit status updated: ID={}, Status={}", visitId, newStatus);
        return toDto(updatedVisit);
    }

    @Transactional(readOnly = true)
    public List<it.unina.dietiestates25.backend.dto.visit.VisitResponse> getClientVisits(UUID clientId) {
        List<Visit> visits = visitRepository.findAllByClient_Id(clientId);
        return visits.stream().map(this::toVisitResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<it.unina.dietiestates25.backend.dto.visit.VisitResponse> getAgentVisits(UUID agentId) {
        List<Visit> visits = visitRepository.findAllByAgent_Id(agentId);
        return visits.stream().map(this::toVisitResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public VisitResponseDto getVisitById(UUID visitId, User user) {
        Visit visit = visitRepository.findById(visitId)
                .orElseThrow(() -> new NotFoundException(MSG_VISIT_NOT_FOUND));

        Listing listing = visit.getListing();
        boolean isClient = visit.getClient().getId().equals(user.getId());
        boolean isAgent = listing.getAgent() != null && listing.getAgent().getId().equals(user.getId());

        if (!isClient && !isAgent) {
            throw new ForbiddenException(MSG_UNAUTHORIZED);
        }

        return toDto(visit);
    }

    @Transactional
    public void cancelVisit(UUID clientId, UUID visitId) {
        Visit visit = visitRepository.findById(visitId)
                .orElseThrow(() -> new NotFoundException(MSG_VISIT_NOT_FOUND));

        if (!visit.getClient().getId().equals(clientId)) {
            throw new ForbiddenException(MSG_UNAUTHORIZED);
        }

        if (visit.getStatus() == VisitStatus.DONE || visit.getStatus() == VisitStatus.CANCELLED) {
            throw new BadRequestException("Cannot cancel visit with status: " + visit.getStatus());
        }

        visit.setStatus(VisitStatus.CANCELLED);
        visitRepository.save(visit);

        
        Listing listing = visit.getListing();
        if (listing.getAgent() != null) {
            String propertyAddress = listing.getProperty().getAddress();
            notificationService.createAgentNotification(
                listing.getAgent().getId(),
                listing,
                "Visita Cancellata",
                String.format("La visita per %s è stata cancellata dal cliente", propertyAddress)
            );
            
            webSocketNotificationService.sendVisitNotification(
                listing.getAgent().getId(),
                "VISIT_CANCELLED_BY_CLIENT",
                "Visita Cancellata",
                String.format("Visita cancellata per %s", propertyAddress),
                listing.getId(),
                visit.getId()
            );
        }

        log.info("Visit cancelled: ID={}", visitId);
    }

    @Transactional
    public void confirmVisit(UUID agentId, UUID visitId) {
        Visit visit = visitRepository.findById(visitId)
                .orElseThrow(() -> new NotFoundException(MSG_VISIT_NOT_FOUND));

        Listing listing = visit.getListing();
        if (listing.getAgent() == null || !listing.getAgent().getId().equals(agentId)) {
            throw new ForbiddenException(MSG_UNAUTHORIZED);
        }

        if (visit.getStatus() != VisitStatus.REQUESTED) {
            throw new BadRequestException("Can only confirm requested visits");
        }

        visit.setStatus(VisitStatus.CONFIRMED);
        visitRepository.save(visit);

        notificationService.createVisitStatusNotification(
            visit.getClient().getId(),
            listing,
            "CONFIRMED"
        );
        
        webSocketNotificationService.sendVisitNotification(
            visit.getClient().getId(),
            "VISIT_CONFIRMED",
            "Visita Confermata",
            String.format("La tua visita per %s è stata confermata", listing.getProperty().getAddress()),
            listing.getId(),
            visit.getId()
        );

        log.info("Visit confirmed: ID={}", visitId);
    }

    @Transactional
    public void completeVisit(UUID agentId, UUID visitId) {
        Visit visit = visitRepository.findById(visitId)
                .orElseThrow(() -> new NotFoundException(MSG_VISIT_NOT_FOUND));

        Listing listing = visit.getListing();
        if (listing.getAgent() == null || !listing.getAgent().getId().equals(agentId)) {
            throw new ForbiddenException(MSG_UNAUTHORIZED);
        }

        if (visit.getStatus() != VisitStatus.CONFIRMED) {
            throw new BadRequestException("Can only complete confirmed visits");
        }

        visit.setStatus(VisitStatus.DONE);
        visitRepository.save(visit);

        
        notificationService.createVisitStatusNotification(
            visit.getClient().getId(),
            listing,
            "COMPLETED"
        );
        
        webSocketNotificationService.sendVisitNotification(
            visit.getClient().getId(),
            "VISIT_COMPLETED",
            "Visita Completata",
            String.format("La tua visita per %s è stata completata", listing.getProperty().getAddress()),
            listing.getId(),
            visit.getId()
        );

        log.info("Visit completed: ID={}", visitId);
    }

    @Transactional
    public void rejectVisit(UUID agentId, UUID visitId, String reason) {
        Visit visit = visitRepository.findById(visitId)
                .orElseThrow(() -> new NotFoundException(MSG_VISIT_NOT_FOUND));

        Listing listing = visit.getListing();
        if (listing.getAgent() == null || !listing.getAgent().getId().equals(agentId)) {
            throw new ForbiddenException(MSG_UNAUTHORIZED);
        }

        
        if (visit.getStatus() != VisitStatus.REQUESTED) {
            throw new BadRequestException("Can only reject requested visits");
        }

        visit.setStatus(VisitStatus.CANCELLED);
        if (reason != null && !reason.isEmpty()) {
            visit.setNote(reason);
        }
        visitRepository.save(visit);

        notificationService.createVisitStatusNotification(
            visit.getClient().getId(),
            listing,
            "REJECTED"
        );
        
        webSocketNotificationService.sendVisitNotification(
            visit.getClient().getId(),
            "VISIT_REJECTED",
            "Visita Rifiutata",
            String.format("La tua richiesta di visita per %s è stata rifiutata", listing.getProperty().getAddress()),
            listing.getId(),
            visit.getId()
        );

        log.info("Visit rejected: ID={}", visitId);
    }

    @Transactional
    public void cancelVisitByAgent(UUID agentId, UUID visitId, String reason) {
        Visit visit = visitRepository.findById(visitId)
                .orElseThrow(() -> new NotFoundException(MSG_VISIT_NOT_FOUND));

        Listing listing = visit.getListing();
        if (listing.getAgent() == null || !listing.getAgent().getId().equals(agentId)) {
            throw new ForbiddenException(MSG_UNAUTHORIZED);
        }

        
        if (visit.getStatus() != VisitStatus.CONFIRMED) {
            throw new BadRequestException("Can only cancel confirmed visits");
        }

        visit.setStatus(VisitStatus.CANCELLED);
        if (reason != null && !reason.isEmpty()) {
            visit.setNote(reason);
        }
        visitRepository.save(visit);

        notificationService.createVisitStatusNotification(
            visit.getClient().getId(),
            listing,
            "CANCELLED_BY_AGENT"
        );
        
        webSocketNotificationService.sendVisitNotification(
            visit.getClient().getId(),
            "VISIT_CANCELLED_BY_AGENT",
            "Visita Annullata",
            String.format("L'agente ha annullato la visita confermata per %s", listing.getProperty().getAddress()),
            listing.getId(),
            visit.getId()
        );

        log.info("Visit cancelled by agent: ID={}", visitId);
    }

    @Transactional
    public it.unina.dietiestates25.backend.dto.visit.VisitResponse createVisit(UUID clientId, UUID listingId, Instant scheduledFor, String notes) {
        User client = userRepository.findById(clientId)
                .orElseThrow(() -> new NotFoundException("User not found"));
        
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new NotFoundException("Listing not found"));

        if (listing.getStatus() != ListingStatus.ACTIVE) {
            throw new BadRequestException("Cannot request visit for inactive listing");
        }

        if (scheduledFor.isBefore(Instant.now())) {
            throw new BadRequestException("Cannot schedule visit in the past");
        }

        Visit visit = new Visit();
        visit.setListing(listing);
        visit.setClient(client);
        
        visit.setAgent(listing.getAgent());
        visit.setScheduledFor(scheduledFor);
        visit.setStatus(VisitStatus.REQUESTED);
        visit.setNote(notes);

        Visit savedVisit = visitRepository.save(visit);

        
        if (listing.getAgent() != null) {
            String propertyAddress = listing.getProperty().getAddress();
            notificationService.createAgentNotification(
                listing.getAgent().getId(),
                listing,
                MSG_NEW_VISIT_REQUEST,
                String.format("Nuova richiesta di visita per la proprietà in %s", propertyAddress)
            );
            
            webSocketNotificationService.sendVisitNotification(
                listing.getAgent().getId(),
                "NEW_VISIT_REQUEST",
                MSG_NEW_VISIT_REQUEST,
                String.format("Nuova richiesta di visita per %s", propertyAddress),
                listing.getId(),
                savedVisit.getId()
            );
        }

        log.info("Visit created: ID={}, Client={}, Listing={}, Agent={}", 
            savedVisit.getId(), client.getId(), listing.getId(), 
            listing.getAgent() != null ? listing.getAgent().getId() : "NULL");
        return toVisitResponse(savedVisit);
    }

    @Transactional(readOnly = true)
    public ClientStatsResponse getClientStats(User client) {
        List<Visit> allVisits = visitRepository.findAllByClient_Id(client.getId());
        
        int totalVisits = allVisits.size();
        int completedVisits = (int) allVisits.stream()
                .filter(v -> v.getStatus() == VisitStatus.DONE)
                .count();
        int pendingVisits = (int) allVisits.stream()
                .filter(v -> v.getStatus() == VisitStatus.REQUESTED || v.getStatus() == VisitStatus.CONFIRMED)
                .count();

        return new ClientStatsResponse(pendingVisits, completedVisits, totalVisits);
    }

    @Transactional(readOnly = true)
    public List<String> getOccupiedTimeSlots(UUID agentId, String date) {
        
        LocalDateTime startOfDay = LocalDateTime.parse(date + "T00:00:00");
        LocalDateTime endOfDay = LocalDateTime.parse(date + "T23:59:59");
        
        Instant startInstant = startOfDay.atZone(ZoneId.of(TIME_ZONE_ROME)).toInstant();
        Instant endInstant = endOfDay.atZone(ZoneId.of(TIME_ZONE_ROME)).toInstant();
        
        
        List<Visit> confirmedVisits = visitRepository.findAllByAgent_IdAndStatusAndScheduledForBetween(
            agentId, 
            VisitStatus.CONFIRMED,
            startInstant,
            endInstant
        );
        
        
        return confirmedVisits.stream()
            .map(visit -> {
                LocalDateTime ldt = visit.getScheduledFor().atZone(ZoneId.of(TIME_ZONE_ROME)).toLocalDateTime();
                return ldt.format(DateTimeFormatter.ofPattern("HH:mm"));
            })
            .collect(Collectors.toList());
    }

    private boolean isValidStatusTransition(VisitStatus currentStatus, VisitStatus newStatus) {
        return switch (currentStatus) {
            case REQUESTED -> newStatus == VisitStatus.CONFIRMED || newStatus == VisitStatus.CANCELLED;
            case CONFIRMED -> newStatus == VisitStatus.DONE || newStatus == VisitStatus.CANCELLED;
            case CANCELLED, DONE -> false;
        };
    }

    private Instant convertToInstant(LocalDateTime localDateTime) {
        if (localDateTime == null) return null;
        return localDateTime.atZone(ZoneId.systemDefault()).toInstant();
    }

    private LocalDateTime convertToLocalDateTime(Instant instant) {
        if (instant == null) return null;
        return LocalDateTime.ofInstant(instant, ZoneId.systemDefault());
    }

    private VisitResponseDto toDto(Visit visit) {
        VisitResponseDto dto = new VisitResponseDto();
        dto.setId(visit.getId());
        dto.setListingId(visit.getListing().getId());
        dto.setClientId(visit.getClient().getId());
        dto.setClientName(visit.getClient().getFirstName() + " " + visit.getClient().getLastName());
        dto.setScheduledFor(convertToLocalDateTime(visit.getScheduledFor()));
        dto.setStatus(visit.getStatus());
        dto.setNotes(visit.getNote());
        dto.setCreatedAt(convertToLocalDateTime(visit.getCreatedAt()));
        dto.setUpdatedAt(convertToLocalDateTime(visit.getUpdatedAt()));
        return dto;
    }

    private it.unina.dietiestates25.backend.dto.visit.VisitResponse toVisitResponse(Visit visit) {
        it.unina.dietiestates25.backend.dto.visit.VisitResponse response = new it.unina.dietiestates25.backend.dto.visit.VisitResponse();
        response.setId(visit.getId());
        response.setListingId(visit.getListing().getId().toString());
        response.setPropertyId(visit.getListing().getProperty().getId());
        response.setPropertyTitle(visit.getListing().getTitle());
        response.setPropertyAddress(visit.getListing().getProperty().getAddress());
        response.setClientId(visit.getClient().getId());
        response.setClientName(visit.getClient().getFirstName() + " " + visit.getClient().getLastName());
        response.setClientEmail(visit.getClient().getEmail());
        if (visit.getListing().getAgent() != null) {
            response.setAgentId(visit.getListing().getAgent().getId());
            response.setAgentName(visit.getListing().getAgent().getFirstName() + " " + visit.getListing().getAgent().getLastName());
        } else if (visit.getAgent() != null) {
            response.setAgentId(visit.getAgent().getId());
            response.setAgentName(visit.getAgent().getFirstName() + " " + visit.getAgent().getLastName());
        }
        response.setRequestedAt(visit.getRequestedAt());
        response.setScheduledFor(visit.getScheduledFor());
        
        if (visit.getScheduledFor() != null) {
            LocalDateTime ldt = visit.getScheduledFor().atZone(ZoneId.of(TIME_ZONE_ROME)).toLocalDateTime();
            response.setScheduledDate(ldt.format(DateTimeFormatter.ISO_LOCAL_DATE));
            response.setScheduledTime(ldt.format(DateTimeFormatter.ofPattern("HH:mm")));
        }
        response.setStatus(visit.getStatus().name());
        response.setNote(visit.getNote());
        return response;
    }
}
