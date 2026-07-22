package com.novacore.security.jwt;

import java.time.Instant;
import java.util.UUID;

/**
 * Typed view of JWT claims used by NovaCore authentication.
 */
public record JwtClaims(
        UUID userId,
        String username,
        String tokenType,
        Instant issuedAt,
        Instant expiresAt,
        String issuer) {

    public static final String TYPE_ACCESS = "access";
    public static final String TYPE_REFRESH = "refresh";

    public boolean isAccessToken() {
        return TYPE_ACCESS.equals(tokenType);
    }

    public boolean isRefreshToken() {
        return TYPE_REFRESH.equals(tokenType);
    }
}
