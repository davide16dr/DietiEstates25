package it.unina.dietiestates25.backend.controllers;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import it.unina.dietiestates25.backend.dto.visit.RejectVisitRequest;
import it.unina.dietiestates25.backend.dto.visit.VisitResponse;
import it.unina.dietiestates25.backend.security.UserPrincipal;
import it.unina.dietiestates25.backend.services.VisitService;

@RestController
@RequestMapping("/api/agent/visits")
public class AgentVisitController {

    private static final String MSG_UNAUTHORIZED = "Unauthorized";
    private static final String MSG_NOT_FOUND = "not found";
    
    private final VisitService visitService;

    public AgentVisitController(VisitService visitService) {
        this.visitService = visitService;
    }

    


    @GetMapping
    public ResponseEntity<List<VisitResponse>> getMyVisits(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<VisitResponse> visits = visitService.getAgentVisits(principal.getId());
        return ResponseEntity.ok(visits);
    }

    


    @GetMapping("/occupied-slots")
    public ResponseEntity<List<String>> getOccupiedTimeSlots(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam String date) {
        try {
            List<String> occupiedSlots = visitService.getOccupiedTimeSlots(principal.getId(), date);
            return ResponseEntity.ok(occupiedSlots);
        } catch (RuntimeException e) {
            return ResponseEntity.status(400).build();
        }
    }

    


    @PatchMapping("/{id}/confirm")
    public ResponseEntity<Void> confirmVisit(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        try {
            visitService.confirmVisit(principal.getId(), id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            String msg = e.getMessage() != null ? e.getMessage() : "";
            if (msg.contains(MSG_UNAUTHORIZED)) {
                return ResponseEntity.status(403).build();
            }
            if (msg.contains(MSG_NOT_FOUND)) {
                return ResponseEntity.status(404).build();
            }
            return ResponseEntity.status(400).build();
        }
    }

    


    @PatchMapping("/{id}/complete")
    public ResponseEntity<Void> completeVisit(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        try {
            visitService.completeVisit(principal.getId(), id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            String msg = e.getMessage() != null ? e.getMessage() : "";
            if (msg.contains(MSG_UNAUTHORIZED)) {
                return ResponseEntity.status(403).build();
            }
            if (msg.contains(MSG_NOT_FOUND)) {
                return ResponseEntity.status(404).build();
            }
            return ResponseEntity.status(400).build();
        }
    }

    


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
            if (msg.contains(MSG_UNAUTHORIZED)) {
                return ResponseEntity.status(403).build();
            }
            if (msg.contains(MSG_NOT_FOUND)) {
                return ResponseEntity.status(404).build();
            }
            return ResponseEntity.status(400).build();
        }
    }

    


    @PatchMapping("/{id}/cancel")
    public ResponseEntity<Void> cancelVisit(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @RequestBody(required = false) RejectVisitRequest request) {
        try {
            String reason = request != null ? request.getReason() : null;
            visitService.cancelVisitByAgent(principal.getId(), id, reason);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            String msg = e.getMessage() != null ? e.getMessage() : "";
            if (msg.contains(MSG_UNAUTHORIZED)) {
                return ResponseEntity.status(403).build();
            }
            if (msg.contains(MSG_NOT_FOUND)) {
                return ResponseEntity.status(404).build();
            }
            return ResponseEntity.status(400).build();
        }
    }
}
