package com.novacore.activity;

import com.novacore.activity.dto.ActivityResponse;
import com.novacore.auth.exception.AuthenticationFailedException;
import com.novacore.security.service.AuthenticatedUser;
import com.novacore.users.User;
import com.novacore.users.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ActivityLogServiceTest {

    @Mock
    private ActivityLogRepository activityLogRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ActivityLogService activityLogService;

    private UUID userId;
    private User user;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        userId = UUID.randomUUID();
        user = new User();
        user.setId(userId);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void logActivity_persistsActivityRecord() {
        UUID entityId = UUID.randomUUID();
        Map<String, Object> metadata = Map.of("spaceName", "Health");

        when(userRepository.getReferenceById(userId)).thenReturn(user);
        when(activityLogRepository.save(any(ActivityLog.class))).thenAnswer(invocation -> {
            ActivityLog saved = invocation.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });

        ActivityLog result = activityLogService.logActivity(
                userId,
                EntityType.SPACE,
                entityId,
                ActionType.CREATED,
                "Created Health Space",
                null,
                metadata);

        ArgumentCaptor<ActivityLog> captor = ArgumentCaptor.forClass(ActivityLog.class);
        verify(activityLogRepository).save(captor.capture());

        ActivityLog captured = captor.getValue();
        assertThat(captured.getUser()).isEqualTo(user);
        assertThat(captured.getEntityType()).isEqualTo(EntityType.SPACE);
        assertThat(captured.getEntityId()).isEqualTo(entityId);
        assertThat(captured.getAction()).isEqualTo(ActionType.CREATED);
        assertThat(captured.getTitle()).isEqualTo("Created Health Space");
        assertThat(captured.getDescription()).isNull();
        assertThat(captured.getMetadata()).isEqualTo(metadata);
        assertThat(result.getEntityType()).isEqualTo(EntityType.SPACE);
    }

    @Test
    void getRecentActivities_mapsRepositoryResults() {
        ActivityLog activityLog = buildActivityLog(
                ActionType.UPLOADED,
                "Uploaded report.pdf",
                "Added to Health Space",
                Instant.parse("2026-07-22T11:20:00Z"));

        when(activityLogRepository.findTop20ByUserIdOrderByCreatedAtDesc(userId))
                .thenReturn(List.of(activityLog));

        List<ActivityResponse> responses = activityLogService.getRecentActivities(userId);

        assertThat(responses).hasSize(1);
        ActivityResponse response = responses.getFirst();
        assertThat(response.getId()).isEqualTo(activityLog.getId());
        assertThat(response.getEntityType()).isEqualTo(EntityType.ASSET);
        assertThat(response.getEntityId()).isEqualTo(activityLog.getEntityId());
        assertThat(response.getAction()).isEqualTo(ActionType.UPLOADED);
        assertThat(response.getTitle()).isEqualTo("Uploaded report.pdf");
        assertThat(response.getDescription()).isEqualTo("Added to Health Space");
        assertThat(response.getCreatedAt()).isEqualTo(activityLog.getCreatedAt());
    }

    @Test
    void getRecentActivities_returnsNewestFirst() {
        ActivityLog newest = buildActivityLog(
                ActionType.CREATED,
                "Created Travel Space",
                null,
                Instant.parse("2026-07-22T12:00:00Z"));
        ActivityLog older = buildActivityLog(
                ActionType.CREATED,
                "Created Health Space",
                null,
                Instant.parse("2026-07-22T11:00:00Z"));

        when(activityLogRepository.findTop20ByUserIdOrderByCreatedAtDesc(userId))
                .thenReturn(List.of(newest, older));

        List<ActivityResponse> responses = activityLogService.getRecentActivities(userId);

        assertThat(responses).extracting(ActivityResponse::getTitle)
                .containsExactly("Created Travel Space", "Created Health Space");
        assertThat(responses.getFirst().getCreatedAt()).isAfter(responses.get(1).getCreatedAt());
    }

    @Test
    void getRecentActivities_returnsEmptyListWhenNoActivities() {
        when(activityLogRepository.findTop20ByUserIdOrderByCreatedAtDesc(userId))
                .thenReturn(List.of());

        List<ActivityResponse> responses = activityLogService.getRecentActivities(userId);

        assertThat(responses).isEmpty();
    }

    @Test
    void getRecentActivitiesForCurrentUser_requiresAuthentication() {
        assertThatThrownBy(() -> activityLogService.getRecentActivitiesForCurrentUser())
                .isInstanceOf(AuthenticationFailedException.class)
                .hasMessage("Unauthorized");
    }

    @Test
    void getRecentActivitiesForCurrentUser_usesAuthenticatedUserId() {
        authenticate(userId);
        when(activityLogRepository.findTop20ByUserIdOrderByCreatedAtDesc(userId))
                .thenReturn(List.of());

        activityLogService.getRecentActivitiesForCurrentUser();

        verify(activityLogRepository).findTop20ByUserIdOrderByCreatedAtDesc(userId);
    }

    private ActivityLog buildActivityLog(ActionType action, String title, String description, Instant createdAt) {
        ActivityLog activityLog = new ActivityLog();
        activityLog.setId(UUID.randomUUID());
        activityLog.setUser(user);
        activityLog.setEntityType(EntityType.ASSET);
        activityLog.setEntityId(UUID.randomUUID());
        activityLog.setAction(action);
        activityLog.setTitle(title);
        activityLog.setDescription(description);
        activityLog.setCreatedAt(createdAt);
        return activityLog;
    }

    private void authenticate(UUID authenticatedUserId) {
        AuthenticatedUser principal = new AuthenticatedUser(authenticatedUserId, "testuser");
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, List.of()));
    }
}
