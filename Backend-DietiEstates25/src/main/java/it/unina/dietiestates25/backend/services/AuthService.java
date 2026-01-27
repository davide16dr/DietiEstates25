package it.unina.dietiestates25.backend.services;

import java.util.Map;
import java.util.UUID;

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

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    public AuthService(AuthenticationManager authenticationManager,
                       UserRepository userRepository,
                       JwtService jwtService,
                       PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
    }

    public AuthResponse login(LoginRequest req) {
        // autentica con Spring Security
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword())
        );

        // carica utente
        User u = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Bad credentials"));

        // genera JWT
        String token = jwtService.generateToken(u.getEmail(), Map.of(
                "userId", u.getId().toString(),
                "role", u.getRole().name()
        ));

        return new AuthResponse(token, u.getId(), u.getEmail(), u.getRole().name());
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        // Verifica se l'email esiste già
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }

        // Crea nuovo utente
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail(req.getEmail());
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

        return new AuthResponse(token, user.getId(), user.getEmail(), user.getRole().name());
    }
}