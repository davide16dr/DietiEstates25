package it.unina.dietiestates25.backend.services;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Collections;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;

import it.unina.dietiestates25.backend.dto.auth.AuthResponse;
import it.unina.dietiestates25.backend.entities.User;
import it.unina.dietiestates25.backend.entities.enums.UserRole;
import it.unina.dietiestates25.backend.repositories.UserRepository;
import it.unina.dietiestates25.backend.security.JwtService;

@Service
public class OAuthService {

    private static final Logger log = LoggerFactory.getLogger(OAuthService.class);
    private static final String PROVIDER_GOOGLE = "google";
    private static final String PROVIDER_GITHUB = "github";
    private static final String PROVIDER_FACEBOOK = "facebook";
    private static final String MSG_PROVIDER_NOT_SUPPORTED = "Provider OAuth non supportato: ";
    private static final String MSG_GOOGLE_TOKEN_INVALID = "Google id_token non valido o scaduto";
    private static final String MSG_GOOGLE_TOKEN_ERROR = "Impossibile verificare il token Google: ";
    private static final String MSG_GITHUB_ACCESS_TOKEN_INVALID = "GitHub non ha restituito un access_token valido";
    private static final String MSG_GITHUB_EMAIL_UNAVAILABLE = "GitHub non ha esposto nessun indirizzo email verificato";
    private static final String MSG_GITHUB_TOKEN_ERROR = "Impossibile autenticarsi con GitHub: ";
    private static final String MSG_FACEBOOK_TOKEN_INVALID = "Facebook access_token non valido";
    private static final String MSG_FACEBOOK_TOKEN_ERROR = "Impossibile autenticarsi con Facebook: ";
    private static final String MSG_ACCOUNT_DISABLED = "Account disattivato. Contatta il supporto.";

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Value("${app.oauth.google.client-id:}")
    private String googleClientId;

    @Value("${app.oauth.github.client-id:}")
    private String githubClientId;

    @Value("${app.oauth.github.client-secret:}")
    private String githubClientSecret;

    @Value("${app.oauth.facebook.app-id:}")
    private String facebookAppId;

    @Value("${app.oauth.facebook.app-secret:}")
    private String facebookAppSecret;

    public OAuthService(UserRepository userRepository, JwtService jwtService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PUBLIC ENTRY POINT
    // ─────────────────────────────────────────────────────────────────────────

    @Transactional
    public AuthResponse loginWithOAuth(String provider, String token) {
        return switch (provider.toLowerCase()) {
            case PROVIDER_GOOGLE -> loginWithGoogle(token);
            case PROVIDER_GITHUB -> loginWithGithub(token);
            case PROVIDER_FACEBOOK -> loginWithFacebook(token);
            default -> throw new IllegalArgumentException(MSG_PROVIDER_NOT_SUPPORTED + provider);
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GOOGLE – verifica id_token via Google Identity Services
    // ─────────────────────────────────────────────────────────────────────────

    private AuthResponse loginWithGoogle(String idToken) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(), GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken googleIdToken = verifier.verify(idToken);
            if (googleIdToken == null) {
                throw new SecurityException(MSG_GOOGLE_TOKEN_INVALID);
            }

            GoogleIdToken.Payload payload = googleIdToken.getPayload();
            String email = payload.getEmail();
            String firstName = (String) payload.get("given_name");
            String lastName = (String) payload.get("family_name");
            if (firstName == null) firstName = extractNameFromEmail(email);
            if (lastName == null) lastName = "";

            return findOrCreateUser(email, firstName, lastName);
        } catch (Exception e) {
            log.error("Errore verifica Google token: {}", e.getMessage());
            throw new SecurityException(MSG_GOOGLE_TOKEN_ERROR + e.getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GITHUB – scambia il code con access_token, poi chiama /user
    // ─────────────────────────────────────────────────────────────────────────

    private AuthResponse loginWithGithub(String code) {
        try {
            // 1) Scambia il code con l'access token
            String tokenRequestBody = "client_id=" + githubClientId
                    + "&client_secret=" + githubClientSecret
                    + "&code=" + code;

            HttpRequest tokenRequest = HttpRequest.newBuilder()
                    .uri(URI.create("https://github.com/login/oauth/access_token"))
                    .header("Accept", "application/json")
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(tokenRequestBody))
                    .build();

            HttpResponse<String> tokenResponse;
            try {
                tokenResponse = httpClient.send(tokenRequest, HttpResponse.BodyHandlers.ofString());
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new SecurityException("GitHub token request interrupted", e);
            }
            JsonNode tokenJson = objectMapper.readTree(tokenResponse.body());
            String accessToken = tokenJson.path("access_token").asText();

            if (accessToken == null || accessToken.isBlank()) {
                throw new SecurityException(MSG_GITHUB_ACCESS_TOKEN_INVALID);
            }

            // 2) Ottieni i dati utente
            HttpRequest userRequest = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.github.com/user"))
                    .header("Authorization", "Bearer " + accessToken)
                    .header("Accept", "application/vnd.github+json")
                    .GET()
                    .build();

            HttpResponse<String> userResponse;
            try {
                userResponse = httpClient.send(userRequest, HttpResponse.BodyHandlers.ofString());
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new SecurityException("GitHub user request interrupted", e);
            }
            JsonNode userJson = objectMapper.readTree(userResponse.body());

            // GitHub potrebbe non esporre l'email pubblicamente – chiama /user/emails
            String email = userJson.path("email").asText(null);
            if (email == null || email.isBlank()) {
                email = getGithubPrimaryEmail(accessToken);
            }

            String name = userJson.path("name").asText(userJson.path("login").asText());
            String[] nameParts = name.split(" ", 2);
            String firstName = nameParts[0];
            String lastName = nameParts.length > 1 ? nameParts[1] : "";

            return findOrCreateUser(email, firstName, lastName);
        } catch (SecurityException se) {
            throw se;
        } catch (Exception e) {
            log.error("Errore GitHub OAuth: {}", e.getMessage());
            throw new SecurityException(MSG_GITHUB_TOKEN_ERROR + e.getMessage());
        }
    }

    private String getGithubPrimaryEmail(String accessToken) throws IOException {
        HttpRequest emailRequest = HttpRequest.newBuilder()
                .uri(URI.create("https://api.github.com/user/emails"))
                .header("Authorization", "Bearer " + accessToken)
                .header("Accept", "application/vnd.github+json")
                .GET()
                .build();

        HttpResponse<String> emailResponse;
        try {
            emailResponse = httpClient.send(emailRequest, HttpResponse.BodyHandlers.ofString());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new SecurityException("GitHub email request interrupted", e);
        }
        JsonNode emails = objectMapper.readTree(emailResponse.body());

        for (JsonNode e : emails) {
            if (e.path("primary").asBoolean() && e.path("verified").asBoolean()) {
                return e.path("email").asText();
            }
        }
        if (emails.size() > 0) return emails.get(0).path("email").asText();
        throw new SecurityException(MSG_GITHUB_EMAIL_UNAVAILABLE);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FACEBOOK – verifica l'access_token tramite Graph API debug
    // ─────────────────────────────────────────────────────────────────────────

    private AuthResponse loginWithFacebook(String accessToken) {
        try {
            String appToken = facebookAppId + "|" + facebookAppSecret;

            // 1) Verifica il token
            HttpRequest debugRequest = HttpRequest.newBuilder()
                    .uri(URI.create("https://graph.facebook.com/debug_token?input_token="
                            + accessToken + "&access_token=" + appToken))
                    .GET()
                    .build();

            HttpResponse<String> debugResponse;
            try {
                debugResponse = httpClient.send(debugRequest, HttpResponse.BodyHandlers.ofString());
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new SecurityException("Facebook debug request interrupted", e);
            }
            JsonNode debugJson = objectMapper.readTree(debugResponse.body());
            boolean isValid = debugJson.path("data").path("is_valid").asBoolean(false);

            if (!isValid) {
                throw new SecurityException(MSG_FACEBOOK_TOKEN_INVALID);
            }

            // 2) Ottieni i dati utente
            HttpRequest meRequest = HttpRequest.newBuilder()
                    .uri(URI.create("https://graph.facebook.com/me?fields=id,name,email,first_name,last_name&access_token=" + accessToken))
                    .GET()
                    .build();

            HttpResponse<String> meResponse;
            try {
                meResponse = httpClient.send(meRequest, HttpResponse.BodyHandlers.ofString());
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new SecurityException("Facebook user request interrupted", e);
            }
            JsonNode meJson = objectMapper.readTree(meResponse.body());

            String email = meJson.path("email").asText(null);
            if (email == null || email.isBlank()) {
                // Facebook può non dare l'email se l'utente non ha concesso il permesso
                String fbId = meJson.path("id").asText("unknown");
                email = "fb_" + fbId + "@facebook.oauth";
            }

            String firstName = meJson.path("first_name").asText(extractNameFromEmail(email));
            String lastName = meJson.path("last_name").asText("");

            return findOrCreateUser(email, firstName, lastName);
        } catch (SecurityException se) {
            throw se;
        } catch (Exception e) {
            log.error("Errore Facebook OAuth: {}", e.getMessage());
            throw new SecurityException(MSG_FACEBOOK_TOKEN_ERROR + e.getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FIND OR CREATE USER
    // ─────────────────────────────────────────────────────────────────────────

    private AuthResponse findOrCreateUser(String email, String firstName, String lastName) {
        String normalizedEmail = email.toLowerCase().trim();

        User user = userRepository.findByEmail(normalizedEmail).orElseGet(() -> {
            // Primo accesso: crea l'account come CLIENT
            User newUser = new User();
            newUser.setId(UUID.randomUUID());
            newUser.setEmail(normalizedEmail);
            // Password casuale non usabile (l'utente accede solo via social)
            newUser.setPasswordHash(UUID.randomUUID().toString());
            newUser.setFirstName(firstName);
            newUser.setLastName(lastName.isBlank() ? "-" : lastName);
            newUser.setRole(UserRole.CLIENT);
            newUser.setActive(true);
            return userRepository.save(newUser);
        });

        if (!user.isActive()) {
            throw new SecurityException(MSG_ACCOUNT_DISABLED);
        }

        String jwtToken = jwtService.generateToken(user.getEmail(), Map.of(
                "userId", user.getId().toString(),
                "role", user.getRole().name()
        ));

        return new AuthResponse(
                jwtToken,
                user.getId(),
                user.getEmail(),
                user.getRole().name(),
                user.getFirstName(),
                user.getLastName()
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UTILS
    // ─────────────────────────────────────────────────────────────────────────

    private String extractNameFromEmail(String email) {
        String localPart = email.split("@")[0];
        String[] parts = localPart.split("[._\\-]");
        if (parts.length >= 1) {
            String name = parts[0];
            return Character.toUpperCase(name.charAt(0)) + name.substring(1);
        }
        return localPart;
    }
}
