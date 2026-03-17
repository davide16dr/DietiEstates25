package it.unina.dietiestates25.backend.controllers;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
public class AdminDashboardController {

    private static final String MSG_ADMIN_NOT_FOUND = "Admin not found";
    private static final String MSG_AGENCY_NOT_FOUND = "Agency not found";
    private static final String STATUS_ACTIVE = "Attiva";
    private static final String STATUS_ACTIVE_USER = "attivo";
    private static final String STATUS_INACTIVE_USER = "inattivo";
    private static final String KEY_TOTALI = "totali";
    private static final String KEY_ATTIVI = "attivi";
    private static final String KEY_ID = "id";
    private static final String KEY_NAME = "name";
    private static final String KEY_VAT_NUMBER = "vatNumber";
    private static final String KEY_EMAIL = "email";
    private static final String KEY_PHONE_E164 = "phoneE164";
    private static final String KEY_ADDRESS = "address";
    private static final String KEY_CITY = "city";

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
            .orElseThrow(() -> new RuntimeException(MSG_ADMIN_NOT_FOUND));

        if (admin.getAgencyId() == null) {
            return ResponseEntity.status(403).build();
        }

        UUID agencyId = admin.getAgencyId();
        Agency agency = agencyRepository.findById(agencyId)
            .orElseThrow(() -> new RuntimeException(MSG_AGENCY_NOT_FOUND));

        // Statistiche gestori
        List<User> managers = userRepository.findByAgencyIdAndRole(agencyId, UserRole.AGENCY_MANAGER);
        Map<String, Integer> gestoriStats = new HashMap<>();
        gestoriStats.put(KEY_TOTALI, managers.size());
        gestoriStats.put(KEY_ATTIVI, (int) managers.stream().filter(User::isActive).count());

        // Statistiche agenti
        List<User> agents = userRepository.findByAgencyIdAndRole(agencyId, UserRole.AGENT);
        Map<String, Integer> agentiStats = new HashMap<>();
        agentiStats.put(KEY_TOTALI, agents.size());
        agentiStats.put(KEY_ATTIVI, (int) agents.stream().filter(User::isActive).count());

        // Info agenzia
        AdminStatsResponse.AgencyInfo agencyInfo = new AdminStatsResponse.AgencyInfo(
            agency.getName(),
            agency.getCity(),
            agency.getAddress(),
            STATUS_ACTIVE
        );

        // Ultimi 3 gestori
        List<AdminStatsResponse.RecentUser> recentManagers = managers.stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .limit(3)
                .map(u -> new AdminStatsResponse.RecentUser(
                    u.getId().toString(),
                    u.getFirstName() + " " + u.getLastName(),
                    u.getEmail(),
                    u.isActive() ? STATUS_ACTIVE_USER : STATUS_INACTIVE_USER
                ))
                .toList();

        // Ultimi 3 agenti
        List<AdminStatsResponse.RecentUser> recentAgents = agents.stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .limit(3)
                .map(u -> new AdminStatsResponse.RecentUser(
                    u.getId().toString(),
                    u.getFirstName() + " " + u.getLastName(),
                    u.getEmail(),
                    u.isActive() ? STATUS_ACTIVE_USER : STATUS_INACTIVE_USER
                ))
                .toList();

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
                .orElseThrow(() -> new RuntimeException(MSG_ADMIN_NOT_FOUND));

        if (admin.getAgencyId() == null) {
            return ResponseEntity.status(403).build();
        }

        Agency agency = agencyRepository.findById(admin.getAgencyId())
            .orElseThrow(() -> new RuntimeException(MSG_AGENCY_NOT_FOUND));

        Map<String, Object> agencyDetails = new HashMap<>();
        agencyDetails.put(KEY_ID, agency.getId().toString());
        agencyDetails.put(KEY_NAME, agency.getName());
        agencyDetails.put(KEY_VAT_NUMBER, agency.getVatNumber());
        agencyDetails.put(KEY_EMAIL, agency.getEmail());
        agencyDetails.put(KEY_PHONE_E164, agency.getPhoneE164());
        agencyDetails.put(KEY_ADDRESS, agency.getAddress());
        agencyDetails.put(KEY_CITY, agency.getCity());

        return ResponseEntity.ok(agencyDetails);
    }

    @PutMapping("/agency/{agencyId}")
    public ResponseEntity<Map<String, Object>> updateAgencyDetails(
            @PathVariable UUID agencyId,
            @RequestBody Map<String, String> updates,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        UUID userId = principal.getId();
        User admin = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException(MSG_ADMIN_NOT_FOUND));

        if (admin.getAgencyId() == null || !admin.getAgencyId().equals(agencyId)) {
            return ResponseEntity.status(403).build();
        }

        Agency agency = agencyRepository.findById(agencyId)
            .orElseThrow(() -> new RuntimeException(MSG_AGENCY_NOT_FOUND));

        // Aggiorna i campi forniti
        if (updates.containsKey(KEY_NAME)) {
            agency.setName(updates.get(KEY_NAME));
        }
        if (updates.containsKey(KEY_VAT_NUMBER)) {
            agency.setVatNumber(updates.get(KEY_VAT_NUMBER));
        }
        if (updates.containsKey(KEY_EMAIL)) {
            agency.setEmail(updates.get(KEY_EMAIL));
        }
        if (updates.containsKey(KEY_PHONE_E164)) {
            agency.setPhoneE164(updates.get(KEY_PHONE_E164));
        }
        if (updates.containsKey(KEY_ADDRESS)) {
            agency.setAddress(updates.get(KEY_ADDRESS));
        }
        if (updates.containsKey(KEY_CITY)) {
            agency.setCity(updates.get(KEY_CITY));
        }

        Agency updatedAgency = agencyRepository.save(agency);

        Map<String, Object> response = new HashMap<>();
        response.put(KEY_ID, updatedAgency.getId().toString());
        response.put(KEY_NAME, updatedAgency.getName());
        response.put(KEY_VAT_NUMBER, updatedAgency.getVatNumber());
        response.put(KEY_EMAIL, updatedAgency.getEmail());
        response.put(KEY_PHONE_E164, updatedAgency.getPhoneE164());
        response.put(KEY_ADDRESS, updatedAgency.getAddress());
        response.put(KEY_CITY, updatedAgency.getCity());

        return ResponseEntity.ok(response);
    }
}
