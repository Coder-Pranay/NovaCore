package com.novacore.auth;

import com.novacore.auth.dto.LoginRequest;
import com.novacore.auth.dto.LoginResponse;
import com.novacore.auth.dto.LogoutRequest;
import com.novacore.auth.dto.RefreshTokenRequest;
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
import java.util.UUID;

/**
 * Authentication business operations.
 */
@Service
public class AuthenticationService {

    private static final String GENERIC_AUTH_FAILURE = "Invalid credentials";
    private static final String GENERIC_REFRESH_FAILURE = "Invalid refresh token";
    private static final String TOKEN_TYPE_BEARER = "Bearer";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordService passwordService;
    private final UserMapper userMapper;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;
    private final RefreshTokenService refreshTokenService;

    public AuthenticationService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordService passwordService,
            UserMapper userMapper,
            JwtService jwtService,
            JwtProperties jwtProperties,
            RefreshTokenService refreshTokenService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordService = passwordService;
        this.userMapper = userMapper;
        this.jwtService = jwtService;
        this.jwtProperties = jwtProperties;
        this.refreshTokenService = refreshTokenService;
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
        user.getRoles().add(defaultRole);

        User saved = userRepository.save(user);
        return userMapper.toRegisterResponse(saved);
    }

    @Transactional
    public LoginResponse authenticate(LoginRequest request) {
        String login = request.getEmailOrUsername().trim();

        User user = userRepository.findByEmailOrUsernameWithRoles(login)
                .orElseThrow(() -> new AuthenticationFailedException(GENERIC_AUTH_FAILURE));

        ensureAccountActive(user);

        if (!passwordService.matches(request.getPassword(), user.getPasswordHash())) {
            throw new AuthenticationFailedException(GENERIC_AUTH_FAILURE);
        }

        String accessToken = jwtService.generateAccessToken(user.getId(), user.getUsername());
        String refreshToken = refreshTokenService.generateRefreshToken(user.getId(), user.getUsername());
        refreshTokenService.persistRefreshToken(user, refreshToken);

        LoginResponse response = new LoginResponse();
        response.setAccessToken(accessToken);
        response.setRefreshToken(refreshToken);
        response.setTokenType(TOKEN_TYPE_BEARER);
        response.setExpiresIn(jwtProperties.getAccessTokenExpiration().toSeconds());
        response.setUser(userMapper.toAuthenticatedUserResponse(user));
        return response;
    }

    @Transactional
    public RefreshTokenResponse refresh(RefreshTokenRequest request) {
        String plainRefreshToken = request.getRefreshToken().trim();

        JwtClaims claims = parseRefreshClaims(plainRefreshToken);

        RefreshToken storedToken = refreshTokenService.findByPlainToken(plainRefreshToken)
                .orElseThrow(() -> new AuthenticationFailedException(GENERIC_REFRESH_FAILURE));

        if (storedToken.isRevoked() || storedToken.getExpiresAt().isBefore(Instant.now())) {
            throw new AuthenticationFailedException(GENERIC_REFRESH_FAILURE);
        }

        User user = userRepository.findById(claims.userId())
                .orElseThrow(() -> new AuthenticationFailedException(GENERIC_REFRESH_FAILURE));

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new AuthenticationFailedException(GENERIC_REFRESH_FAILURE);
        }

        refreshTokenService.revoke(storedToken);

        String newAccessToken = jwtService.generateAccessToken(user.getId(), user.getUsername());
        String newRefreshToken = refreshTokenService.generateRefreshToken(user.getId(), user.getUsername());
        refreshTokenService.persistRefreshToken(user, newRefreshToken);

        RefreshTokenResponse response = new RefreshTokenResponse();
        response.setAccessToken(newAccessToken);
        response.setRefreshToken(newRefreshToken);
        response.setTokenType(TOKEN_TYPE_BEARER);
        response.setExpiresIn(jwtProperties.getAccessTokenExpiration().toSeconds());
        return response;
    }

    /**
     * Idempotent logout: revokes the refresh token when valid and owned by the caller.
     * Always completes without revealing token existence or validity.
     */
    @Transactional
    public void logout(LogoutRequest request) {
        UUID userId = requireAuthenticatedUserId();
        revokeRefreshTokenSilently(userId, request.getRefreshToken().trim());
    }

    public void verifyPassword(String rawPassword, String passwordHash) {
        if (!passwordService.matches(rawPassword, passwordHash)) {
            throw new AuthenticationFailedException(GENERIC_AUTH_FAILURE);
        }
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

    private UUID requireAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser authenticatedUser)) {
            throw new AuthenticationFailedException("Unauthorized");
        }
        return authenticatedUser.userId();
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
}
