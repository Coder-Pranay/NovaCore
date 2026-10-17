package com.novacore.auth;

import com.novacore.auth.dto.RegisterRequest;
import com.novacore.auth.dto.RegisterResponse;
import com.novacore.auth.mapper.UserMapper;
import com.novacore.common.exception.ConflictException;
import com.novacore.security.jwt.JwtProperties;
import com.novacore.security.jwt.JwtService;
import com.novacore.users.Role;
import com.novacore.users.RoleNames;
import com.novacore.users.RoleRepository;
import com.novacore.users.User;
import com.novacore.users.UserRepository;
import com.novacore.users.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthenticationServiceRegisterTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordService passwordService;

    @Mock
    private UserMapper userMapper;

    @Mock
    private JwtService jwtService;

    @Mock
    private JwtProperties jwtProperties;

    @Mock
    private RefreshTokenService refreshTokenService;

    @Mock
    private AuthProperties authProperties;

    @Mock
    private EmailVerificationService emailVerificationService;

    @Mock
    private com.novacore.activity.ActivityLogService activityLogService;

    @InjectMocks
    private AuthenticationService authenticationService;

    private RegisterRequest request;
    private Role userRole;

    @BeforeEach
    void setUp() {
        request = new RegisterRequest();
        request.setEmail("Alice@Example.com");
        request.setUsername("alice");
        request.setPassword("Secret123!");
        request.setFirstName("Alice");
        request.setLastName("Wonder");

        userRole = new Role();
        userRole.setId(UUID.randomUUID());
        userRole.setName(RoleNames.USER);
    }

    @Test
    void register_success_hashesPasswordAndAssignsUserRole() {
        User mapped = new User();
        mapped.setEmail("alice@example.com");
        mapped.setUsername("alice");
        mapped.setFirstName("Alice");
        mapped.setLastName("Wonder");
        mapped.setStatus(UserStatus.ACTIVE);

        User saved = new User();
        saved.setId(UUID.randomUUID());
        saved.setEmail("alice@example.com");
        saved.setUsername("alice");
        saved.setFirstName("Alice");
        saved.setLastName("Wonder");
        saved.setStatus(UserStatus.ACTIVE);
        saved.setCreatedAt(Instant.now());
        saved.setPasswordHash("$2a$10$hashed");

        RegisterResponse expected = new RegisterResponse();
        expected.setId(saved.getId());
        expected.setEmail(saved.getEmail());
        expected.setUsername(saved.getUsername());

        when(userRepository.existsByEmail("alice@example.com")).thenReturn(false);
        when(userRepository.existsByUsername("alice")).thenReturn(false);
        when(roleRepository.findByName(RoleNames.USER)).thenReturn(Optional.of(userRole));
        when(userMapper.toEntity(request)).thenReturn(mapped);
        when(passwordService.hashPassword("Secret123!")).thenReturn("$2a$10$hashed");
        when(userRepository.save(any(User.class))).thenReturn(saved);
        when(userMapper.toRegisterResponse(saved)).thenReturn(expected);

        RegisterResponse response = authenticationService.register(request);

        assertThat(response.getId()).isEqualTo(saved.getId());
        assertThat(response.getEmail()).isEqualTo("alice@example.com");

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User persisted = captor.getValue();
        assertThat(persisted.getPasswordHash()).isEqualTo("$2a$10$hashed");
        assertThat(persisted.getPasswordHash()).doesNotContain("Secret123!");
        assertThat(persisted.getRoles()).containsExactly(userRole);
        verify(passwordService).hashPassword("Secret123!");
        verify(emailVerificationService).sendVerificationEmail(saved);
    }

    @Test
    void register_duplicateEmail_throwsConflict() {
        when(userRepository.existsByEmail("alice@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authenticationService.register(request))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Email");

        verify(userRepository, never()).save(any());
        verify(passwordService, never()).hashPassword(anyString());
    }

    @Test
    void register_duplicateUsername_throwsConflict() {
        when(userRepository.existsByEmail("alice@example.com")).thenReturn(false);
        when(userRepository.existsByUsername("alice")).thenReturn(true);

        assertThatThrownBy(() -> authenticationService.register(request))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Username");

        verify(userRepository, never()).save(any());
    }

    @Test
    void register_missingDefaultRole_throwsIllegalState() {
        when(userRepository.existsByEmail("alice@example.com")).thenReturn(false);
        when(userRepository.existsByUsername("alice")).thenReturn(false);
        when(roleRepository.findByName(RoleNames.USER)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authenticationService.register(request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("USER role");
    }
}
