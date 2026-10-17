package com.novacore.auth;

import com.novacore.auth.exception.SecurityTokenException;
import com.novacore.users.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;

@Service
public class SecurityTokenService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final SecurityTokenRepository securityTokenRepository;

    public SecurityTokenService(SecurityTokenRepository securityTokenRepository) {
        this.securityTokenRepository = securityTokenRepository;
    }

    @Transactional
    public String issueToken(User user, SecurityTokenType type, Duration ttl) {
        Instant now = Instant.now();
        securityTokenRepository.expireActiveTokens(user.getId(), type, now);

        String plainToken = generatePlainToken();
        SecurityToken token = new SecurityToken();
        token.setUser(user);
        token.setTokenHash(hashToken(plainToken));
        token.setTokenType(type);
        token.setExpiresAt(now.plus(ttl));
        token.setCreatedAt(now);
        securityTokenRepository.save(token);
        return plainToken;
    }

    @Transactional(readOnly = true)
    public SecurityToken requireValidToken(String plainToken, SecurityTokenType type) {
        if (plainToken == null || plainToken.isBlank()) {
            throw new SecurityTokenException("Invalid or expired token");
        }

        SecurityToken token = securityTokenRepository
                .findByTokenHashAndTokenType(hashToken(plainToken.trim()), type)
                .orElseThrow(() -> new SecurityTokenException("Invalid or expired token"));

        Instant now = Instant.now();
        if (token.isUsed() || token.isExpired(now)) {
            throw new SecurityTokenException("Invalid or expired token");
        }
        return token;
    }

    @Transactional
    public void consume(SecurityToken token) {
        token.setUsedAt(Instant.now());
        securityTokenRepository.save(token);
    }

    @Transactional
    public void expireActiveTokens(UUID userId, SecurityTokenType type) {
        securityTokenRepository.expireActiveTokens(userId, type, Instant.now());
    }

    public String hashToken(String plainToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(plainToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashed);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 algorithm is not available", ex);
        }
    }

    private String generatePlainToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
