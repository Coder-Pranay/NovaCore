package com.novacore.auth;

import com.novacore.activity.ActionType;
import com.novacore.activity.ActivityLogService;
import com.novacore.activity.EntityType;
import com.novacore.auth.dto.ChangePasswordRequest;
import com.novacore.auth.dto.LoginRequest;
import com.novacore.auth.dto.LoginResponse;
import com.novacore.auth.dto.RefreshTokenResponse;
import com.novacore.auth.dto.RegisterRequest;
import com.novacore.auth.dto.RegisterResponse;
import com.novacore.auth.exception.AccountStatusException;
import com.novacore.auth.exception.AuthenticationFailedException;
import com.novacore.auth.mapper.UserMapper;
import com.novacore.common.exception.ConflictException;
import com.novacore.security.jwt.JwtClaims;
import com.novacore.security.jwt.JwtException;
import com.novacore.security.jwt.JwtProperties;
import com.novacore.security.jwt.JwtService;
import com.novacore.security.service.AuthenticatedUser;
import com.novacore.users.Role;
import com.novacore.users.RoleNames;
import com.novacore.users.RoleRepository;
import com.novacore.users.User;
import com.novacore.users.UserRepository;
import com.novacore.users.UserStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Authentication business operations. JWTs are issued for HttpOnly cookies — never for localStorage.
 */
@Service
public class AuthenticationService {

    private static final String GENERIC_AUTH_FAILURE = "Invalid credentials";
    private static final String GENERIC_REFRESH_FAILURE = "Invalid refresh token";
    private static final String TOKEN_TYPE_COOKIE = "Cookie";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordService passwordService;
    private final UserMapper userMapper;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;
    private final RefreshTokenService refreshTokenService;
    private final AuthProperties authProperties;
    private final EmailVerificationService emailVerificationService;
    private final ActivityLogService activityLogService;

    public AuthenticationService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordService passwordService,
            UserMapper userMapper,
            JwtService jwtService,
            JwtProperties jwtProperties,
            RefreshTokenService refreshTokenService,
            AuthProperties authProperties,
            EmailVerificationService emailVerificationService,
            ActivityLogService activityLogService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordService = passwordService;
        this.userMapper = userMapper;
        this.jwtService = jwtService;
        this.jwtProperties = jwtProperties;
        this.refreshTokenService = refreshTokenService;
        this.authProperties = authProperties;
        this.emailVerificationService = emailVerificationService;
        this.activityLogService = activityLogService;
    }

    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        String username = request.getUsername().trim();

        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("Email already registered");
        }
        if (userRepository.existsByUsername(username)) {
            throw new ConflictException("Username already taken");
        }

        Role defaultRole = roleRepository.findByName(RoleNames.USER)
                .orElseThrow(() -> new IllegalStateException("Default USER role is not configured"));

        User user = userMapper.toEntity(request);
        user.setPasswordHash(passwordService.hashPassword(request.getPassword()));
        user.setEmailVerified(false);
        user.getRoles().add(defaultRole);

        User saved = userRepository.save(user);
        emailVerificationService.sendVerificationEmail(saved);
        return userMapper.toRegisterResponse(saved);
    }

    @Transactional
    public LoginResult authenticate(LoginRequest request, ClientDeviceInfo deviceInfo) {
        String login = request.getEmailOrUsername().trim();

        User user = userRepository.findByEmailOrUsernameWithRoles(login)
                .orElseThrow(() -> new AuthenticationFailedException(GENERIC_AUTH_FAILURE));

        ensureAccountActive(user);
        ensureEmailVerifiedIfRequired(user);

        if (!passwordService.matches(request.getPassword(), user.getPasswordHash())) {
            throw new AuthenticationFailedException(GENERIC_AUTH_FAILURE);
        }

        String accessToken = jwtService.generateAccessToken(user.getId(), user.getUsername());
        String refreshToken = refreshTokenService.generateRefreshToken(user.getId(), user.getUsername());
        refreshTokenService.persistRefreshToken(user, refreshToken, deviceInfo);

        LoginResponse response = new LoginResponse();
        response.setTokenType(TOKEN_TYPE_COOKIE);
        response.setExpiresIn(jwtProperties.getAccessTokenExpiration().toSeconds());
        response.setUser(userMapper.toAuthenticatedUserResponse(user));

        return new LoginResult(
                response,
                new AuthSessionTokens(
                        accessToken,
                        refreshToken,
                        jwtProperties.getAccessTokenExpiration().toSeconds()));
    }

    @Transactional
    public RefreshResult refresh(String plainRefreshToken, ClientDeviceInfo deviceInfo) {
        if (plainRefreshToken == null || plainRefreshToken.isBlank()) {
            throw new AuthenticationFailedException(GENERIC_REFRESH_FAILURE);
        }

        String trimmed = plainRefreshToken.trim();
        JwtClaims claims = parseRefreshClaims(trimmed);

        RefreshToken storedToken = refreshTokenService.findByPlainToken(trimmed)
                .orElseThrow(() -> new AuthenticationFailedException(GENERIC_REFRESH_FAILURE));

        if (storedToken.isRevoked() || storedToken.getExpiresAt().isBefore(Instant.now())) {
            throw new AuthenticationFailedException(GENERIC_REFRESH_FAILURE);
        }

        User user = userRepository.findById(claims.userId())
                .orElseThrow(() -> new AuthenticationFailedException(GENERIC_REFRESH_FAILURE));

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new AuthenticationFailedException(GENERIC_REFRESH_FAILURE);
        }

        ClientDeviceInfo nextDevice = deviceInfo;
        if (nextDevice == null || "Unknown".equals(nextDevice.userAgent())) {
            nextDevice = new ClientDeviceInfo(
                    storedToken.getUserAgent() != null ? storedToken.getUserAgent() : "Unknown",
                    storedToken.getIpAddress() != null ? storedToken.getIpAddress() : "unknown");
        }

        refreshTokenService.revoke(storedToken);

        String newAccessToken = jwtService.generateAccessToken(user.getId(), user.getUsername());
        String newRefreshToken = refreshTokenService.generateRefreshToken(user.getId(), user.getUsername());
        refreshTokenService.persistRefreshToken(user, newRefreshToken, nextDevice);

        RefreshTokenResponse response = new RefreshTokenResponse();
        response.setTokenType(TOKEN_TYPE_COOKIE);
        response.setExpiresIn(jwtProperties.getAccessTokenExpiration().toSeconds());

        return new RefreshResult(
                response,
                new AuthSessionTokens(
                        newAccessToken,
                        newRefreshToken,
                        jwtProperties.getAccessTokenExpiration().toSeconds()));
    }

    /**
     * Idempotent logout: revokes the refresh token when valid.
     * Prefer cookie-sourced refresh tokens; always completes without revealing validity.
     */
    @Transactional
    public void logout(String plainRefreshToken) {
        UUID userId = resolveUserIdForLogout(plainRefreshToken);
        if (userId == null || plainRefreshToken == null || plainRefreshToken.isBlank()) {
            return;
        }
        revokeRefreshTokenSilently(userId, plainRefreshToken.trim());
    }

    @Transactional
    public void changePassword(ChangePasswordRequest request, String currentPlainRefreshToken) {
        UUID userId = requireAuthenticatedUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AuthenticationFailedException("Unauthorized"));

        if (!passwordService.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new AuthenticationFailedException("Current password is incorrect");
        }

        PasswordPolicy.validate(request.getNewPassword());
        if (passwordService.matches(request.getNewPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("New password must be different from current password");
        }

        user.setPasswordHash(passwordService.hashPassword(request.getNewPassword()));
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);

        if (currentPlainRefreshToken != null && !currentPlainRefreshToken.isBlank()) {
            String keepHash = refreshTokenService.hashToken(currentPlainRefreshToken.trim());
            refreshTokenService.revokeAllForUserExcept(userId, keepHash);
        } else {
            refreshTokenService.revokeAllForUser(userId);
        }

        activityLogService.logActivity(
                userId,
                EntityType.AUTH,
                userId,
                ActionType.PASSWORD_CHANGED,
                "Password changed",
                "Password was changed from account settings",
                Map.of("source", "settings"));
    }

    public void verifyPassword(String rawPassword, String passwordHash) {
        if (!passwordService.matches(rawPassword, passwordHash)) {
            throw new AuthenticationFailedException(GENERIC_AUTH_FAILURE);
        }
    }

    public DurationHolder tokenDurations() {
        return new DurationHolder(
                jwtProperties.getAccessTokenExpiration(),
                jwtProperties.getRefreshTokenExpiration());
    }

    private UUID requireAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof AuthenticatedUser authenticatedUser) {
            return authenticatedUser.userId();
        }
        throw new AuthenticationFailedException("Unauthorized");
    }

    private UUID resolveUserIdForLogout(String plainRefreshToken) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof AuthenticatedUser authenticatedUser) {
            return authenticatedUser.userId();
        }
        if (plainRefreshToken == null || plainRefreshToken.isBlank()) {
            return null;
        }
        try {
            JwtClaims claims = jwtService.parseClaims(plainRefreshToken.trim());
            if (claims.isRefreshToken()) {
                return claims.userId();
            }
        } catch (JwtException ignored) {
            // Idempotent logout
        }
        return null;
    }

    private JwtClaims parseRefreshClaims(String plainRefreshToken) {
        try {
            JwtClaims claims = jwtService.parseClaims(plainRefreshToken);
            if (!claims.isRefreshToken()) {
                throw new AuthenticationFailedException(GENERIC_REFRESH_FAILURE);
            }
            return claims;
        } catch (JwtException ex) {
            throw new AuthenticationFailedException(GENERIC_REFRESH_FAILURE, ex);
        }
    }

    private void ensureAccountActive(User user) {
        if (user.getStatus() == UserStatus.ACTIVE) {
            return;
        }
        if (user.getStatus() == UserStatus.LOCKED) {
            throw new AccountStatusException("Account is locked");
        }
        throw new AccountStatusException("Account is inactive");
    }

    private void ensureEmailVerifiedIfRequired(User user) {
        if (authProperties.isRequireEmailVerification() && !user.isEmailVerified()) {
            throw new AccountStatusException("Email verification required");
        }
    }

    private void revokeRefreshTokenSilently(UUID userId, String plainRefreshToken) {
        if (plainRefreshToken.isBlank()) {
            return;
        }

        try {
            JwtClaims claims = jwtService.parseClaims(plainRefreshToken);
            if (!claims.isRefreshToken() || !claims.userId().equals(userId)) {
                return;
            }

            refreshTokenService.findByPlainToken(plainRefreshToken)
                    .filter(token -> token.getUser().getId().equals(userId))
                    .filter(token -> !token.isRevoked())
                    .ifPresent(refreshTokenService::revoke);
        } catch (JwtException ignored) {
            // Idempotent logout — do not reveal token validity.
        }
    }

    public record LoginResult(LoginResponse response, AuthSessionTokens tokens) {
    }

    public record RefreshResult(RefreshTokenResponse response, AuthSessionTokens tokens) {
    }

    public record DurationHolder(java.time.Duration access, java.time.Duration refresh) {
    }
}
