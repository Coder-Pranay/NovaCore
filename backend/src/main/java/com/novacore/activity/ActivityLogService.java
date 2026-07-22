package com.novacore.activity;

import com.novacore.activity.dto.ActivityResponse;
import com.novacore.auth.exception.AuthenticationFailedException;
import com.novacore.security.service.AuthenticatedUser;
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
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;
    private final UserRepository userRepository;

    public ActivityLogService(ActivityLogRepository activityLogRepository, UserRepository userRepository) {
        this.activityLogRepository = activityLogRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public ActivityLog logActivity(
            UUID userId,
            EntityType entityType,
            UUID entityId,
            ActionType action,
            String title,
            String description,
            Map<String, Object> metadata) {
        ActivityLog activityLog = new ActivityLog();
        activityLog.setUser(userRepository.getReferenceById(userId));
        activityLog.setEntityType(entityType);
        activityLog.setEntityId(entityId);
        activityLog.setAction(action);
        activityLog.setTitle(title);
        activityLog.setDescription(description);
        activityLog.setMetadata(metadata);
        activityLog.setCreatedAt(Instant.now());
        return activityLogRepository.save(activityLog);
    }

    @Transactional(readOnly = true)
    public List<ActivityResponse> getRecentActivitiesForCurrentUser() {
        return getRecentActivities(requireAuthenticatedUserId());
    }

    @Transactional(readOnly = true)
    public List<ActivityResponse> getRecentActivities(UUID userId) {
        return activityLogRepository.findTop20ByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    private ActivityResponse toResponse(ActivityLog activityLog) {
        ActivityResponse response = new ActivityResponse();
        response.setId(activityLog.getId());
        response.setEntityType(activityLog.getEntityType());
        response.setEntityId(activityLog.getEntityId());
        response.setAction(activityLog.getAction());
        response.setTitle(activityLog.getTitle());
        response.setDescription(activityLog.getDescription());
        response.setCreatedAt(activityLog.getCreatedAt());
        return response;
    }

    private UUID requireAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser authenticatedUser)) {
            throw new AuthenticationFailedException("Unauthorized");
        }
        return authenticatedUser.userId();
    }
}
