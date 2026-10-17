package com.novacore.auth;

import com.novacore.auth.dto.RefreshTokenRequest;
import com.novacore.auth.dto.RefreshTokenResponse;
import com.novacore.auth.exception.AuthenticationFailedException;
import com.novacore.auth.mapper.UserMapper;
import com.novacore.security.jwt.JwtClaims;
import com.novacore.security.jwt.JwtProperties;
import com.novacore.security.jwt.JwtService;
import com.novacore.users.RoleRepository;
import com.novacore.users.User;
import com.novacore.users.UserRepository;
import com.novacore.users.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthenticationServiceRefreshTest {

    private static final String GENERIC_FAILURE = "Invalid refresh token";

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordService passwordService;

    @Mock
    private UserMapper userMapper;

    @Mock
    private JwtService jwtService;

    @Mock
    private JwtProperties jwtProperties;

    @Mock
    private RefreshTokenService refreshTokenService;

    @Mock
    private AuthProperties authProperties;

    @Mock
    private EmailVerificationService emailVerificationService;

    @Mock
    private com.novacore.activity.ActivityLogService activityLogService;

    @InjectMocks
    private AuthenticationService authenticationService;

    private User user;
    private RefreshToken storedToken;
    private RefreshTokenRequest request;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(UUID.randomUUID());
        user.setUsername("alice");
        user.setEmail("alice@example.com");
        user.setPasswordHash("hash");
        user.setStatus(UserStatus.ACTIVE);

        storedToken = new RefreshToken();
        storedToken.setId(UUID.randomUUID());
        storedToken.setUser(user);
        storedToken.setTokenHash("existing-hash");
        storedToken.setExpiresAt(Instant.now().plus(Duration.ofDays(7)));
        storedToken.setRevoked(false);
        storedToken.setUserAgent("Mozilla/5.0 (Windows NT 10.0) Chrome/120.0");
        storedToken.setIpAddress("127.0.0.1");

        request = new RefreshTokenRequest();
        request.setRefreshToken("plain.refresh.token");
    }

    @Test
    void refresh_success_rotatesTokens() {
        JwtClaims claims = new JwtClaims(
                user.getId(),
                "alice",
                JwtClaims.TYPE_REFRESH,
                Instant.now(),
                Instant.now().plus(Duration.ofDays(7)),
                "novacore");

        when(jwtService.parseClaims("plain.refresh.token")).thenReturn(claims);
        when(refreshTokenService.findByPlainToken("plain.refresh.token")).thenReturn(Optional.of(storedToken));
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(jwtService.generateAccessToken(user.getId(), "alice")).thenReturn("new.access");
        when(refreshTokenService.generateRefreshToken(user.getId(), "alice")).thenReturn("new.refresh");
        when(jwtProperties.getAccessTokenExpiration()).thenReturn(Duration.ofMinutes(15));

        ClientDeviceInfo device = new ClientDeviceInfo("Mozilla/5.0", "10.0.0.1");
        AuthenticationService.RefreshResult result =
                authenticationService.refresh(request.getRefreshToken(), device);
        RefreshTokenResponse response = result.response();
        AuthSessionTokens tokens = result.tokens();

        assertThat(tokens.accessToken()).isEqualTo("new.access");
        assertThat(tokens.refreshToken()).isEqualTo("new.refresh");
        assertThat(response.getTokenType()).isEqualTo("Cookie");
        assertThat(response.getExpiresIn()).isEqualTo(900);

        verify(refreshTokenService).revoke(storedToken);
        verify(refreshTokenService).persistRefreshToken(user, "new.refresh", device);
    }

    @Test
    void refresh_accessTokenRejected() {
        JwtClaims claims = new JwtClaims(
                user.getId(),
                "alice",
                JwtClaims.TYPE_ACCESS,
                Instant.now(),
                Instant.now().plus(Duration.ofMinutes(15)),
                "novacore");

        when(jwtService.parseClaims("plain.refresh.token")).thenReturn(claims);

        assertThatThrownBy(() -> authenticationService.refresh(request.getRefreshToken(), ClientDeviceInfo.unknown()))
                .isInstanceOf(AuthenticationFailedException.class)
                .hasMessage(GENERIC_FAILURE);

        verify(refreshTokenService, never()).revoke(any());
        verify(refreshTokenService, never()).persistRefreshToken(any(), anyString(), any());
    }

    @Test
    void refresh_unknownTokenHash_throwsGenericFailure() {
        JwtClaims claims = new JwtClaims(
                user.getId(),
                "alice",
                JwtClaims.TYPE_REFRESH,
                Instant.now(),
                Instant.now().plus(Duration.ofDays(7)),
                "novacore");

        when(jwtService.parseClaims("plain.refresh.token")).thenReturn(claims);
        when(refreshTokenService.findByPlainToken("plain.refresh.token")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authenticationService.refresh(request.getRefreshToken(), ClientDeviceInfo.unknown()))
                .isInstanceOf(AuthenticationFailedException.class)
                .hasMessage(GENERIC_FAILURE);
    }

    @Test
    void refresh_revokedToken_throwsGenericFailure() {
        storedToken.setRevoked(true);
        JwtClaims claims = new JwtClaims(
                user.getId(),
                "alice",
                JwtClaims.TYPE_REFRESH,
                Instant.now(),
                Instant.now().plus(Duration.ofDays(7)),
                "novacore");

        when(jwtService.parseClaims("plain.refresh.token")).thenReturn(claims);
        when(refreshTokenService.findByPlainToken("plain.refresh.token")).thenReturn(Optional.of(storedToken));

        assertThatThrownBy(() -> authenticationService.refresh(request.getRefreshToken(), ClientDeviceInfo.unknown()))
                .isInstanceOf(AuthenticationFailedException.class)
                .hasMessage(GENERIC_FAILURE);

        verify(refreshTokenService, never()).persistRefreshToken(any(), anyString(), any());
    }

    @Test
    void refresh_expiredStoredToken_throwsGenericFailure() {
        storedToken.setExpiresAt(Instant.now().minus(Duration.ofHours(1)));
        JwtClaims claims = new JwtClaims(
                user.getId(),
                "alice",
                JwtClaims.TYPE_REFRESH,
                Instant.now().minus(Duration.ofDays(8)),
                Instant.now().minus(Duration.ofHours(1)),
                "novacore");

        when(jwtService.parseClaims("plain.refresh.token")).thenReturn(claims);
        when(refreshTokenService.findByPlainToken("plain.refresh.token")).thenReturn(Optional.of(storedToken));

        assertThatThrownBy(() -> authenticationService.refresh(request.getRefreshToken(), ClientDeviceInfo.unknown()))
                .isInstanceOf(AuthenticationFailedException.class)
                .hasMessage(GENERIC_FAILURE);
    }
}
