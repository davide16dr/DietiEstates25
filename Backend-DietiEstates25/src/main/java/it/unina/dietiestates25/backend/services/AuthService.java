package it.unina.dietiestates25.backend.services;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import it.unina.dietiestates25.backend.dto.auth.AuthResponse;
import it.unina.dietiestates25.backend.dto.auth.LoginRequest;
import it.unina.dietiestates25.backend.dto.auth.RegisterRequest;
import it.unina.dietiestates25.backend.entities.User;
import it.unina.dietiestates25.backend.repositories.UserRepository;
import it.unina.dietiestates25.backend.security.JwtService;

@Service
public class AuthService {

    private static final long RESET_TOKEN_VALIDITY_SECONDS = 3600; // 1 ora

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Value("${app.frontend.url:http://localhost:4200}")
    private String frontendUrl;

    public AuthService(AuthenticationManager authenticationManager,
                       UserRepository userRepository,
                       JwtService jwtService,
                       PasswordEncoder passwordEncoder,
                       EmailService emailService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    public AuthResponse login(LoginRequest req) {
        // Normalizza l'email a minuscolo
        String normalizedEmail = req.getEmail().toLowerCase().trim();
        
        // autentica con Spring Security
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normalizedEmail, req.getPassword())
        );

        // carica utente
        User u = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new BadCredentialsException("Bad credentials"));

        // genera JWT
        String token = jwtService.generateToken(u.getEmail(), Map.of(
                "userId", u.getId().toString(),
                "role", u.getRole().name()
        ));

        return new AuthResponse(token, u.getId(), u.getEmail(), u.getRole().name(), u.getFirstName(), u.getLastName());
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        // Normalizza l'email a minuscolo
        String normalizedEmail = req.getEmail().toLowerCase().trim();
        
        // Verifica se l'email esiste già
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("Email already registered");
        }

        // Crea nuovo utente
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        user.setFirstName(req.getFirstName());
        user.setLastName(req.getLastName());
        user.setPhoneE164(req.getPhoneE164());
        user.setRole(req.getRole());
        user.setActive(true);

        // Salva nel database
        user = userRepository.save(user);

        // Genera JWT per login automatico dopo registrazione
        String token = jwtService.generateToken(user.getEmail(), Map.of(
                "userId", user.getId().toString(),
                "role", user.getRole().name()
        ));

        return new AuthResponse(token, user.getId(), user.getEmail(), user.getRole().name(), user.getFirstName(), user.getLastName());
    }

    /**
     * Genera un token di reset e invia l'email. Per sicurezza risponde sempre con successo
     * anche se l'email non esiste (per evitare user enumeration).
     */
    @Transactional
    public void requestPasswordReset(String email) {
        String normalizedEmail = email.toLowerCase().trim();
        Optional<User> userOpt = userRepository.findByEmail(normalizedEmail);

        if (userOpt.isEmpty()) {
            // Non rivelare se l'email esiste o no
            return;
        }

        User user = userOpt.get();

        // Genera un token sicuro (48 byte → 64 caratteri Base64 URL-safe)
        byte[] randomBytes = new byte[48];
        new SecureRandom().nextBytes(randomBytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);

        user.setResetToken(token);
        user.setResetTokenExpiry(Instant.now().plusSeconds(RESET_TOKEN_VALIDITY_SECONDS));
        userRepository.save(user);

        String resetLink = frontendUrl + "/auth/reset-password?token=" + token;
        emailService.sendPasswordResetEmail(user.getEmail(), user.getFirstName(), resetLink);
    }

    /**
     * Verifica il token e aggiorna la password.
     */
    @Transactional
    public void resetPassword(String token, String newPassword) {
        User user = userRepository.findByResetToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Token non valido o scaduto"));

        if (user.getResetTokenExpiry() == null || user.getResetTokenExpiry().isBefore(Instant.now())) {
            throw new IllegalArgumentException("Token scaduto");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);
    }
}