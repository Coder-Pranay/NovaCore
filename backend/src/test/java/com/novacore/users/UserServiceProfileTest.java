package com.novacore.users;

import com.novacore.activity.ActivityLogService;
import com.novacore.auth.exception.AuthenticationFailedException;
import com.novacore.security.service.AuthenticatedUser;
import com.novacore.users.dto.UpdateUserProfileRequest;
import com.novacore.users.dto.UserProfileResponse;
import com.novacore.users.mapper.UserProfileMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceProfileTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserProfileMapper userProfileMapper;

    @Mock
    private ActivityLogService activityLogService;

    @InjectMocks
    private UserService userService;

    private User user;
    private UserProfileResponse profileResponse;
    private UUID userId;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        userId = UUID.randomUUID();

        Role role = new Role();
        role.setName("USER");

        user = new User();
        user.setId(userId);
        user.setEmail("alice@example.com");
        user.setUsername("alice");
        user.setPasswordHash("hash");
        user.setFirstName("Alice");
        user.setLastName("Smith");
        user.setPhoneNumber("+15551234567");
        user.setStatus(UserStatus.ACTIVE);
        user.setEmailVerified(false);
        user.setCreatedAt(Instant.parse("2026-01-01T00:00:00Z"));
        user.setUpdatedAt(Instant.parse("2026-01-01T00:00:00Z"));
        user.setRoles(Set.of(role));

        profileResponse = new UserProfileResponse();
        profileResponse.setId(userId);
        profileResponse.setEmail("alice@example.com");
        profileResponse.setUsername("alice");
        profileResponse.setFirstName("Alice");
        profileResponse.setLastName("Smith");
        profileResponse.setPhoneNumber("+15551234567");
        profileResponse.setRoles(List.of("USER"));

        authenticateAs(userId, "alice");
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getCurrentUserProfile_returnsMappedProfile() {
        when(userRepository.findByIdWithRoles(userId)).thenReturn(Optional.of(user));
        when(userProfileMapper.toProfileResponse(user)).thenReturn(profileResponse);

        UserProfileResponse result = userService.getCurrentUserProfile();

        assertThat(result).isSameAs(profileResponse);
        verify(userRepository).findByIdWithRoles(userId);
    }

    @Test
    void getCurrentUserProfile_withoutAuthentication_throwsUnauthorized() {
        SecurityContextHolder.clearContext();

        assertThatThrownBy(() -> userService.getCurrentUserProfile())
                .isInstanceOf(AuthenticationFailedException.class)
                .hasMessage("Unauthorized");
    }

    @Test
    void updateCurrentUserProfile_updatesEditableFieldsOnly() {
        UpdateUserProfileRequest request = new UpdateUserProfileRequest();
        request.setFirstName("Updated");
        request.setLastName("Name");
        request.setPhoneNumber("+15559876543");

        when(userRepository.findByIdWithRoles(userId)).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenAnswer(invocation -> invocation.getArgument(0));
        when(userProfileMapper.toProfileResponse(user)).thenReturn(profileResponse);

        userService.updateCurrentUserProfile(request);

        assertThat(user.getFirstName()).isEqualTo("Updated");
        assertThat(user.getLastName()).isEqualTo("Name");
        assertThat(user.getPhoneNumber()).isEqualTo("+15559876543");
        assertThat(user.getEmail()).isEqualTo("alice@example.com");
        assertThat(user.getUsername()).isEqualTo("alice");
        assertThat(user.getPasswordHash()).isEqualTo("hash");
        assertThat(user.getStatus()).isEqualTo(UserStatus.ACTIVE);
        assertThat(user.getUpdatedAt()).isAfter(Instant.parse("2026-01-01T00:00:00Z"));

        verify(userRepository).save(user);
    }

    @Test
    void updateCurrentUserProfile_blankPhoneNumberClearsValue() {
        UpdateUserProfileRequest request = new UpdateUserProfileRequest();
        request.setFirstName("Alice");
        request.setLastName("Smith");
        request.setPhoneNumber("   ");

        when(userRepository.findByIdWithRoles(userId)).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenAnswer(invocation -> invocation.getArgument(0));
        when(userProfileMapper.toProfileResponse(user)).thenReturn(profileResponse);

        userService.updateCurrentUserProfile(request);

        assertThat(user.getPhoneNumber()).isNull();
    }

    @Test
    void updateCurrentUserProfile_withoutAuthentication_throwsUnauthorized() {
        SecurityContextHolder.clearContext();

        UpdateUserProfileRequest request = new UpdateUserProfileRequest();
        request.setFirstName("Alice");
        request.setLastName("Smith");

        assertThatThrownBy(() -> userService.updateCurrentUserProfile(request))
                .isInstanceOf(AuthenticationFailedException.class)
                .hasMessage("Unauthorized");

        verify(userRepository, never()).save(any());
    }

    private void authenticateAs(UUID userId, String username) {
        AuthenticatedUser principal = new AuthenticatedUser(userId, username);
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                principal,
                null,
                List.of());
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }
}
