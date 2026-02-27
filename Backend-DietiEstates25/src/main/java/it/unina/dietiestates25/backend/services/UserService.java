package it.unina.dietiestates25.backend.services;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import it.unina.dietiestates25.backend.dto.ChangePasswordRequest;
import it.unina.dietiestates25.backend.entities.User;
import it.unina.dietiestates25.backend.repositories.UserRepository;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequest request) {
        System.out.println("🔍 [UserService] Tentativo cambio password per userId: " + userId);
        
        // 1. Trova l'utente
        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    System.out.println("❌ [UserService] Utente NON trovato con ID: " + userId);
                    return new RuntimeException("Utente non trovato");
                });

        System.out.println("✅ [UserService] Utente trovato: " + user.getEmail());

        // 2. Verifica che la vecchia password sia corretta
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash())) {
            System.out.println("❌ [UserService] Password attuale errata per utente: " + user.getEmail());
            throw new RuntimeException("La password attuale non è corretta");
        }

        System.out.println("✅ [UserService] Password attuale verificata correttamente");

        // 3. Valida la nuova password
        if (request.getNewPassword() == null || request.getNewPassword().length() < 8) {
            throw new RuntimeException("La nuova password deve contenere almeno 8 caratteri");
        }

        // 4. Hash della nuova password e salvataggio
        String hashedPassword = passwordEncoder.encode(request.getNewPassword());
        user.setPasswordHash(hashedPassword);
        userRepository.save(user);
        
        System.out.println("✅ [UserService] Password cambiata con successo per utente: " + user.getEmail());
    }

    public User getUserById(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utente non trovato"));
    }
}
