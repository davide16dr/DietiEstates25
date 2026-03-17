package it.unina.dietiestates25.backend.controllers;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;

import it.unina.dietiestates25.backend.config.SecurityConfig;
import it.unina.dietiestates25.backend.dto.visit.VisitResponse;
import it.unina.dietiestates25.backend.entities.User;
import it.unina.dietiestates25.backend.entities.enums.UserRole;
import it.unina.dietiestates25.backend.security.JwtAuthFilter;
import it.unina.dietiestates25.backend.security.JwtService;
import it.unina.dietiestates25.backend.security.RateLimitFilter;
import it.unina.dietiestates25.backend.security.UserDetailsServiceImpl;
import it.unina.dietiestates25.backend.security.UserPrincipal;
import it.unina.dietiestates25.backend.services.VisitService;

@WebMvcTest(controllers = ClientVisitController.class)
@Import({ SecurityConfig.class, JwtAuthFilter.class, RateLimitFilter.class })
class ClientVisitControllerSecurityTest {

    @Autowired
    MockMvc mockMvc;

    @MockBean
    VisitService visitService;

    @MockBean
    JwtService jwtService;

    @MockBean
    UserDetailsServiceImpl userDetailsService;

    private static UsernamePasswordAuthenticationToken authToken(UserRole role, UUID userId) {
        User u = new User();
        u.setId(userId);
        u.setEmail(role.name().toLowerCase() + "@test.it");
        u.setPasswordHash("x");
        u.setFirstName("Test");
        u.setLastName("User");
        u.setRole(role);

        UserPrincipal principal = new UserPrincipal(u);
        return new UsernamePasswordAuthenticationToken(
                principal,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_" + role.name()))
        );
    }

    @Test
    void clientVisits_requiresAuth() throws Exception {
        mockMvc.perform(get("/api/client/visits"))
                .andExpect(result -> {
                    int s = result.getResponse().getStatus();
                    org.junit.jupiter.api.Assertions.assertTrue(s == 401 || s == 403);
                });
    }

    @Test
        void clientVisits_authenticatedAsAgent_returnsOk() throws Exception {
                when(visitService.getClientVisits(any(UUID.class))).thenReturn(List.of());
                var auth = authToken(UserRole.AGENT, UUID.randomUUID());

                mockMvc.perform(get("/api/client/visits").with(authentication(auth)))
                                .andExpect(status().isOk());
    }

    @Test
    void getMyVisits_asClient_returnsOk() throws Exception {
        when(visitService.getClientVisits(any(UUID.class))).thenReturn(List.of());
        var auth = authToken(UserRole.CLIENT, UUID.randomUUID());

        mockMvc.perform(get("/api/client/visits").with(authentication(auth)))
                .andExpect(status().isOk());
    }

    @Test
    void createVisit_asClient_returnsCreated() throws Exception {
        when(visitService.createVisit(any(UUID.class), any(UUID.class), any(Instant.class), any()))
                .thenReturn(new VisitResponse());
        var auth = authToken(UserRole.CLIENT, UUID.randomUUID());
        UUID listingId = UUID.randomUUID();

        mockMvc.perform(
                post("/api/client/visits")
                        .with(authentication(auth))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"listingId\":\"" + listingId + "\",\"scheduledFor\":\"2026-03-17T10:00:00Z\",\"notes\":\"ok\"}")
        )
                .andExpect(status().isCreated());
    }

    @Test
    void availableSlots_badUuid_returnsBadRequest() throws Exception {
        var auth = authToken(UserRole.CLIENT, UUID.randomUUID());
        mockMvc.perform(get("/api/client/visits/available-slots")
                .with(authentication(auth))
                .param("listingId", "not-a-uuid")
                .param("date", "2026-03-17"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void cancelVisit_whenUnauthorized_returnsForbidden() throws Exception {
        UUID clientId = UUID.randomUUID();
        UUID visitId = UUID.randomUUID();
        doThrow(new RuntimeException("Unauthorized")).when(visitService).cancelVisit(eq(clientId), eq(visitId));

        var auth = authToken(UserRole.CLIENT, clientId);

        mockMvc.perform(
                patch("/api/client/visits/{id}/cancel", visitId)
                        .with(authentication(auth))
        )
                .andExpect(status().isForbidden());
    }
}
