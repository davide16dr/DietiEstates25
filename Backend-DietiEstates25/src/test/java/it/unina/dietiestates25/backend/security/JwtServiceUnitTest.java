package it.unina.dietiestates25.backend.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Map;
import java.util.stream.Stream;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import io.jsonwebtoken.ExpiredJwtException;

class JwtServiceUnitTest {

    private static final String SECRET_32B = "TEST_SECRET_32_CHARS_MINIMUM_1234567890";

    static Stream<Arguments> generateTokenCases() {
        return Stream.of(
                Arguments.of(
                        "user@test.it",
                        Map.of("role", "CLIENT", "tenant", "demo")
                ),
                Arguments.of(
                        "user@test.it",
                        Map.of()
                )
        );
    }

    @ParameterizedTest
    @MethodSource("generateTokenCases")
    void generateToken_includesSubjectAndClaims(String subject, Map<String, Object> claims) {
        JwtService jwtService = new JwtService(SECRET_32B, 3_600_000L);

        String token = jwtService.generateToken(subject, claims);

        assertNotNull(token);
        assertEquals(subject, jwtService.extractUsername(token));

        Map<String, Object> extracted = jwtService.extractAllClaims(token);
        claims.forEach((k, v) -> assertEquals(v, extracted.get(k)));
    }

    static Stream<Arguments> isTokenValidBooleanCases() {
        return Stream.of(
                Arguments.of("user@test.it", "user@test.it", true),
                Arguments.of("user@test.it", "other@test.it", false)
        );
    }

    @ParameterizedTest
    @MethodSource("isTokenValidBooleanCases")
    void isTokenValid_whenTokenNotExpired_returnsExpected(String subject, String username, boolean expected) {
        JwtService jwtService = new JwtService(SECRET_32B, 60_000L);
        String token = jwtService.generateToken(subject, Map.of());

        if (expected) {
            assertTrue(jwtService.isTokenValid(token, username));
        } else {
            assertFalse(jwtService.isTokenValid(token, username));
        }
    }

    static Stream<Arguments> isTokenValidExceptionCases() {
        return Stream.of(
                Arguments.of(-1L, "user@test.it", "user@test.it", ExpiredJwtException.class),
                Arguments.of(60_000L, null, "someone@test.it", NullPointerException.class)
        );
    }

    @ParameterizedTest
    @MethodSource("isTokenValidExceptionCases")
    void isTokenValid_whenInvalid_throws(long expirationMs, String subject, String username,
            Class<? extends Throwable> expectedException) {
        JwtService jwtService = new JwtService(SECRET_32B, expirationMs);
        String token = jwtService.generateToken(subject, Map.of());

        assertNotNull(token);
        assertThrows(expectedException, () -> jwtService.isTokenValid(token, username));
    }
}
