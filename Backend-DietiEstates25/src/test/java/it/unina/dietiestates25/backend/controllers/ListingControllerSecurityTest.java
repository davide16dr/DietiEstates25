package it.unina.dietiestates25.backend.controllers;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
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
import it.unina.dietiestates25.backend.dto.listing.ListingResponse;
import it.unina.dietiestates25.backend.entities.User;
import it.unina.dietiestates25.backend.entities.enums.UserRole;
import it.unina.dietiestates25.backend.security.JwtAuthFilter;
import it.unina.dietiestates25.backend.security.JwtService;
import it.unina.dietiestates25.backend.security.RateLimitFilter;
import it.unina.dietiestates25.backend.security.UserDetailsServiceImpl;
import it.unina.dietiestates25.backend.security.UserPrincipal;
import it.unina.dietiestates25.backend.services.ListingService;

@WebMvcTest(controllers = ListingController.class)
@Import({ SecurityConfig.class, JwtAuthFilter.class, RateLimitFilter.class })
class ListingControllerSecurityTest {

    @Autowired
    MockMvc mockMvc;

    @MockBean
    ListingService listingService;

    
    @MockBean
    JwtService jwtService;

    @MockBean
    UserDetailsServiceImpl userDetailsService;

    private static UsernamePasswordAuthenticationToken authToken(UserRole role, UUID userId, String email) {
        User u = new User();
        u.setId(userId);
        u.setEmail(email);
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

    private static ListingResponse sampleListing(UUID id) {
        ListingResponse r = new ListingResponse();
        r.setId(id);
        r.setTitle("Casa test");
        r.setType("SALE");
        r.setStatus("ACTIVE");
        r.setPrice(100000);
        r.setCity("Napoli");
        r.setAddress("Via Roma 1");
        r.setPropertyType("APPARTAMENTO");
        r.setImageUrls(List.of());
        return r;
    }

    @Test
    void getListingById_isPublic() throws Exception {
        UUID id = UUID.randomUUID();
        when(listingService.getById(id)).thenReturn(sampleListing(id));

        mockMvc.perform(get("/api/listings/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id.toString()))
                .andExpect(jsonPath("$.title").value("Casa test"));
    }

    @Test
    void searchListingsGet_isPublic() throws Exception {
        when(listingService.getFilteredListings(any())).thenReturn(List.of());

        mockMvc.perform(get("/api/listings/search").param("city", "Napoli"))
                .andExpect(status().isOk());
    }

    @Test
    void agencyAll_isForbiddenForAgent() throws Exception {
        var auth = authToken(UserRole.AGENT, UUID.randomUUID(), "agent@test.it");

        mockMvc.perform(get("/api/listings/agency/all").with(authentication(auth)))
                .andExpect(status().isForbidden());
    }

    @Test
    void agencyAll_isAllowedForAdmin() throws Exception {
        when(listingService.getAllAgencyListings(any())).thenReturn(List.of());
        var auth = authToken(UserRole.ADMIN, UUID.randomUUID(), "admin@test.it");

        mockMvc.perform(get("/api/listings/agency/all").with(authentication(auth)))
                .andExpect(status().isOk());
    }

    @Test
    void updateListing_isForbiddenForAdmin() throws Exception {
        UUID id = UUID.randomUUID();
        var auth = authToken(UserRole.ADMIN, UUID.randomUUID(), "admin@test.it");

        mockMvc.perform(
                multipart("/api/listings/{id}", id)
                        .with(authentication(auth))
                        .with(r -> {
                            r.setMethod("PUT");
                            return r;
                        })
                        .contentType(MediaType.MULTIPART_FORM_DATA)
                        .param("listing", "{}")
        ).andExpect(status().isForbidden());
    }

    @Test
    void updateListing_isAllowedForAgencyManager() throws Exception {
        UUID id = UUID.randomUUID();
        when(listingService.updateListingWithImages(
                eq(id),
                any(UUID.class),
                any(),
                any(),
            any()
        )).thenReturn(sampleListing(id));

        var auth = authToken(UserRole.AGENCY_MANAGER, UUID.randomUUID(), "manager@test.it");

        mockMvc.perform(
                multipart("/api/listings/{id}", id)
                        .with(authentication(auth))
                        .with(r -> {
                            r.setMethod("PUT");
                            return r;
                        })
                        .contentType(MediaType.MULTIPART_FORM_DATA)
                        .param("listing", "{}")
        )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id.toString()));
    }

    @Test
    void createListing_isForbiddenForAdmin() throws Exception {
        UUID id = UUID.randomUUID();
        var auth = authToken(UserRole.ADMIN, id, "admin@test.it");

        mockMvc.perform(
                multipart("/api/listings/agent/create")
                        .with(authentication(auth))
                        .contentType(MediaType.MULTIPART_FORM_DATA)
                        .param("property", "{}")
                        .param("listing", "{}")
        ).andExpect(status().isForbidden());
    }

    @Test
    void createListing_isAllowedForAgent() throws Exception {
        UUID listingId = UUID.randomUUID();
        when(listingService.createListingWithProperty(any(UUID.class), any(), any()))
                .thenReturn(sampleListing(listingId));

        var auth = authToken(UserRole.AGENT, UUID.randomUUID(), "agent@test.it");

        mockMvc.perform(
                multipart("/api/listings/agent/create")
                        .with(authentication(auth))
                        .contentType(MediaType.MULTIPART_FORM_DATA)
                        .param("property", "{}")
                        .param("listing", "{}")
        )
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(listingId.toString()));
    }
}
