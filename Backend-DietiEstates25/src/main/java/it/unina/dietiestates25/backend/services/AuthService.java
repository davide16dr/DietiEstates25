package it.unina.dietiestates25.backend.services;

import java.util.Map;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

import it.unina.dietiestates25.backend.dto.auth.AuthResponse;
import it.unina.dietiestates25.backend.dto.auth.LoginRequest;
import it.unina.dietiestates25.backend.entities.User;
import it.unina.dietiestates25.backend.repositories.UserRepository;
import it.unina.dietiestates25.backend.security.JwtService;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    public AuthService(AuthenticationManager authenticationManager,
                       UserRepository userRepository,
                       JwtService jwtService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    public AuthResponse login(LoginRequest req) {
        // autentica con Spring Security
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword())
        );

        // carica utente
        User u = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Bad credentials"));

        // genera token
        String token = jwtService.generateToken(
                u.getEmail(),
                Map.of("role", u.getRole().name(), "uid", u.getId().toString())
        );

        return new AuthResponse(token, u.getId(), u.getEmail(), u.getRole().name());
    }
}
