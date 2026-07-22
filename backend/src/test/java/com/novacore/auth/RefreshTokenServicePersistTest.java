package com.novacore.auth;

import com.novacore.security.jwt.JwtProperties;
import com.novacore.security.jwt.JwtService;
import com.novacore.users.User;
import com.novacore.users.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RefreshTokenServicePersistTest {

    @Mock
    private JwtService jwtService;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @InjectMocks
    private RefreshTokenService refreshTokenService;

    private JwtService realJwtService;

    @BeforeEach
    void setUp() {
        JwtProperties properties = new JwtProperties();
        properties.setSecret("novacore-test-jwt-secret-key-change-me-32b");
        properties.setIssuer("novacore-test");
        properties.setAccessTokenExpiration(Duration.ofMinutes(15));
        properties.setRefreshTokenExpiration(Duration.ofDays(7));
        realJwtService = new JwtService(properties);
    }

    @Test
    void persistRefreshToken_storesSha256HashNotPlainToken() {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setUsername("alice");
        user.setEmail("alice@example.com");
        user.setPasswordHash("hash");
        user.setStatus(UserStatus.ACTIVE);

        String plain = realJwtService.generateRefreshToken(user.getId(), "alice");
        Instant expiresAt = realJwtService.extractExpiration(plain);

        when(jwtService.extractExpiration(plain)).thenReturn(expiresAt);
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Use service with real hashing but mocked jwt expiry + repo
        RefreshTokenService service = new RefreshTokenService(jwtService, refreshTokenRepository);
        RefreshToken saved = service.persistRefreshToken(user, plain);

        assertThat(saved.getTokenHash()).isEqualTo(service.hashToken(plain));
        assertThat(saved.getTokenHash()).isNotEqualTo(plain);
        assertThat(saved.getTokenHash()).hasSize(64);
        assertThat(saved.getExpiresAt()).isEqualTo(expiresAt);
        assertThat(saved.isRevoked()).isFalse();

        ArgumentCaptor<RefreshToken> captor = ArgumentCaptor.forClass(RefreshToken.class);
        verify(refreshTokenRepository).save(captor.capture());
        assertThat(captor.getValue().getTokenHash()).isNotEqualTo(plain);
    }

    @Test
    void generateAndHash_withRealJwtService() {
        RefreshTokenService service = new RefreshTokenService(realJwtService, refreshTokenRepository);
        String plain = service.generateRefreshToken(UUID.randomUUID(), "bob");
        assertThat(realJwtService.parseClaims(plain).isRefreshToken()).isTrue();
        assertThat(service.hashToken(plain)).hasSize(64);
    }
}
