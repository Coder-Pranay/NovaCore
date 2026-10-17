package com.novacore.auth;

import com.novacore.auth.dto.LogoutRequest;
import com.novacore.auth.exception.AuthenticationFailedException;
import com.novacore.auth.mapper.UserMapper;
import com.novacore.security.jwt.JwtClaims;
import com.novacore.security.jwt.JwtException;
import com.novacore.security.jwt.JwtProperties;
import com.novacore.security.jwt.JwtService;
import com.novacore.security.service.AuthenticatedUser;
import com.novacore.users.RoleRepository;
import com.novacore.users.User;
import com.novacore.users.UserRepository;
import com.novacore.users.UserStatus;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthenticationServiceLogoutTest {

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
    private LogoutRequest request;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();

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

        request = new LogoutRequest();
        request.setRefreshToken("plain.refresh.token");

        authenticateAs(user.getId(), "alice");
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void logout_success_revokesActiveToken() {
        JwtClaims claims = refreshClaimsFor(user.getId());

        when(jwtService.parseClaims("plain.refresh.token")).thenReturn(claims);
        when(refreshTokenService.findByPlainToken("plain.refresh.token")).thenReturn(Optional.of(storedToken));

        assertThatCode(() -> authenticationService.logout(request.getRefreshToken())).doesNotThrowAnyException();

        verify(refreshTokenService).revoke(storedToken);
    }

    @Test
    void logout_alreadyRevokedToken_succeedsWithoutRevokingAgain() {
        storedToken.setRevoked(true);
        JwtClaims claims = refreshClaimsFor(user.getId());

        when(jwtService.parseClaims("plain.refresh.token")).thenReturn(claims);
        when(refreshTokenService.findByPlainToken("plain.refresh.token")).thenReturn(Optional.of(storedToken));

        assertThatCode(() -> authenticationService.logout(request.getRefreshToken())).doesNotThrowAnyException();

        verify(refreshTokenService, never()).revoke(any());
    }

    @Test
    void logout_unknownToken_succeedsSilently() {
        JwtClaims claims = refreshClaimsFor(user.getId());

        when(jwtService.parseClaims("plain.refresh.token")).thenReturn(claims);
        when(refreshTokenService.findByPlainToken("plain.refresh.token")).thenReturn(Optional.empty());

        assertThatCode(() -> authenticationService.logout(request.getRefreshToken())).doesNotThrowAnyException();

        verify(refreshTokenService, never()).revoke(any());
    }

    @Test
    void logout_expiredJwt_succeedsSilently() {
        when(jwtService.parseClaims("plain.refresh.token"))
                .thenThrow(new JwtException("Token expired", new RuntimeException("expired")));

        assertThatCode(() -> authenticationService.logout(request.getRefreshToken())).doesNotThrowAnyException();

        verify(refreshTokenService, never()).findByPlainToken(any());
        verify(refreshTokenService, never()).revoke(any());
    }

    @Test
    void logout_idempotent_secondCallStillSucceeds() {
        JwtClaims claims = refreshClaimsFor(user.getId());

        when(jwtService.parseClaims("plain.refresh.token")).thenReturn(claims);
        when(refreshTokenService.findByPlainToken("plain.refresh.token")).thenReturn(Optional.of(storedToken));

        authenticationService.logout(request.getRefreshToken());
        storedToken.setRevoked(true);
        authenticationService.logout(request.getRefreshToken());

        verify(refreshTokenService, times(1)).revoke(storedToken);
    }

    @Test
    void logout_accessTokenType_doesNotRevoke() {
        JwtClaims claims = new JwtClaims(
                user.getId(),
                "alice",
                JwtClaims.TYPE_ACCESS,
                Instant.now(),
                Instant.now().plus(Duration.ofMinutes(15)),
                "novacore");

        when(jwtService.parseClaims("plain.refresh.token")).thenReturn(claims);

        assertThatCode(() -> authenticationService.logout(request.getRefreshToken())).doesNotThrowAnyException();

        verify(refreshTokenService, never()).findByPlainToken(any());
        verify(refreshTokenService, never()).revoke(any());
    }

    @Test
    void logout_tokenOwnedByAnotherUser_doesNotRevoke() {
        UUID otherUserId = UUID.randomUUID();
        JwtClaims claims = refreshClaimsFor(otherUserId);

        when(jwtService.parseClaims("plain.refresh.token")).thenReturn(claims);

        assertThatCode(() -> authenticationService.logout(request.getRefreshToken())).doesNotThrowAnyException();

        verify(refreshTokenService, never()).findByPlainToken(any());
        verify(refreshTokenService, never()).revoke(any());
    }

    @Test
    void logout_withoutAuthentication_stillRevokesUsingRefreshClaims() {
        SecurityContextHolder.clearContext();
        JwtClaims claims = refreshClaimsFor(user.getId());

        when(jwtService.parseClaims("plain.refresh.token")).thenReturn(claims);
        when(refreshTokenService.findByPlainToken("plain.refresh.token")).thenReturn(Optional.of(storedToken));

        assertThatCode(() -> authenticationService.logout(request.getRefreshToken()))
                .doesNotThrowAnyException();

        verify(refreshTokenService).revoke(storedToken);
    }

    private JwtClaims refreshClaimsFor(UUID userId) {
        return new JwtClaims(
                userId,
                "alice",
                JwtClaims.TYPE_REFRESH,
                Instant.now(),
                Instant.now().plus(Duration.ofDays(7)),
                "novacore");
    }

    private void authenticateAs(UUID userId, String username) {
        AuthenticatedUser principal = new AuthenticatedUser(userId, username);
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                principal,
                null,
                List.of());
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }
}
