package com.novacore.users;

import com.novacore.activity.ActionType;
import com.novacore.activity.ActivityLogService;
import com.novacore.activity.EntityType;
import com.novacore.auth.exception.AuthenticationFailedException;
import com.novacore.security.service.AuthenticatedUser;
import com.novacore.users.dto.UpdateUserProfileRequest;
import com.novacore.users.dto.UserProfileResponse;
import com.novacore.users.mapper.UserProfileMapper;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final UserProfileMapper userProfileMapper;
    private final ActivityLogService activityLogService;

    public UserService(
            UserRepository userRepository,
            UserProfileMapper userProfileMapper,
            ActivityLogService activityLogService) {
        this.userRepository = userRepository;
        this.userProfileMapper = userProfileMapper;
        this.activityLogService = activityLogService;
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getCurrentUserProfile() {
        User user = findAuthenticatedUser();
        return userProfileMapper.toProfileResponse(user);
    }

    @Transactional
    public UserProfileResponse updateCurrentUserProfile(UpdateUserProfileRequest request) {
        User user = findAuthenticatedUser();

        user.setFirstName(request.getFirstName().trim());
        user.setLastName(request.getLastName().trim());
        user.setPhoneNumber(normalizePhoneNumber(request.getPhoneNumber()));
        user.setUpdatedAt(Instant.now());

        User saved = userRepository.save(user);
        activityLogService.logActivity(
                saved.getId(),
                EntityType.PROFILE,
                saved.getId(),
                ActionType.UPDATED,
                "Updated profile",
                null,
                null);
        return userProfileMapper.toProfileResponse(saved);
    }

    private User findAuthenticatedUser() {
        UUID userId = requireAuthenticatedUserId();
        return userRepository.findByIdWithRoles(userId)
                .orElseThrow(() -> new AuthenticationFailedException("Unauthorized"));
    }

    private UUID requireAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser authenticatedUser)) {
            throw new AuthenticationFailedException("Unauthorized");
        }
        return authenticatedUser.userId();
    }

    private static String normalizePhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.isBlank()) {
            return null;
        }
        return phoneNumber.trim();
    }
}
