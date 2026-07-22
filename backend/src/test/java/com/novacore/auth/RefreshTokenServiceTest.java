package com.novacore.auth;

import com.novacore.security.jwt.JwtProperties;
import com.novacore.security.jwt.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(MockitoExtension.class)
class RefreshTokenServiceTest {

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    private RefreshTokenService refreshTokenService;
    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        JwtProperties properties = new JwtProperties();
        properties.setSecret("novacore-test-jwt-secret-key-change-me-32b");
        properties.setIssuer("novacore-test");
        properties.setAccessTokenExpiration(Duration.ofMinutes(15));
        properties.setRefreshTokenExpiration(Duration.ofDays(7));
        jwtService = new JwtService(properties);
        refreshTokenService = new RefreshTokenService(jwtService, refreshTokenRepository);
    }

    @Test
    void generateRefreshToken_returnsValidJwt() {
        UUID userId = UUID.randomUUID();

        String token = refreshTokenService.generateRefreshToken(userId, "alice");

        assertThat(jwtService.validateToken(token)).isTrue();
        assertThat(jwtService.parseClaims(token).isRefreshToken()).isTrue();
    }

    @Test
    void hashToken_isDeterministicAndDoesNotEqualPlainToken() {
        String plain = refreshTokenService.generateRefreshToken(UUID.randomUUID(), "bob");

        String hash1 = refreshTokenService.hashToken(plain);
        String hash2 = refreshTokenService.hashToken(plain);

        assertThat(hash1).isEqualTo(hash2);
        assertThat(hash1).isNotEqualTo(plain);
        assertThat(hash1).hasSize(64);
    }
}
