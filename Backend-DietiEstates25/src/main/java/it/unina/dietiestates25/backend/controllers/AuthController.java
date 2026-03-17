package it.unina.dietiestates25.backend.controllers;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import it.unina.dietiestates25.backend.dto.auth.AuthResponse;
import it.unina.dietiestates25.backend.dto.auth.ForgotPasswordRequest;
import it.unina.dietiestates25.backend.dto.auth.LoginRequest;
import it.unina.dietiestates25.backend.dto.auth.RegisterBusinessRequest;
import it.unina.dietiestates25.backend.dto.auth.RegisterRequest;
import it.unina.dietiestates25.backend.dto.auth.ResetPasswordRequest;
import it.unina.dietiestates25.backend.services.AuthService;
import it.unina.dietiestates25.backend.services.BusinessRegistrationService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private static final String KEY_ERROR = "error";
    private static final String KEY_MESSAGE = "message";
    private static final String KEY_EMAIL = "email";

    private static final String MSG_INVALID_CREDENTIALS = "Email o password non corrette.";
    private static final String MSG_LOGIN_ERROR_PREFIX = "Errore durante l'autenticazione: ";
    private static final String MSG_EMAIL_ALREADY_REGISTERED = "Email già registrata nel sistema.";
    private static final String MSG_REGISTRATION_ERROR_PREFIX = "Errore durante la registrazione: ";
    private static final String MSG_BUSINESS_REGISTRATION_SUCCESS = "Registrazione aziendale completata con successo. Controlla la tua email per i dati di accesso.";
    private static final String MSG_PASSWORD_RESET_INFO = "Se l'email è registrata, riceverai le istruzioni per il reset della password.";
    private static final String MSG_PASSWORD_RESET_SUCCESS = "Password aggiornata con successo.";

    private final AuthService authService;
    private final BusinessRegistrationService businessRegistrationService;

    public AuthController(AuthService authService, BusinessRegistrationService businessRegistrationService) {
        this.authService = authService;
        this.businessRegistrationService = businessRegistrationService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (AuthenticationException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put(KEY_ERROR, MSG_INVALID_CREDENTIALS);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put(KEY_ERROR, MSG_LOGIN_ERROR_PREFIX + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            AuthResponse response = authService.register(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put(KEY_ERROR, MSG_EMAIL_ALREADY_REGISTERED);
            return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put(KEY_ERROR, MSG_REGISTRATION_ERROR_PREFIX + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PostMapping("/register-business")
    public ResponseEntity<?> registerBusiness(@Valid @RequestBody RegisterBusinessRequest request) {
        try {
            businessRegistrationService.registerBusiness(request);
            
            Map<String, String> response = new HashMap<>();
            response.put(KEY_MESSAGE, MSG_BUSINESS_REGISTRATION_SUCCESS);
            response.put(KEY_EMAIL, request.getEmail());
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put(KEY_ERROR, e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put(KEY_ERROR, MSG_REGISTRATION_ERROR_PREFIX + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        // Risponde sempre 200 per evitare user enumeration
        authService.requestPasswordReset(request.getEmail());
        Map<String, String> response = new HashMap<>();
        response.put(KEY_MESSAGE, MSG_PASSWORD_RESET_INFO);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        try {
            authService.resetPassword(request.getToken(), request.getNewPassword());
            Map<String, String> response = new HashMap<>();
            response.put(KEY_MESSAGE, MSG_PASSWORD_RESET_SUCCESS);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put(KEY_ERROR, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }
}