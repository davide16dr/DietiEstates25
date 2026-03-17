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
import it.unina.dietiestates25.backend.dto.offer.OfferResponse;
import it.unina.dietiestates25.backend.entities.User;
import it.unina.dietiestates25.backend.entities.enums.UserRole;
import it.unina.dietiestates25.backend.security.JwtAuthFilter;
import it.unina.dietiestates25.backend.security.JwtService;
import it.unina.dietiestates25.backend.security.RateLimitFilter;
import it.unina.dietiestates25.backend.security.UserDetailsServiceImpl;
import it.unina.dietiestates25.backend.security.UserPrincipal;
import it.unina.dietiestates25.backend.services.OfferService;

@WebMvcTest(controllers = ClientOfferController.class)
@Import({ SecurityConfig.class, JwtAuthFilter.class, RateLimitFilter.class })
class ClientOfferControllerSecurityTest {

    @Autowired
    MockMvc mockMvc;

    @MockBean
    OfferService offerService;

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
    void clientOffers_requiresAuth() throws Exception {
        mockMvc.perform(get("/api/client/offers"))
                .andExpect(result -> {
                    int s = result.getResponse().getStatus();
                    org.junit.jupiter.api.Assertions.assertTrue(s == 401 || s == 403);
                });
    }

    @Test
        void clientOffers_authenticatedAsAgent_returnsOk() throws Exception {
                when(offerService.getClientOffers(any(UUID.class))).thenReturn(List.of());
                var auth = authToken(UserRole.AGENT, UUID.randomUUID());

                mockMvc.perform(get("/api/client/offers").with(authentication(auth)))
                                .andExpect(status().isOk());
    }

    @Test
    void getMyOffers_asClient_returnsOk() throws Exception {
        when(offerService.getClientOffers(any(UUID.class))).thenReturn(List.of());
        var auth = authToken(UserRole.CLIENT, UUID.randomUUID());

        mockMvc.perform(get("/api/client/offers").with(authentication(auth)))
                .andExpect(status().isOk());
    }

    @Test
    void submitOffer_asClient_returnsCreated() throws Exception {
        when(offerService.submitOffer(any(UUID.class), any())).thenReturn(new OfferResponse());
        var auth = authToken(UserRole.CLIENT, UUID.randomUUID());

        mockMvc.perform(
                post("/api/client/offers")
                        .with(authentication(auth))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"listingId\":\"" + UUID.randomUUID() + "\",\"amount\":1000}")
        )
                .andExpect(status().isCreated());
    }

    @Test
    void acceptCounterOffer_asClient_returnsOk() throws Exception {
        var auth = authToken(UserRole.CLIENT, UUID.randomUUID());

        mockMvc.perform(
                patch("/api/client/offers/{offerId}/accept-counter", UUID.randomUUID())
                        .with(authentication(auth))
        )
                .andExpect(status().isOk());
    }

    @Test
    void withdrawOffer_whenUnauthorized_returnsForbidden() throws Exception {
        UUID clientId = UUID.randomUUID();
        UUID offerId = UUID.randomUUID();
        doThrow(new RuntimeException("Unauthorized")).when(offerService).withdrawOffer(eq(clientId), eq(offerId));

        var auth = authToken(UserRole.CLIENT, clientId);

        mockMvc.perform(
                patch("/api/client/offers/{offerId}/withdraw", offerId)
                        .with(authentication(auth))
        )
                .andExpect(status().isForbidden());
    }
}
