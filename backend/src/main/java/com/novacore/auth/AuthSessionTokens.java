package com.novacore.auth;

/**
 * Internal auth session payload used to set HttpOnly cookies (tokens are never returned in JSON).
 */
public record AuthSessionTokens(
        String accessToken,
        String refreshToken,
        long expiresInSeconds) {
}
