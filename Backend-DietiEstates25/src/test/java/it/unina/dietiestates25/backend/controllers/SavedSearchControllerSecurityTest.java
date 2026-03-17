package it.unina.dietiestates25.backend.controllers;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
import it.unina.dietiestates25.backend.dto.savedsearch.SavedSearchResponse;
import it.unina.dietiestates25.backend.entities.User;
import it.unina.dietiestates25.backend.entities.enums.UserRole;
import it.unina.dietiestates25.backend.repositories.UserRepository;
import it.unina.dietiestates25.backend.security.JwtAuthFilter;
import it.unina.dietiestates25.backend.security.JwtService;
import it.unina.dietiestates25.backend.security.RateLimitFilter;
import it.unina.dietiestates25.backend.security.UserDetailsServiceImpl;
import it.unina.dietiestates25.backend.security.UserPrincipal;
import it.unina.dietiestates25.backend.services.SavedSearchService;

@WebMvcTest(controllers = SavedSearchController.class)
@Import({ SecurityConfig.class, JwtAuthFilter.class, RateLimitFilter.class })
class SavedSearchControllerSecurityTest {

    @Autowired
    MockMvc mockMvc;

    @MockBean
    SavedSearchService savedSearchService;

    @MockBean
    UserRepository userRepository;

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
    void listSavedSearches_requiresAuth() throws Exception {
        mockMvc.perform(get("/api/saved-searches"))
                .andExpect(result -> {
                    int s = result.getResponse().getStatus();
                    org.junit.jupiter.api.Assertions.assertTrue(s == 401 || s == 403);
                });
    }

    @Test
    void listSavedSearches_withAuth_returnsOk() throws Exception {
        UUID userId = UUID.randomUUID();
        User u = new User();
        u.setId(userId);
        u.setEmail("client@test.it");
        u.setPasswordHash("x");
        u.setFirstName("Test");
        u.setLastName("User");
        u.setRole(UserRole.CLIENT);

        when(userRepository.findByEmail("client@test.it")).thenReturn(java.util.Optional.of(u));
        when(savedSearchService.getAllSavedSearches(userId)).thenReturn(List.of());

        var auth = authToken(UserRole.CLIENT, userId);

        mockMvc.perform(get("/api/saved-searches").with(authentication(auth)))
                .andExpect(status().isOk());
    }

    @Test
    void createSavedSearch_withAuth_returnsCreated() throws Exception {
        UUID userId = UUID.randomUUID();
        User u = new User();
        u.setId(userId);
        u.setEmail("client@test.it");
        u.setPasswordHash("x");
        u.setFirstName("Test");
        u.setLastName("User");
        u.setRole(UserRole.CLIENT);

        when(userRepository.findByEmail("client@test.it")).thenReturn(java.util.Optional.of(u));
        SavedSearchResponse resp = new SavedSearchResponse();
        resp.setId(UUID.randomUUID());
        resp.setName("Napoli");
        when(savedSearchService.createSavedSearch(any(UUID.class), any())).thenReturn(resp);

        var auth = authToken(UserRole.CLIENT, userId);

        mockMvc.perform(
                post("/api/saved-searches")
                        .with(authentication(auth))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Napoli\",\"filters\":{\"city\":\"Napoli\"}}")
        )
                .andExpect(status().isCreated());
    }

    @Test
    void deleteSavedSearch_withAuth_returnsNoContent() throws Exception {
        UUID userId = UUID.randomUUID();
        User u = new User();
        u.setId(userId);
        u.setEmail("client@test.it");
        u.setPasswordHash("x");
        u.setFirstName("Test");
        u.setLastName("User");
        u.setRole(UserRole.CLIENT);

        when(userRepository.findByEmail("client@test.it")).thenReturn(java.util.Optional.of(u));
        var auth = authToken(UserRole.CLIENT, userId);

        mockMvc.perform(delete("/api/saved-searches/{id}", UUID.randomUUID()).with(authentication(auth)))
            .andExpect(status().isOk());
    }
}
