package com.novacore.auth;

import com.novacore.security.jwt.JwtService;
import com.novacore.users.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Refresh-token generation, hashing, and persistence.
 * Plain refresh tokens are never stored — only SHA-256 hashes.
 */
@Service
public class RefreshTokenService {

    private final JwtService jwtService;
    private final RefreshTokenRepository refreshTokenRepository;

    public RefreshTokenService(JwtService jwtService, RefreshTokenRepository refreshTokenRepository) {
        this.jwtService = jwtService;
        this.refreshTokenRepository = refreshTokenRepository;
    }

    public String generateRefreshToken(UUID userId, String username) {
        return jwtService.generateRefreshToken(userId, username);
    }

    public String hashToken(String plainToken) {
        if (plainToken == null || plainToken.isBlank()) {
            throw new IllegalArgumentException("Token must not be blank");
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(plainToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashed);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 algorithm is not available", ex);
        }
    }

    public Optional<RefreshToken> findByPlainToken(String plainToken) {
        return refreshTokenRepository.findByTokenHash(hashToken(plainToken));
    }

    @Transactional
    public RefreshToken persistRefreshToken(User user, String plainToken) {
        return persistRefreshToken(user, plainToken, ClientDeviceInfo.unknown());
    }

    @Transactional
    public RefreshToken persistRefreshToken(User user, String plainToken, ClientDeviceInfo deviceInfo) {
        Instant now = Instant.now();
        Instant expiresAt = jwtService.extractExpiration(plainToken);
        ClientDeviceInfo info = deviceInfo != null ? deviceInfo : ClientDeviceInfo.unknown();
        UserAgentParser.ParsedUserAgent parsed = UserAgentParser.parse(info.userAgent());

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setTokenHash(hashToken(plainToken));
        refreshToken.setExpiresAt(expiresAt);
        refreshToken.setRevoked(false);
        refreshToken.setCreatedAt(now);
        refreshToken.setUpdatedAt(now);
        refreshToken.setLastUsedAt(now);
        refreshToken.setUserAgent(info.userAgent());
        refreshToken.setIpAddress(info.ipAddress());
        refreshToken.setDeviceLabel(parsed.device() + " · " + parsed.browser());

        return refreshTokenRepository.save(refreshToken);
    }

    @Transactional
    public void touchLastUsed(RefreshToken refreshToken) {
        Instant now = Instant.now();
        refreshToken.setLastUsedAt(now);
        refreshToken.setUpdatedAt(now);
        refreshTokenRepository.save(refreshToken);
    }

    @Transactional
    public void revoke(RefreshToken refreshToken) {
        refreshToken.setRevoked(true);
        refreshToken.setUpdatedAt(Instant.now());
        refreshTokenRepository.save(refreshToken);
    }

    @Transactional
    public void revokeAllForUser(UUID userId) {
        List<RefreshToken> tokens = refreshTokenRepository.findAllByUserIdAndRevokedFalse(userId);
        Instant now = Instant.now();
        for (RefreshToken token : tokens) {
            token.setRevoked(true);
            token.setUpdatedAt(now);
        }
        refreshTokenRepository.saveAll(tokens);
    }

    @Transactional
    public void revokeAllForUserExcept(UUID userId, String keepTokenHash) {
        List<RefreshToken> tokens = refreshTokenRepository.findAllByUserIdAndRevokedFalse(userId);
        Instant now = Instant.now();
        for (RefreshToken token : tokens) {
            if (keepTokenHash != null && keepTokenHash.equals(token.getTokenHash())) {
                continue;
            }
            token.setRevoked(true);
            token.setUpdatedAt(now);
        }
        refreshTokenRepository.saveAll(tokens);
    }
}
