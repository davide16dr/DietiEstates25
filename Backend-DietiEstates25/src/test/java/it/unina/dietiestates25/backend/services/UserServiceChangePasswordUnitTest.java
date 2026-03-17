package it.unina.dietiestates25.backend.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;
import java.util.stream.Stream;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import it.unina.dietiestates25.backend.dto.ChangePasswordRequest;
import it.unina.dietiestates25.backend.entities.User;
import it.unina.dietiestates25.backend.repositories.AgencyMembershipRepository;
import it.unina.dietiestates25.backend.repositories.AgencyRepository;
import it.unina.dietiestates25.backend.repositories.UserRepository;

@ExtendWith(MockitoExtension.class)
class UserServiceChangePasswordUnitTest {

    @Mock
    UserRepository userRepository;

    @Mock
    PasswordEncoder passwordEncoder;

    @Mock
    AgencyMembershipRepository agencyMembershipRepository;

    @Mock
    AgencyRepository agencyRepository;

    @InjectMocks
    UserService userService;

    @Test
    void changePassword_whenUserMissing_throws() {
        UUID userId = UUID.randomUUID();
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        ChangePasswordRequest req = new ChangePasswordRequest("old", "newPassword123");

        RuntimeException ex = assertThrows(RuntimeException.class, () -> userService.changePassword(userId, req));
        assertEquals("Utente non trovato", ex.getMessage());
        verify(userRepository, never()).save(any());
    }

    static Stream<Arguments> changePasswordInvalidCases() {
        return Stream.of(
                Arguments.of(
                        "wrong-old",
                        "newPassword123",
                        false,
                        "La password attuale non è corretta"
                ),
                Arguments.of(
                        "old",
                        null,
                        true,
                        "La nuova password deve contenere almeno 8 caratteri"
                ),
                Arguments.of(
                        "old",
                        "short",
                        true,
                        "La nuova password deve contenere almeno 8 caratteri"
                )
        );
    }

    @ParameterizedTest
    @MethodSource("changePasswordInvalidCases")
    void changePassword_whenInvalid_throws(String oldPassword, String newPassword, boolean oldMatches, String expectedMessage) {
        UUID userId = UUID.randomUUID();

        User u = new User();
        u.setId(userId);
        u.setPasswordHash("stored-hash");

        when(userRepository.findById(userId)).thenReturn(Optional.of(u));
        when(passwordEncoder.matches(oldPassword, "stored-hash")).thenReturn(oldMatches);

        ChangePasswordRequest req = new ChangePasswordRequest(oldPassword, newPassword);

        RuntimeException ex = assertThrows(RuntimeException.class, () -> userService.changePassword(userId, req));
        assertEquals(expectedMessage, ex.getMessage());
        verify(passwordEncoder, never()).encode(any());
        verify(userRepository, never()).save(any());
    }

    static Stream<Arguments> changePasswordSuccessCases() {
        return Stream.of(
                Arguments.of("old", "newPassword123", "stored-hash", "new-hash")
        );
    }

    @ParameterizedTest
    @MethodSource("changePasswordSuccessCases")
    void changePassword_happyPath_updatesHashAndSaves(
            String oldPassword,
            String newPassword,
            String storedHash,
            String newHash
    ) {
        UUID userId = UUID.randomUUID();

        User u = new User();
        u.setId(userId);
        u.setPasswordHash(storedHash);

        when(userRepository.findById(userId)).thenReturn(Optional.of(u));
        when(passwordEncoder.matches(oldPassword, storedHash)).thenReturn(true);
        when(passwordEncoder.encode(newPassword)).thenReturn(newHash);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        ChangePasswordRequest req = new ChangePasswordRequest(oldPassword, newPassword);

        userService.changePassword(userId, req);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());

        User saved = captor.getValue();
        assertEquals(newHash, saved.getPasswordHash());
    }
}
