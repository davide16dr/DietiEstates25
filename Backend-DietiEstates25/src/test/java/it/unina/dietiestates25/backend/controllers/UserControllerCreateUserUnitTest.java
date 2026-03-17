package it.unina.dietiestates25.backend.controllers;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Stream;

import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import it.unina.dietiestates25.backend.entities.Agency;
import it.unina.dietiestates25.backend.entities.User;
import it.unina.dietiestates25.backend.entities.enums.UserRole;
import it.unina.dietiestates25.backend.repositories.AgencyRepository;
import it.unina.dietiestates25.backend.repositories.ListingRepository;
import it.unina.dietiestates25.backend.repositories.UserRepository;
import it.unina.dietiestates25.backend.services.EmailService;
import it.unina.dietiestates25.backend.services.UserService;

@ExtendWith(MockitoExtension.class)
class UserControllerCreateUserUnitTest {

    @Mock
    UserService userService;

    @Mock
    UserRepository userRepository;

    @Mock
    ListingRepository listingRepository;

    @Mock
    AgencyRepository agencyRepository;

    @Mock
    EmailService emailService;

    @Mock
    Authentication authentication;

    @InjectMocks
    UserController userController;

    static Stream<Arguments> createAgentCases() {
        return Stream.of(
                Arguments.of("Mario Rossi", "agent1@test.it", "+393331234567", "attivo", true, "Mario", "Rossi"),
                Arguments.of("Mario", "agent2@test.it", "+393331234568", "inattivo", false, "Mario", "")
        );
    }

    @ParameterizedTest
    @MethodSource("createAgentCases")
    void createUser_whenRoleAgent_createsUserAndSendsAgentEmail(
            String fullName,
            String newUserEmail,
            String phone,
            String status,
            boolean expectedActive,
            String expectedFirstName,
            String expectedLastName
    ) {
        UUID agencyId = UUID.randomUUID();
        String creatorEmail = "manager@test.it";

        User currentUser = new User();
        currentUser.setId(UUID.randomUUID());
        currentUser.setEmail(creatorEmail);
        currentUser.setFirstName("Manager");
        currentUser.setLastName("One");
        currentUser.setRole(UserRole.AGENCY_MANAGER);
        currentUser.setAgencyId(agencyId);

        Agency agency = new Agency();
        agency.setId(agencyId);
        agency.setName("Agenzia Demo");

        when(authentication.getName()).thenReturn(creatorEmail);
        when(userRepository.findByEmail(creatorEmail)).thenReturn(Optional.of(currentUser));
        when(agencyRepository.findById(agencyId)).thenReturn(Optional.of(agency));
        when(userRepository.findByEmail(newUserEmail)).thenReturn(Optional.empty());

        when(userService.createUserWithPassword(any(User.class), anyString()))
                .thenAnswer(inv -> {
                    User u = inv.getArgument(0);
                    if (u.getId() == null) {
                        u.setId(UUID.randomUUID());
                    }
                    return u;
                });

        Map<String, Object> userData = new HashMap<>();
        userData.put("name", fullName);
        userData.put("email", newUserEmail);
        userData.put("phone", phone);
        userData.put("status", status);
        userData.put("role", "AGENT");

        ResponseEntity<User> response = userController.createUser(userData, authentication);

        assertEquals(201, response.getStatusCodeValue());
        assertNotNull(response.getBody());
        assertEquals(newUserEmail, response.getBody().getEmail());

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        ArgumentCaptor<String> passwordCaptor = ArgumentCaptor.forClass(String.class);
        verify(userService).createUserWithPassword(userCaptor.capture(), passwordCaptor.capture());

        User created = userCaptor.getValue();
        String temporaryPassword = passwordCaptor.getValue();

        assertEquals(newUserEmail, created.getEmail());
        assertEquals(expectedFirstName, created.getFirstName());
        assertEquals(expectedLastName, created.getLastName());
        assertEquals(phone, created.getPhoneE164());
        assertEquals(UserRole.AGENT, created.getRole());
        assertEquals(agencyId, created.getAgencyId());
        assertEquals(expectedActive, created.isActive());

        verify(emailService).sendAgentCreationConfirmation(
                eq(newUserEmail),
                eq("Agenzia Demo"),
                eq(expectedFirstName),
                eq(expectedLastName),
                eq(temporaryPassword),
                eq("Manager One")
        );
        verify(emailService, never()).sendManagerCreationConfirmation(anyString(), anyString(), anyString(), anyString(), anyString(), anyString());
    }

    static Stream<Arguments> createManagerCases() {
        return Stream.of(
                Arguments.of("Giulia Bianchi", "manager2@test.it", "+393331234569", "attivo", true, "Giulia", "Bianchi")
        );
    }

    @ParameterizedTest
    @MethodSource("createManagerCases")
    void createUser_whenRoleManager_createsUserAndSendsManagerEmail(
            String fullName,
            String newUserEmail,
            String phone,
            String status,
            boolean expectedActive,
            String expectedFirstName,
            String expectedLastName
    ) {
        UUID agencyId = UUID.randomUUID();
        String creatorEmail = "admin@test.it";

        User currentUser = new User();
        currentUser.setId(UUID.randomUUID());
        currentUser.setEmail(creatorEmail);
        currentUser.setFirstName("Admin");
        currentUser.setLastName("Root");
        currentUser.setRole(UserRole.ADMIN);
        currentUser.setAgencyId(agencyId);

        Agency agency = new Agency();
        agency.setId(agencyId);
        agency.setName("Agenzia Demo");

        when(authentication.getName()).thenReturn(creatorEmail);
        when(userRepository.findByEmail(creatorEmail)).thenReturn(Optional.of(currentUser));
        when(agencyRepository.findById(agencyId)).thenReturn(Optional.of(agency));
        when(userRepository.findByEmail(newUserEmail)).thenReturn(Optional.empty());

        when(userService.createUserWithPassword(any(User.class), anyString()))
                .thenAnswer(inv -> {
                    User u = inv.getArgument(0);
                    if (u.getId() == null) {
                        u.setId(UUID.randomUUID());
                    }
                    return u;
                });

        Map<String, Object> userData = new HashMap<>();
        userData.put("name", fullName);
        userData.put("email", newUserEmail);
        userData.put("phone", phone);
        userData.put("status", status);
        userData.put("role", "AGENCY_MANAGER");

        ResponseEntity<User> response = userController.createUser(userData, authentication);

        assertEquals(201, response.getStatusCodeValue());
        assertNotNull(response.getBody());
        assertEquals(newUserEmail, response.getBody().getEmail());

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        ArgumentCaptor<String> passwordCaptor = ArgumentCaptor.forClass(String.class);
        verify(userService).createUserWithPassword(userCaptor.capture(), passwordCaptor.capture());

        User created = userCaptor.getValue();
        String temporaryPassword = passwordCaptor.getValue();

        assertEquals(newUserEmail, created.getEmail());
        assertEquals(expectedFirstName, created.getFirstName());
        assertEquals(expectedLastName, created.getLastName());
        assertEquals(phone, created.getPhoneE164());
        assertEquals(UserRole.AGENCY_MANAGER, created.getRole());
        assertEquals(agencyId, created.getAgencyId());
        assertEquals(expectedActive, created.isActive());

        verify(emailService).sendManagerCreationConfirmation(
                eq(newUserEmail),
                eq("Agenzia Demo"),
                eq(expectedFirstName),
                eq(expectedLastName),
                eq(temporaryPassword),
                eq("Admin Root")
        );
        verify(emailService, never()).sendAgentCreationConfirmation(anyString(), anyString(), anyString(), anyString(), anyString(), anyString());
    }
}
