package com.novacore.auth;

import com.novacore.auth.dto.LoginRequest;
import com.novacore.auth.dto.AuthenticatedUserResponse;
import com.novacore.auth.dto.LoginResponse;
import com.novacore.auth.dto.RegisterRequest;
import com.novacore.auth.exception.AccountStatusException;
import com.novacore.auth.exception.AuthenticationFailedException;
import com.novacore.auth.mapper.UserMapper;
import com.novacore.security.jwt.JwtProperties;
import com.novacore.security.jwt.JwtService;
import com.novacore.users.Role;
import com.novacore.users.RoleNames;
import com.novacore.users.User;
import com.novacore.users.UserRepository;
import com.novacore.users.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthenticationServiceLoginTest {

    private static final String GENERIC_FAILURE = "Invalid credentials";

    @Mock
    private UserRepository userRepository;

    @Mock
    private com.novacore.users.RoleRepository roleRepository;

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

    private LoginRequest request;
    private User activeUser;
    private Role userRole;

    @BeforeEach
    void setUp() {
        request = new LoginRequest();
        request.setEmailOrUsername("alice");
        request.setPassword("Secret123!");

        userRole = new Role();
        userRole.setId(UUID.randomUUID());
        userRole.setName(RoleNames.USER);

        activeUser = new User();
        activeUser.setId(UUID.randomUUID());
        activeUser.setEmail("alice@example.com");
        activeUser.setUsername("alice");
        activeUser.setFirstName("Alice");
        activeUser.setLastName("Wonder");
        activeUser.setPasswordHash("$2a$10$hashed");
        activeUser.setStatus(UserStatus.ACTIVE);
        activeUser.setRoles(Set.of(userRole));
    }

    @Test
    void authenticate_success_issuesTokensAndPersistsHashedRefreshToken() {
        AuthenticatedUserResponse userDto = new AuthenticatedUserResponse();
        userDto.setId(activeUser.getId());
        userDto.setEmail(activeUser.getEmail());
        userDto.setUsername(activeUser.getUsername());
        userDto.setRoles(java.util.List.of(RoleNames.USER));

        when(userRepository.findByEmailOrUsernameWithRoles("alice")).thenReturn(Optional.of(activeUser));
        when(passwordService.matches("Secret123!", "$2a$10$hashed")).thenReturn(true);
        when(jwtService.generateAccessToken(activeUser.getId(), "alice")).thenReturn("access.jwt");
        when(refreshTokenService.generateRefreshToken(activeUser.getId(), "alice")).thenReturn("refresh.jwt");
        when(jwtProperties.getAccessTokenExpiration()).thenReturn(Duration.ofMinutes(15));
        when(userMapper.toAuthenticatedUserResponse(activeUser)).thenReturn(userDto);
        when(authProperties.isRequireEmailVerification()).thenReturn(false);

        AuthenticationService.LoginResult result =
                authenticationService.authenticate(request, ClientDeviceInfo.unknown());
        LoginResponse response = result.response();
        AuthSessionTokens tokens = result.tokens();

        assertThat(tokens.accessToken()).isEqualTo("access.jwt");
        assertThat(tokens.refreshToken()).isEqualTo("refresh.jwt");
        assertThat(response.getTokenType()).isEqualTo("Cookie");
        assertThat(response.getExpiresIn()).isEqualTo(900);
        assertThat(response.getUser().getUsername()).isEqualTo("alice");
        assertThat(response.getUser().getRoles()).containsExactly(RoleNames.USER);

        verify(refreshTokenService).persistRefreshToken(activeUser, "refresh.jwt", ClientDeviceInfo.unknown());
        verify(jwtService).generateAccessToken(activeUser.getId(), "alice");
    }

    @Test
    void authenticate_wrongPassword_throwsGenericFailure() {
        when(userRepository.findByEmailOrUsernameWithRoles("alice")).thenReturn(Optional.of(activeUser));
        when(passwordService.matches("Secret123!", "$2a$10$hashed")).thenReturn(false);
        when(authProperties.isRequireEmailVerification()).thenReturn(false);

        assertThatThrownBy(() -> authenticationService.authenticate(request, ClientDeviceInfo.unknown()))
                .isInstanceOf(AuthenticationFailedException.class)
                .hasMessage(GENERIC_FAILURE);

        verify(jwtService, never()).generateAccessToken(any(), anyString());
        verify(refreshTokenService, never()).persistRefreshToken(any(), anyString(), any());
    }

    @Test
    void authenticate_unknownUser_throwsGenericFailure() {
        when(userRepository.findByEmailOrUsernameWithRoles("alice")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authenticationService.authenticate(request, ClientDeviceInfo.unknown()))
                .isInstanceOf(AuthenticationFailedException.class)
                .hasMessage(GENERIC_FAILURE);

        verify(passwordService, never()).matches(anyString(), anyString());
    }

    @Test
    void authenticate_lockedUser_throwsForbidden() {
        activeUser.setStatus(UserStatus.LOCKED);
        when(userRepository.findByEmailOrUsernameWithRoles("alice")).thenReturn(Optional.of(activeUser));

        assertThatThrownBy(() -> authenticationService.authenticate(request, ClientDeviceInfo.unknown()))
                .isInstanceOf(AccountStatusException.class)
                .hasMessageContaining("locked");

        verify(passwordService, never()).matches(anyString(), anyString());
    }

    @Test
    void authenticate_inactiveUser_throwsForbidden() {
        activeUser.setStatus(UserStatus.INACTIVE);
        when(userRepository.findByEmailOrUsernameWithRoles("alice")).thenReturn(Optional.of(activeUser));

        assertThatThrownBy(() -> authenticationService.authenticate(request, ClientDeviceInfo.unknown()))
                .isInstanceOf(AccountStatusException.class)
                .hasMessageContaining("inactive");
    }

    @Test
    void authenticate_unverifiedEmailWhenRequired_throwsForbidden() {
        activeUser.setEmailVerified(false);
        when(userRepository.findByEmailOrUsernameWithRoles("alice")).thenReturn(Optional.of(activeUser));
        when(authProperties.isRequireEmailVerification()).thenReturn(true);

        assertThatThrownBy(() -> authenticationService.authenticate(request, ClientDeviceInfo.unknown()))
                .isInstanceOf(AccountStatusException.class)
                .hasMessageContaining("Email verification");
    }
}
