package it.unina.dietiestates25.backend.controllers;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import it.unina.dietiestates25.backend.dto.dashboard.ClientStatsResponse;
import it.unina.dietiestates25.backend.security.UserPrincipal;
import it.unina.dietiestates25.backend.services.DashboardStatsService;

@RestController
@RequestMapping("/api/dashboard/client")
public class ClientDashboardController {

    private final DashboardStatsService dashboardStatsService;

    public ClientDashboardController(DashboardStatsService dashboardStatsService) {
        this.dashboardStatsService = dashboardStatsService;
    }

    @GetMapping("/stats")
    public ResponseEntity<ClientStatsResponse> getStats(@AuthenticationPrincipal UserPrincipal principal) {
        UUID clientId = principal.getId();
        ClientStatsResponse stats = dashboardStatsService.getClientStats(clientId);
        return ResponseEntity.ok(stats);
    }
}
