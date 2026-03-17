package it.unina.dietiestates25.backend.controllers;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import it.unina.dietiestates25.backend.config.SecurityConfig;
import it.unina.dietiestates25.backend.dto.auth.AuthResponse;
import it.unina.dietiestates25.backend.security.JwtAuthFilter;
import it.unina.dietiestates25.backend.security.JwtService;
import it.unina.dietiestates25.backend.security.RateLimitFilter;
import it.unina.dietiestates25.backend.security.UserDetailsServiceImpl;
import it.unina.dietiestates25.backend.services.AuthService;
import it.unina.dietiestates25.backend.services.BusinessRegistrationService;

@WebMvcTest(controllers = AuthController.class)
@Import({ SecurityConfig.class, JwtAuthFilter.class, RateLimitFilter.class })
class AuthControllerWebMvcTest {

    @Autowired
    MockMvc mockMvc;

    @MockBean
    AuthService authService;

        @MockBean
        BusinessRegistrationService businessRegistrationService;

    // Needed to instantiate JwtAuthFilter
    @MockBean
    JwtService jwtService;

    @MockBean
    UserDetailsServiceImpl userDetailsService;

    @Test
    void login_withValidPayload_returnsOk() throws Exception {
                AuthResponse loginResp = new AuthResponse();
                loginResp.setAccessToken("fake.jwt.token");
                when(authService.login(any())).thenReturn(loginResp);

        mockMvc.perform(
                post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"user@test.it\",\"password\":\"Password123!\"}")
        )
                .andExpect(status().isOk());
    }

    @Test
    void registerUser_withValidPayload_returnsCreated() throws Exception {
                AuthResponse regResp = new AuthResponse();
                regResp.setAccessToken("fake.jwt.token");
                when(authService.register(any())).thenReturn(regResp);

        mockMvc.perform(
                post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"user2@test.it\",\"password\":\"Password123!\",\"firstName\":\"Mario\",\"lastName\":\"Rossi\",\"phoneE164\":\"+393331231231\",\"role\":\"CLIENT\"}")
        )
                .andExpect(status().isCreated());
    }

    @Test
    void registerBusiness_withValidPayload_returnsCreated() throws Exception {
        mockMvc.perform(
                post("/auth/register-business")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"biz@test.it\",\"firstName\":\"Luigi\",\"lastName\":\"Bianchi\",\"companyName\":\"Agenzia Test\",\"vatNumber\":\"12345678901\",\"city\":\"Napoli\",\"address\":\"Via Roma 1\",\"phoneE164\":\"+393331231231\"}")
        )
                .andExpect(status().isCreated());
    }
}
