package it.unina.dietiestates25.backend.controllers;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import it.unina.dietiestates25.backend.dto.dashboard.AdminStatsResponse;
import it.unina.dietiestates25.backend.entities.Agency;
import it.unina.dietiestates25.backend.entities.User;
import it.unina.dietiestates25.backend.entities.enums.UserRole;
import it.unina.dietiestates25.backend.repositories.AgencyRepository;
import it.unina.dietiestates25.backend.repositories.UserRepository;
import it.unina.dietiestates25.backend.security.UserPrincipal;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class AdminDashboardController {

    private final UserRepository userRepository;
    private final AgencyRepository agencyRepository;

    public AdminDashboardController(UserRepository userRepository, AgencyRepository agencyRepository) {
        this.userRepository = userRepository;
        this.agencyRepository = agencyRepository;
    }

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsResponse> getAdminStats(@AuthenticationPrincipal UserPrincipal principal) {
        UUID userId = principal.getId();
        User admin = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        if (admin.getAgencyId() == null) {
            return ResponseEntity.status(403).build();
        }

        UUID agencyId = admin.getAgencyId();
        Agency agency = agencyRepository.findById(agencyId)
                .orElseThrow(() -> new RuntimeException("Agency not found"));

        // Statistiche gestori
        List<User> managers = userRepository.findByAgencyIdAndRole(agencyId, UserRole.AGENCY_MANAGER);
        Map<String, Integer> gestoriStats = new HashMap<>();
        gestoriStats.put("totali", managers.size());
        gestoriStats.put("attivi", (int) managers.stream().filter(User::isActive).count());

        // Statistiche agenti
        List<User> agents = userRepository.findByAgencyIdAndRole(agencyId, UserRole.AGENT);
        Map<String, Integer> agentiStats = new HashMap<>();
        agentiStats.put("totali", agents.size());
        agentiStats.put("attivi", (int) agents.stream().filter(User::isActive).count());

        // Info agenzia
        AdminStatsResponse.AgencyInfo agencyInfo = new AdminStatsResponse.AgencyInfo(
            agency.getName(),
            agency.getCity(),
            agency.getAddress(),
            "Attiva"
        );

        // Ultimi 3 gestori
        List<AdminStatsResponse.RecentUser> recentManagers = managers.stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .limit(3)
                .map(u -> new AdminStatsResponse.RecentUser(
                    u.getId().toString(),
                    u.getFirstName() + " " + u.getLastName(),
                    u.getEmail(),
                    u.isActive() ? "attivo" : "inattivo"
                ))
                .collect(Collectors.toList());

        // Ultimi 3 agenti
        List<AdminStatsResponse.RecentUser> recentAgents = agents.stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .limit(3)
                .map(u -> new AdminStatsResponse.RecentUser(
                    u.getId().toString(),
                    u.getFirstName() + " " + u.getLastName(),
                    u.getEmail(),
                    u.isActive() ? "attivo" : "inattivo"
                ))
                .collect(Collectors.toList());

        // Costruisci la risposta
        AdminStatsResponse response = new AdminStatsResponse();
        response.setGestori(gestoriStats);
        response.setAgenti(agentiStats);
        response.setAgencyInfo(agencyInfo);
        response.setRecentManagers(recentManagers);
        response.setRecentAgents(recentAgents);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/agency")
    public ResponseEntity<Map<String, Object>> getAgencyDetails(@AuthenticationPrincipal UserPrincipal principal) {
        UUID userId = principal.getId();
        User admin = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        if (admin.getAgencyId() == null) {
            return ResponseEntity.status(403).build();
        }

        Agency agency = agencyRepository.findById(admin.getAgencyId())
                .orElseThrow(() -> new RuntimeException("Agency not found"));

        Map<String, Object> agencyDetails = new HashMap<>();
        agencyDetails.put("id", agency.getId().toString());
        agencyDetails.put("name", agency.getName());
        agencyDetails.put("vatNumber", agency.getVatNumber());
        agencyDetails.put("email", agency.getEmail());
        agencyDetails.put("phoneE164", agency.getPhoneE164());
        agencyDetails.put("address", agency.getAddress());
        agencyDetails.put("city", agency.getCity());

        return ResponseEntity.ok(agencyDetails);
    }

    @PutMapping("/agency/{agencyId}")
    public ResponseEntity<Map<String, Object>> updateAgencyDetails(
            @PathVariable UUID agencyId,
            @RequestBody Map<String, String> updates,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        UUID userId = principal.getId();
        User admin = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        if (admin.getAgencyId() == null || !admin.getAgencyId().equals(agencyId)) {
            return ResponseEntity.status(403).build();
        }

        Agency agency = agencyRepository.findById(agencyId)
                .orElseThrow(() -> new RuntimeException("Agency not found"));

        // Aggiorna i campi forniti
        if (updates.containsKey("name")) {
            agency.setName(updates.get("name"));
        }
        if (updates.containsKey("vatNumber")) {
            agency.setVatNumber(updates.get("vatNumber"));
        }
        if (updates.containsKey("email")) {
            agency.setEmail(updates.get("email"));
        }
        if (updates.containsKey("phoneE164")) {
            agency.setPhoneE164(updates.get("phoneE164"));
        }
        if (updates.containsKey("address")) {
            agency.setAddress(updates.get("address"));
        }
        if (updates.containsKey("city")) {
            agency.setCity(updates.get("city"));
        }

        Agency updatedAgency = agencyRepository.save(agency);

        Map<String, Object> response = new HashMap<>();
        response.put("id", updatedAgency.getId().toString());
        response.put("name", updatedAgency.getName());
        response.put("vatNumber", updatedAgency.getVatNumber());
        response.put("email", updatedAgency.getEmail());
        response.put("phoneE164", updatedAgency.getPhoneE164());
        response.put("address", updatedAgency.getAddress());
        response.put("city", updatedAgency.getCity());

        return ResponseEntity.ok(response);
    }
}
