package it.unina.dietiestates25.backend.controllers;

import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import it.unina.dietiestates25.backend.dto.ChangePasswordRequest;
import it.unina.dietiestates25.backend.entities.User;
import it.unina.dietiestates25.backend.entities.enums.UserRole;
import it.unina.dietiestates25.backend.repositories.UserRepository;
import it.unina.dietiestates25.backend.services.UserService;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:4200")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

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

    /**
     * Recupera tutti gli utenti di un'agenzia filtrati per ruolo
     */
    @GetMapping("/by-role/{role}")
    public ResponseEntity<List<User>> getUsersByRole(
            @PathVariable String role,
            Authentication authentication) {
        try {
            // Recupera l'utente loggato dall'authentication
            String email = authentication.getName();
            User currentUser = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utente non trovato"));
            
            System.out.println("🔍 Recupero utenti con ruolo " + role + " per utente: " + email);
            System.out.println("📋 AgencyId utente corrente: " + currentUser.getAgencyId());
            
            // Verifica che l'utente abbia un'agenzia associata
            if (currentUser.getAgencyId() == null) {
                System.err.println("❌ Errore: l'utente " + email + " non ha un'agenzia associata!");
                return ResponseEntity.status(403)
                    .body(null); // Forbidden - l'utente deve avere un'agenzia
            }
            
            // Converte la stringa in enum UserRole
            UserRole userRole = UserRole.valueOf(role);
            
            // Filtra gli utenti per agenzia e ruolo
            List<User> users = userRepository.findByAgencyIdAndRole(currentUser.getAgencyId(), userRole);
            
            System.out.println("✅ Recuperati " + users.size() + " utenti con ruolo " + role + " per agenzia " + currentUser.getAgencyId());
            
            return ResponseEntity.ok(users);
        } catch (IllegalArgumentException e) {
            System.err.println("❌ Errore: ruolo non valido - " + role);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            System.err.println("❌ Errore nel recupero degli utenti: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Recupera un utente per ID
     */
    @GetMapping("/{userId}")
    public ResponseEntity<User> getUserById(@PathVariable UUID userId) {
        try {
            User user = userService.getUserById(userId);
            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
