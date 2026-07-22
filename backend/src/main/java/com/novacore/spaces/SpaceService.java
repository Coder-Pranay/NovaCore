package com.novacore.spaces;

import com.novacore.activity.ActionType;
import com.novacore.activity.ActivityLogService;
import com.novacore.activity.EntityType;
import com.novacore.auth.exception.AuthenticationFailedException;
import com.novacore.common.exception.ConflictException;
import com.novacore.security.service.AuthenticatedUser;
import com.novacore.spaces.dto.CreateSpaceRequest;
import com.novacore.spaces.dto.SpaceResponse;
import com.novacore.spaces.dto.UpdateSpaceRequest;
import com.novacore.spaces.exception.SpaceNotFoundException;
import com.novacore.spaces.mapper.SpaceMapper;
import com.novacore.spaces.util.SpaceSlugGenerator;
import com.novacore.users.User;
import com.novacore.users.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class SpaceService {

    private final SpaceRepository spaceRepository;
    private final UserRepository userRepository;
    private final SpaceMapper spaceMapper;
    private final ActivityLogService activityLogService;

    public SpaceService(
            SpaceRepository spaceRepository,
            UserRepository userRepository,
            SpaceMapper spaceMapper,
            ActivityLogService activityLogService) {
        this.spaceRepository = spaceRepository;
        this.userRepository = userRepository;
        this.spaceMapper = spaceMapper;
        this.activityLogService = activityLogService;
    }

    @Transactional
    public SpaceResponse createSpace(CreateSpaceRequest request) {
        UUID ownerId = requireAuthenticatedUserId();
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new AuthenticationFailedException("Unauthorized"));

        String slug = resolveSlugForCreate(ownerId, request.getName(), request.getSlug());

        Space space = new Space();
        space.setOwner(owner);
        space.setName(request.getName().trim());
        space.setSlug(slug);
        space.setDescription(normalizeOptionalText(request.getDescription()));
        space.setIcon(normalizeOptionalText(request.getIcon()));
        space.setColor(normalizeOptionalText(request.getColor()));
        space.setType(request.getType() != null ? request.getType() : SpaceType.BLANK);
        space.setFavorite(false);
        space.setArchived(false);
        space.setDisplayOrder(spaceRepository.countByOwnerId(ownerId));
        space.setCreatedAt(Instant.now());
        space.setUpdatedAt(Instant.now());

        Space saved = spaceRepository.save(space);
        activityLogService.logActivity(
                ownerId,
                EntityType.SPACE,
                saved.getId(),
                ActionType.CREATED,
                "Created " + saved.getName() + " Space",
                null,
                Map.of("spaceName", saved.getName(), "slug", saved.getSlug()));
        return spaceMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<SpaceResponse> getMySpaces() {
        UUID ownerId = requireAuthenticatedUserId();
        return spaceRepository.findAllByOwnerIdAndArchivedFalseOrderByDisplayOrderAsc(ownerId).stream()
                .map(spaceMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public SpaceResponse getSpaceById(UUID spaceId) {
        UUID ownerId = requireAuthenticatedUserId();
        Space space = findOwnedSpace(spaceId, ownerId);
        return spaceMapper.toResponse(space);
    }

    @Transactional
    public SpaceResponse updateSpace(UUID spaceId, UpdateSpaceRequest request) {
        UUID ownerId = requireAuthenticatedUserId();
        Space space = findOwnedSpace(spaceId, ownerId);

        space.setName(request.getName().trim());
        space.setDescription(normalizeOptionalText(request.getDescription()));
        space.setIcon(normalizeOptionalText(request.getIcon()));
        space.setColor(normalizeOptionalText(request.getColor()));

        if (request.getType() != null) {
            space.setType(request.getType());
        }
        if (request.getFavorite() != null) {
            space.setFavorite(request.getFavorite());
        }
        if (request.getDisplayOrder() != null) {
            space.setDisplayOrder(request.getDisplayOrder());
        }

        space.setUpdatedAt(Instant.now());

        Space saved = spaceRepository.save(space);
        activityLogService.logActivity(
                ownerId,
                EntityType.SPACE,
                saved.getId(),
                ActionType.UPDATED,
                "Updated " + saved.getName() + " Space",
                null,
                Map.of("spaceName", saved.getName(), "slug", saved.getSlug()));
        return spaceMapper.toResponse(saved);
    }

    @Transactional
    public SpaceResponse archiveSpace(UUID spaceId) {
        UUID ownerId = requireAuthenticatedUserId();
        Space space = findOwnedSpace(spaceId, ownerId);

        space.setArchived(true);
        space.setUpdatedAt(Instant.now());

        Space saved = spaceRepository.save(space);
        activityLogService.logActivity(
                ownerId,
                EntityType.SPACE,
                saved.getId(),
                ActionType.ARCHIVED,
                "Archived " + saved.getName() + " Space",
                null,
                Map.of("spaceName", saved.getName(), "slug", saved.getSlug()));
        return spaceMapper.toResponse(saved);
    }

    private Space findOwnedSpace(UUID spaceId, UUID ownerId) {
        return spaceRepository.findByIdAndOwnerId(spaceId, ownerId)
                .orElseThrow(SpaceNotFoundException::new);
    }

    private String resolveSlugForCreate(UUID ownerId, String name, String requestedSlug) {
        if (requestedSlug != null && !requestedSlug.isBlank()) {
            String slug = SpaceSlugGenerator.toSlug(requestedSlug);
            if (spaceRepository.existsByOwnerIdAndSlug(ownerId, slug)) {
                throw new ConflictException("Slug already in use");
            }
            return slug;
        }

        return SpaceSlugGenerator.resolveUniqueSlug(
                name,
                candidate -> spaceRepository.existsByOwnerIdAndSlug(ownerId, candidate));
    }

    private UUID requireAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser authenticatedUser)) {
            throw new AuthenticationFailedException("Unauthorized");
        }
        return authenticatedUser.userId();
    }

    private static String normalizeOptionalText(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
