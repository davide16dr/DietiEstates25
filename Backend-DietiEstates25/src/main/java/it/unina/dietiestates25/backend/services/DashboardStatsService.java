package it.unina.dietiestates25.backend.services;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import it.unina.dietiestates25.backend.dto.dashboard.AgentStatsResponse;
import it.unina.dietiestates25.backend.dto.dashboard.ClientStatsResponse;
import it.unina.dietiestates25.backend.entities.Listing;
import it.unina.dietiestates25.backend.entities.enums.OfferStatus;
import it.unina.dietiestates25.backend.entities.enums.VisitStatus;
import it.unina.dietiestates25.backend.repositories.ListingRepository;
import it.unina.dietiestates25.backend.repositories.OfferRepository;
import it.unina.dietiestates25.backend.repositories.UserRepository;
import it.unina.dietiestates25.backend.repositories.VisitRepository;

@Service
public class DashboardStatsService {
    
    private final VisitRepository visitRepository;
    private final ListingRepository listingRepository;
    private final UserRepository userRepository;
    private final OfferRepository offerRepository;

    public DashboardStatsService(
            VisitRepository visitRepository,
            ListingRepository listingRepository,
            UserRepository userRepository,
            OfferRepository offerRepository) {
        this.visitRepository = visitRepository;
        this.listingRepository = listingRepository;
        this.userRepository = userRepository;
        this.offerRepository = offerRepository;
    }

    public ClientStatsResponse getClientStats(UUID clientId) {
        long totalVisits = visitRepository.findAllByClient_Id(clientId).size();
        long pendingVisits = visitRepository.findAllByClient_IdAndStatus(clientId, VisitStatus.REQUESTED).size() +
                            visitRepository.findAllByClient_IdAndStatus(clientId, VisitStatus.CONFIRMED).size();
        long completedVisits = visitRepository.findAllByClient_IdAndStatus(clientId, VisitStatus.DONE).size();

        return new ClientStatsResponse((int)pendingVisits, (int)completedVisits, (int)totalVisits);
    }

    public AgentStatsResponse getAgentStats(UUID agentId) {
        long pendingVisits = visitRepository.findAllByAgent_Id(agentId).stream()
                .filter(v -> v.getStatus() == VisitStatus.REQUESTED)
                .count();
        long completedVisits = visitRepository.findAllByAgent_Id(agentId).stream()
                .filter(v -> v.getStatus() == VisitStatus.DONE)
                .count();
        
        // Count today's visits
        LocalDate today = LocalDate.now();
        Instant startOfDay = today.atStartOfDay(ZoneId.systemDefault()).toInstant();
        Instant endOfDay = today.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant();
        
        long todayVisits = visitRepository.findAllByAgent_Id(agentId).stream()
                .filter(v -> v.getScheduledFor() != null && 
                            v.getScheduledFor().isAfter(startOfDay) && 
                            v.getScheduledFor().isBefore(endOfDay))
                .count();
        
        long totalProperties = listingRepository.findAllByAgent_Id(agentId).size();
        
        // Count pending offers for agent's properties
        List<Listing> agentListings = listingRepository.findAllByAgent_Id(agentId);
        long pendingOffers = agentListings.stream()
                .flatMap(listing -> offerRepository.findAllByListing_Id(listing.getId()).stream())
                .filter(offer -> offer.getStatus() == OfferStatus.SUBMITTED)
                .count();

        return new AgentStatsResponse((int)totalProperties, (int)pendingVisits, (int)todayVisits, (int)completedVisits, (int)pendingOffers);
    }
}
