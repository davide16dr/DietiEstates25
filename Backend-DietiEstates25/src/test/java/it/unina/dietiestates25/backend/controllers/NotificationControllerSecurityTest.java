package it.unina.dietiestates25.backend.controllers;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
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
import it.unina.dietiestates25.backend.entities.Notification;
import it.unina.dietiestates25.backend.entities.User;
import it.unina.dietiestates25.backend.entities.enums.UserRole;
import it.unina.dietiestates25.backend.security.JwtAuthFilter;
import it.unina.dietiestates25.backend.security.JwtService;
import it.unina.dietiestates25.backend.security.RateLimitFilter;
import it.unina.dietiestates25.backend.security.UserDetailsServiceImpl;
import it.unina.dietiestates25.backend.security.UserPrincipal;
import it.unina.dietiestates25.backend.services.NotificationService;

@WebMvcTest(controllers = NotificationController.class)
@Import({ SecurityConfig.class, JwtAuthFilter.class, RateLimitFilter.class })
class NotificationControllerSecurityTest {

    @Autowired
    MockMvc mockMvc;

    @MockBean
    NotificationService notificationService;

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
    void getNotifications_requiresAuth() throws Exception {
        mockMvc.perform(get("/api/notifications"))
                .andExpect(result -> {
                    int s = result.getResponse().getStatus();
                    org.junit.jupiter.api.Assertions.assertTrue(s == 401 || s == 403);
                });
    }

    @Test
    void getNotifications_withAuth_returnsOk() throws Exception {
        when(notificationService.getUserNotifications(any(UUID.class))).thenReturn(List.of());
        var auth = authToken(UserRole.CLIENT, UUID.randomUUID());

        mockMvc.perform(get("/api/notifications").with(authentication(auth)))
                .andExpect(status().isOk());
    }

    @Test
    void markRead_withAuth_returnsOk() throws Exception {
        UUID notifId = UUID.randomUUID();
        var auth = authToken(UserRole.CLIENT, UUID.randomUUID());

        mockMvc.perform(
            patch("/api/notifications/{id}/read", notifId)
                        .with(authentication(auth))
                        .contentType(MediaType.APPLICATION_JSON)
        )
                .andExpect(status().isOk());

        verify(notificationService).markAsRead(notifId);
    }
}
