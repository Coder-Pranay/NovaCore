package com.novacore.sharing;

import com.novacore.assets.Asset;
import com.novacore.assets.AssetRepository;
import com.novacore.auth.PasswordService;
import com.novacore.auth.exception.AuthenticationFailedException;
import com.novacore.common.exception.ResourceNotFoundException;
import com.novacore.security.service.AuthenticatedUser;
import com.novacore.sharing.dto.AccessPublicLinkRequest;
import com.novacore.sharing.dto.CreatePublicLinkRequest;
import com.novacore.sharing.dto.PublicLinkAccessResponse;
import com.novacore.sharing.dto.PublicLinkPreviewResponse;
import com.novacore.sharing.dto.PublicLinkResponse;
import com.novacore.sharing.exception.InvalidSharePasswordException;
import com.novacore.sharing.exception.PublicLinkNotFoundException;
import com.novacore.spaces.Space;
import com.novacore.spaces.SpaceRepository;
import com.novacore.users.User;
import com.novacore.users.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

/**
 * Owner-managed public share links with optional BCrypt password protection.
 * Access paths never return content until password verification succeeds.
 */
@Service
public class PublicLinkService {

    /**
     * Valid BCrypt hash used only for constant-time password checks when the
     * share is missing or not password-protected (mitigates timing oracles).
     */
    static final String DUMMY_PASSWORD_HASH =
            "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

    private static final String NOT_FOUND_MESSAGE = "Share not found";
    private static final String RESOURCE_NOT_FOUND_MESSAGE = "Resource not found";
    private static final String INVALID_PASSWORD_MESSAGE = "Invalid password";

    private final PublicLinkRepository publicLinkRepository;
    private final UserRepository userRepository;
    private final SpaceRepository spaceRepository;
    private final AssetRepository assetRepository;
    private final PasswordService passwordService;
    private final SecureRandom secureRandom = new SecureRandom();
    private final String publicShareBaseUrl;

    public PublicLinkService(
            PublicLinkRepository publicLinkRepository,
            UserRepository userRepository,
            SpaceRepository spaceRepository,
            AssetRepository assetRepository,
            PasswordService passwordService,
            @Value("${novacore.public-share.base-url:}") String publicShareBaseUrl) {
        this.publicLinkRepository = publicLinkRepository;
        this.userRepository = userRepository;
        this.spaceRepository = spaceRepository;
        this.assetRepository = assetRepository;
        this.passwordService = passwordService;
        this.publicShareBaseUrl = publicShareBaseUrl == null ? "" : publicShareBaseUrl.trim();
    }

    @Transactional
    public PublicLinkResponse create(CreatePublicLinkRequest request) {
        UUID ownerId = requireAuthenticatedUserId();
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new AuthenticationFailedException("Unauthorized"));

        OwnedResource owned = requireOwnedResource(
                ownerId,
                request.getResourceType(),
                request.getResourceId());

        String passwordHash = resolvePasswordHash(request);

        publicLinkRepository.disableActiveLinksForResource(
                ownerId,
                request.getResourceType(),
                owned.id());

        Instant now = Instant.now();
        PublicLink link = new PublicLink();
        link.setOwner(owner);
        link.setResourceType(request.getResourceType());
        link.setResourceId(owned.id());
        link.setResourceName(owned.name());
        link.setToken(generateToken());
        link.setPasswordHash(passwordHash);
        link.setEnabled(true);
        link.setExpiresAt(normalizeExpiresAt(request.getExpiresAt(), now));
        link.setCreatedAt(now);
        link.setUpdatedAt(now);

        return toOwnerResponse(publicLinkRepository.save(link));
    }

    @Transactional(readOnly = true)
    public List<PublicLinkResponse> listMine() {
        UUID ownerId = requireAuthenticatedUserId();
        return publicLinkRepository.findAllByOwnerIdOrderByCreatedAtDesc(ownerId).stream()
                .map(this::toOwnerResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PublicLinkResponse getActiveForResource(ShareResourceType resourceType, UUID resourceId) {
        UUID ownerId = requireAuthenticatedUserId();
        Instant now = Instant.now();
        return publicLinkRepository
                .findByResourceTypeAndResourceIdAndEnabledTrue(resourceType, resourceId)
                .filter(item -> item.getOwner().getId().equals(ownerId))
                .filter(link -> !link.isExpired(now))
                .map(this::toOwnerResponse)
                .orElse(null);
    }

    @Transactional
    public PublicLinkResponse disable(UUID linkId) {
        UUID ownerId = requireAuthenticatedUserId();
        PublicLink link = publicLinkRepository.findByIdAndOwnerId(linkId, ownerId)
                .orElseThrow(() -> new PublicLinkNotFoundException(NOT_FOUND_MESSAGE));

        link.setEnabled(false);
        link.setUpdatedAt(Instant.now());
        return toOwnerResponse(publicLinkRepository.save(link));
    }

    /**
     * Metadata only — never returns resource content. Missing / disabled / expired → 404.
     */
    @Transactional(readOnly = true)
    public PublicLinkPreviewResponse preview(String token) {
        PublicLink link = findAccessibleLink(token).orElse(null);
        // Constant-ish work even when missing (dummy bcrypt) to reduce token enumeration timing leaks.
        passwordService.matches("timing-pad", DUMMY_PASSWORD_HASH);

        if (link == null) {
            throw new PublicLinkNotFoundException(NOT_FOUND_MESSAGE);
        }

        PublicLinkPreviewResponse response = new PublicLinkPreviewResponse();
        response.setToken(link.getToken());
        response.setResourceType(link.getResourceType());
        response.setResourceName(link.getResourceName());
        response.setPasswordRequired(link.isPasswordProtected());
        response.setExpiresAt(link.getExpiresAt());
        return response;
    }

    /**
     * Verifies password (when required) before returning share content.
     * 404 for invalid/disabled/expired shares; 401 for wrong/missing password.
     */
    @Transactional(readOnly = true)
    public PublicLinkAccessResponse access(String token, AccessPublicLinkRequest request) {
        String provided = request == null || request.getPassword() == null
                ? ""
                : request.getPassword();

        PublicLink link = findAccessibleLink(token).orElse(null);
        boolean exists = link != null;
        boolean protectedLink = exists && link.isPasswordProtected();

        String hashToCheck = protectedLink ? link.getPasswordHash() : DUMMY_PASSWORD_HASH;
        boolean passwordMatches = passwordService.matches(provided, hashToCheck);

        if (!exists) {
            throw new PublicLinkNotFoundException(NOT_FOUND_MESSAGE);
        }
        if (protectedLink && !passwordMatches) {
            throw new InvalidSharePasswordException(INVALID_PASSWORD_MESSAGE);
        }

        PublicLinkAccessResponse response = new PublicLinkAccessResponse();
        response.setResourceType(link.getResourceType());
        response.setResourceId(link.getResourceId());
        response.setResourceName(link.getResourceName());
        response.setDescription(
                "Shared " + link.getResourceType().name().toLowerCase() + " via public link");
        return response;
    }

    private OwnedResource requireOwnedResource(
            UUID ownerId,
            ShareResourceType resourceType,
            UUID resourceId) {
        if (resourceType == ShareResourceType.SPACE) {
            Space space = spaceRepository.findByIdAndOwnerId(resourceId, ownerId)
                    .orElseThrow(() -> new ResourceNotFoundException(RESOURCE_NOT_FOUND_MESSAGE));
            return new OwnedResource(space.getId(), space.getName());
        }
        if (resourceType == ShareResourceType.ASSET) {
            Asset asset = assetRepository.findByIdAndOwnerId(resourceId, ownerId)
                    .orElseThrow(() -> new ResourceNotFoundException(RESOURCE_NOT_FOUND_MESSAGE));
            return new OwnedResource(asset.getId(), asset.getName());
        }
        throw new IllegalArgumentException("Unsupported resource type");
    }

    private String resolvePasswordHash(CreatePublicLinkRequest request) {
        boolean wantsPassword = request.isPasswordProtected()
                || (request.getPassword() != null && !request.getPassword().isBlank());

        if (!wantsPassword) {
            return null;
        }

        String password = request.getPassword();
        if (password == null || password.isBlank()) {
            throw new IllegalArgumentException("Password is required when password protection is enabled");
        }
        if (password.length() < 8 || password.length() > 100) {
            throw new IllegalArgumentException("Password must be between 8 and 100 characters");
        }

        return passwordService.hashPassword(password);
    }

    private java.util.Optional<PublicLink> findAccessibleLink(String token) {
        if (token == null || token.isBlank()) {
            return java.util.Optional.empty();
        }
        Instant now = Instant.now();
        return publicLinkRepository.findByToken(token.trim())
                .filter(PublicLink::isEnabled)
                .filter(link -> !link.isExpired(now));
    }

    private Instant normalizeExpiresAt(Instant expiresAt, Instant now) {
        if (expiresAt == null) {
            return null;
        }
        if (!expiresAt.isAfter(now)) {
            throw new IllegalArgumentException("Expiration must be in the future");
        }
        return expiresAt;
    }

    private String generateToken() {
        byte[] bytes = new byte[24];
        secureRandom.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }

    private PublicLinkResponse toOwnerResponse(PublicLink link) {
        PublicLinkResponse response = new PublicLinkResponse();
        response.setId(link.getId());
        response.setResourceType(link.getResourceType());
        response.setResourceId(link.getResourceId());
        response.setResourceName(link.getResourceName());
        response.setToken(link.getToken());
        response.setUrl(buildShareUrl(link.getToken()));
        response.setEnabled(link.isEnabled());
        response.setExpiresAt(link.getExpiresAt());
        response.setPasswordProtected(link.isPasswordProtected());
        response.setCreatedAt(link.getCreatedAt());
        response.setUpdatedAt(link.getUpdatedAt());
        return response;
    }

    private String buildShareUrl(String token) {
        String path = "/shared/link/" + token;
        if (publicShareBaseUrl.isBlank()) {
            return path;
        }
        String base = publicShareBaseUrl.endsWith("/")
                ? publicShareBaseUrl.substring(0, publicShareBaseUrl.length() - 1)
                : publicShareBaseUrl;
        return base + path;
    }

    private UUID requireAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser user)) {
            throw new AuthenticationFailedException("Unauthorized");
        }
        return user.userId();
    }

    private record OwnedResource(UUID id, String name) {
    }
}
