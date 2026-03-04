package it.unina.dietiestates25.backend.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import it.unina.dietiestates25.backend.dto.dashboard.AgentStatsResponse;
import it.unina.dietiestates25.backend.dto.dashboard.ClientStatsResponse;
import it.unina.dietiestates25.backend.security.UserPrincipal;
import it.unina.dietiestates25.backend.services.DashboardStatsService;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class DashboardStatsController {
    
    private final DashboardStatsService dashboardStatsService;

    public DashboardStatsController(DashboardStatsService dashboardStatsService) {
        this.dashboardStatsService = dashboardStatsService;
    }

    /**
     * Get statistics for client dashboard
     */
    @GetMapping("/client/stats")
    public ResponseEntity<ClientStatsResponse> getClientStats(
            @AuthenticationPrincipal UserPrincipal principal) {
        ClientStatsResponse stats = dashboardStatsService.getClientStats(principal.getId());
        return ResponseEntity.ok(stats);
    }

    /**
     * Get statistics for agent dashboard
     */
    @GetMapping("/agent/stats")
    public ResponseEntity<AgentStatsResponse> getAgentStats(
            @AuthenticationPrincipal UserPrincipal principal) {
        AgentStatsResponse stats = dashboardStatsService.getAgentStats(principal.getId());
        return ResponseEntity.ok(stats);
    }
}
