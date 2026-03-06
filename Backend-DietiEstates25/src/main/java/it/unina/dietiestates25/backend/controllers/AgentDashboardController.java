package it.unina.dietiestates25.backend.controllers;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import it.unina.dietiestates25.backend.dto.dashboard.AgentStatsResponse;
import it.unina.dietiestates25.backend.security.UserPrincipal;
import it.unina.dietiestates25.backend.services.DashboardStatsService;

@RestController
@RequestMapping("/api/dashboard/agent")
public class AgentDashboardController {

    private final DashboardStatsService dashboardStatsService;

    public AgentDashboardController(DashboardStatsService dashboardStatsService) {
        this.dashboardStatsService = dashboardStatsService;
    }

    @GetMapping("/stats")
    public ResponseEntity<AgentStatsResponse> getStats(@AuthenticationPrincipal UserPrincipal principal) {
        UUID agentId = principal.getId();
        AgentStatsResponse stats = dashboardStatsService.getAgentStats(agentId);
        return ResponseEntity.ok(stats);
    }
}
