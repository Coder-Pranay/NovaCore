package com.novacore.security.service;

import java.util.UUID;

/**
 * Authenticated principal extracted from a valid access token.
 */
public record AuthenticatedUser(UUID userId, String username) {
}
