package it.unina.dietiestates25.backend.controllers;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import it.unina.dietiestates25.backend.dto.ChangePasswordRequest;
import it.unina.dietiestates25.backend.services.UserService;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:4200")
public class UserController {

    @Autowired
    private UserService userService;

    @PutMapping("/{userId}/password")
    public ResponseEntity<?> changePassword(
            @PathVariable UUID userId,
            @RequestBody ChangePasswordRequest request) {
        try {
            System.out.println("📨 [UserController] Ricevuta richiesta cambio password");
            System.out.println("📋 [UserController] userId dal path: " + userId);
            System.out.println("📋 [UserController] oldPassword presente: " + (request.getOldPassword() != null));
            System.out.println("📋 [UserController] newPassword presente: " + (request.getNewPassword() != null));
            
            userService.changePassword(userId, request);
            
            return ResponseEntity.ok().body("{\"message\": \"Password cambiata con successo\"}");
        } catch (RuntimeException e) {
            System.out.println("❌ [UserController] Errore: " + e.getMessage());
            return ResponseEntity.badRequest().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }
}
