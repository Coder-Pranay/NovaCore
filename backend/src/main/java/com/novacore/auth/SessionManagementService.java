package com.novacore.auth;

import com.novacore.auth.dto.SessionResponse;
import com.novacore.auth.exception.AuthenticationFailedException;
import com.novacore.common.exception.ResourceNotFoundException;
import com.novacore.security.service.AuthenticatedUser;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
public class SessionManagementService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final RefreshTokenService refreshTokenService;

    public SessionManagementService(
            RefreshTokenRepository refreshTokenRepository,
            RefreshTokenService refreshTokenService) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.refreshTokenService = refreshTokenService;
    }

    @Transactional(readOnly = true)
    public List<SessionResponse> listSessions(String currentPlainRefreshToken) {
        UUID userId = requireUserId();
        Instant now = Instant.now();
        String currentHash = hashOrNull(currentPlainRefreshToken);

        return refreshTokenRepository.findAllByUserIdAndRevokedFalse(userId).stream()
                .filter(token -> token.getExpiresAt().isAfter(now))
                .sorted(Comparator.comparing(
                        (RefreshToken t) -> t.getLastUsedAt() != null ? t.getLastUsedAt() : t.getCreatedAt(),
                        Comparator.reverseOrder()))
                .map(token -> toResponse(token, currentHash))
                .toList();
    }

    @Transactional
    public void revokeSession(UUID sessionId, String currentPlainRefreshToken) {
        UUID userId = requireUserId();
        RefreshToken token = refreshTokenRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        if (!token.getUser().getId().equals(userId) || token.isRevoked()) {
            throw new ResourceNotFoundException("Session not found");
        }

        String currentHash = hashOrNull(currentPlainRefreshToken);
        if (currentHash != null && currentHash.equals(token.getTokenHash())) {
            throw new IllegalArgumentException("Cannot revoke the current session; use logout instead");
        }

        refreshTokenService.revoke(token);
    }

    @Transactional
    public void revokeOtherSessions(String currentPlainRefreshToken) {
        UUID userId = requireUserId();
        if (currentPlainRefreshToken == null || currentPlainRefreshToken.isBlank()) {
            throw new AuthenticationFailedException("Current session required");
        }
        String currentHash = refreshTokenService.hashToken(currentPlainRefreshToken.trim());
        refreshTokenService.revokeAllForUserExcept(userId, currentHash);
    }

    private SessionResponse toResponse(RefreshToken token, String currentHash) {
        UserAgentParser.ParsedUserAgent parsed = UserAgentParser.parse(token.getUserAgent());
        SessionResponse response = new SessionResponse();
        response.setId(token.getId());
        response.setDevice(parsed.device());
        response.setBrowser(parsed.browser());
        response.setIpAddress(token.getIpAddress() != null ? token.getIpAddress() : "unknown");
        response.setLastActiveAt(
                token.getLastUsedAt() != null ? token.getLastUsedAt() : token.getCreatedAt());
        response.setCreatedAt(token.getCreatedAt());
        response.setCurrent(currentHash != null && currentHash.equals(token.getTokenHash()));
        return response;
    }

    private String hashOrNull(String plainRefreshToken) {
        if (plainRefreshToken == null || plainRefreshToken.isBlank()) {
            return null;
        }
        return refreshTokenService.hashToken(plainRefreshToken.trim());
    }

    private UUID requireUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser user)) {
            throw new AuthenticationFailedException("Unauthorized");
        }
        return user.userId();
    }
}
