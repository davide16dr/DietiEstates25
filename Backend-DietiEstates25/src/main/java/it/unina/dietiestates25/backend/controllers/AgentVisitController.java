package it.unina.dietiestates25.backend.controllers;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import it.unina.dietiestates25.backend.dto.visit.RejectVisitRequest;
import it.unina.dietiestates25.backend.dto.visit.VisitResponse;
import it.unina.dietiestates25.backend.security.UserPrincipal;
import it.unina.dietiestates25.backend.services.VisitService;

@RestController
@RequestMapping("/api/agent/visits")
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class AgentVisitController {
    
    private final VisitService visitService;

    public AgentVisitController(VisitService visitService) {
        this.visitService = visitService;
    }

    /**
     * Get all visits for the current agent
     */
    @GetMapping
    public ResponseEntity<List<VisitResponse>> getMyVisits(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<VisitResponse> visits = visitService.getAgentVisits(principal.getId());
        return ResponseEntity.ok(visits);
    }

    /**
     * Confirm a visit
     */
    @PatchMapping("/{id}/confirm")
    public ResponseEntity<Void> confirmVisit(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        try {
            visitService.confirmVisit(principal.getId(), id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            String msg = e.getMessage() != null ? e.getMessage() : "";
            if (msg.contains("Unauthorized")) {
                return ResponseEntity.status(403).build();
            }
            if (msg.contains("not found")) {
                return ResponseEntity.status(404).build();
            }
            return ResponseEntity.status(400).build();
        }
    }

    /**
     * Mark a visit as completed
     */
    @PatchMapping("/{id}/complete")
    public ResponseEntity<Void> completeVisit(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        try {
            visitService.completeVisit(principal.getId(), id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            String msg = e.getMessage() != null ? e.getMessage() : "";
            if (msg.contains("Unauthorized")) {
                return ResponseEntity.status(403).build();
            }
            if (msg.contains("not found")) {
                return ResponseEntity.status(404).build();
            }
            return ResponseEntity.status(400).build();
        }
    }

    /**
     * Reject a visit
     */
    @PatchMapping("/{id}/reject")
    public ResponseEntity<Void> rejectVisit(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @RequestBody(required = false) RejectVisitRequest request) {
        try {
            String reason = request != null ? request.getReason() : null;
            visitService.rejectVisit(principal.getId(), id, reason);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            String msg = e.getMessage() != null ? e.getMessage() : "";
            if (msg.contains("Unauthorized")) {
                return ResponseEntity.status(403).build();
            }
            if (msg.contains("not found")) {
                return ResponseEntity.status(404).build();
            }
            return ResponseEntity.status(400).build();
        }
    }
}
