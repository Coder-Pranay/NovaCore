package com.novacore.security.jwt;

import com.novacore.auth.exception.ExpiredTokenException;
import com.novacore.auth.exception.InvalidTokenException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    private JwtService jwtService;
    private JwtProperties properties;

    @BeforeEach
    void setUp() {
        properties = new JwtProperties();
        properties.setSecret("novacore-test-jwt-secret-key-change-me-32b");
        properties.setIssuer("novacore-test");
        properties.setAccessTokenExpiration(Duration.ofMinutes(15));
        properties.setRefreshTokenExpiration(Duration.ofDays(7));
        jwtService = new JwtService(properties);
    }

    @Test
    void generateAccessToken_containsExpectedClaims() {
        UUID userId = UUID.randomUUID();

        String token = jwtService.generateAccessToken(userId, "alice");

        JwtClaims claims = jwtService.parseClaims(token);
        assertThat(claims.userId()).isEqualTo(userId);
        assertThat(claims.username()).isEqualTo("alice");
        assertThat(claims.isAccessToken()).isTrue();
        assertThat(claims.issuer()).isEqualTo("novacore-test");
        assertThat(claims.expiresAt()).isAfter(Instant.now());
    }

    @Test
    void generateRefreshToken_hasRefreshTypeAndLongerLifetimeToLive() {
        UUID userId = UUID.randomUUID();

        String accessToken = jwtService.generateAccessToken(userId, "bob");
        String refreshToken = jwtService.generateRefreshToken(userId, "bob");

        Instant accessExp = jwtService.extractExpiration(accessToken);
        Instant refreshExp = jwtService.extractExpiration(refreshToken);

        assertThat(jwtService.parseClaims(refreshToken).isRefreshToken()).isTrue();
        assertThat(refreshExp).isAfter(accessExp);
    }

    @Test
    void validateToken_returnsTrueForValidToken() {
        String token = jwtService.generateAccessToken(UUID.randomUUID(), "carol");

        assertThat(jwtService.validateToken(token)).isTrue();
        assertThat(jwtService.extractUsername(token)).isEqualTo("carol");
        assertThat(jwtService.extractUserId(token)).isNotNull();
        assertThat(jwtService.isExpired(token)).isFalse();
    }

    @Test
    void validateToken_rejectsTamperedToken() {
        String token = jwtService.generateAccessToken(UUID.randomUUID(), "dave");
        String tampered = token.substring(0, token.length() - 4) + "xxxx";

        assertThatThrownBy(() -> jwtService.validateToken(tampered))
                .isInstanceOf(InvalidTokenException.class);
    }

    @Test
    void isExpired_detectsExpiredToken() {
        properties.setAccessTokenExpiration(Duration.ofMillis(1));
        jwtService = new JwtService(properties);

        String token = jwtService.generateAccessToken(UUID.randomUUID(), "erin");
        sleepBriefly();

        assertThat(jwtService.isExpired(token)).isTrue();
        assertThatThrownBy(() -> jwtService.parseClaims(token))
                .isInstanceOf(ExpiredTokenException.class);
    }

    private static void sleepBriefly() {
        try {
            Thread.sleep(20);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
        }
    }
}
