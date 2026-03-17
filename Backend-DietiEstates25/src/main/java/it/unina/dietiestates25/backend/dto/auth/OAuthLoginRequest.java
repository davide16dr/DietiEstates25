package it.unina.dietiestates25.backend.dto.auth;

import jakarta.validation.constraints.NotBlank;

public class OAuthLoginRequest {

    @NotBlank
    private String provider; // "google" | "github" | "facebook"

    @NotBlank
    private String token; // id_token (Google), access_token (Facebook), code (GitHub)

    public OAuthLoginRequest() {
        // Required by Jackson for request deserialization.
    }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
}
