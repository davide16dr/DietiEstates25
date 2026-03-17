package it.unina.dietiestates25.backend.controllers;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import it.unina.dietiestates25.backend.dto.auth.AuthResponse;
import it.unina.dietiestates25.backend.dto.auth.OAuthLoginRequest;
import it.unina.dietiestates25.backend.services.OAuthService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/auth/oauth")
public class OAuthController {

    private static final String KEY_ERROR = "error";

    private final OAuthService oAuthService;

    public OAuthController(OAuthService oAuthService) {
        this.oAuthService = oAuthService;
    }

    /**
     * Endpoint unico per tutti i provider social.
     * Body: { "provider": "google|github|facebook", "token": "..." }
     * - Google:   token = id_token   (da Google Identity Services)
     * - GitHub:   token = code       (code dal redirect OAuth di GitHub)
     * - Facebook: token = access_token (da Facebook JS SDK)
     */
    @PostMapping
    public ResponseEntity<?> oauthLogin(@Valid @RequestBody OAuthLoginRequest request) {
        try {
            AuthResponse response = oAuthService.loginWithOAuth(request.getProvider(), request.getToken());
            return ResponseEntity.ok(response);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(KEY_ERROR, e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(KEY_ERROR, e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(KEY_ERROR, "Errore durante l'autenticazione social: " + e.getMessage()));
        }
    }
}
