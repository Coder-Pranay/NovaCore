package com.novacore.auth;

import com.novacore.auth.dto.ChangePasswordRequest;
import com.novacore.auth.dto.ForgotPasswordRequest;
import com.novacore.auth.dto.LoginRequest;
import com.novacore.auth.dto.LoginResponse;
import com.novacore.auth.dto.LogoutRequest;
import com.novacore.auth.dto.RefreshTokenRequest;
import com.novacore.auth.dto.RefreshTokenResponse;
import com.novacore.auth.dto.RegisterRequest;
import com.novacore.auth.dto.RegisterResponse;
import com.novacore.auth.dto.ResendVerificationRequest;
import com.novacore.auth.dto.ResetPasswordRequest;
import com.novacore.auth.dto.SessionResponse;
import com.novacore.auth.dto.VerifyEmailRequest;
import com.novacore.common.api.ApiResponse;
import com.novacore.security.auth.AuthCookieService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/v1/auth")
public class AuthController {

    private final AuthenticationService authenticationService;
    private final AuthCookieService authCookieService;
    private final PasswordResetService passwordResetService;
    private final EmailVerificationService emailVerificationService;
    private final SessionManagementService sessionManagementService;

    public AuthController(
            AuthenticationService authenticationService,
            AuthCookieService authCookieService,
            PasswordResetService passwordResetService,
            EmailVerificationService emailVerificationService,
            SessionManagementService sessionManagementService) {
        this.authenticationService = authenticationService;
        this.authCookieService = authCookieService;
        this.passwordResetService = passwordResetService;
        this.emailVerificationService = emailVerificationService;
        this.sessionManagementService = sessionManagementService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
        RegisterResponse response = authenticationService.register(request);
        return ApiResponse.success(response, "User registered successfully");
    }

    @PostMapping("/login")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<LoginResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse response) {
        AuthenticationService.LoginResult result =
                authenticationService.authenticate(request, ClientDeviceInfo.from(httpRequest));
        AuthenticationService.DurationHolder durations = authenticationService.tokenDurations();
        authCookieService.writeAuthCookies(
                response,
                result.tokens().accessToken(),
                result.tokens().refreshToken(),
                durations.access(),
                durations.refresh());
        return ApiResponse.success(result.response(), "Login successful");
    }

    @PostMapping("/refresh")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<RefreshTokenResponse> refresh(
            @RequestBody(required = false) RefreshTokenRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        String refreshToken = resolveRefreshToken(httpRequest, request == null ? null : request.getRefreshToken());
        AuthenticationService.RefreshResult result =
                authenticationService.refresh(refreshToken, ClientDeviceInfo.from(httpRequest));
        AuthenticationService.DurationHolder durations = authenticationService.tokenDurations();
        authCookieService.writeAuthCookies(
                httpResponse,
                result.tokens().accessToken(),
                result.tokens().refreshToken(),
                durations.access(),
                durations.refresh());
        return ApiResponse.success(result.response(), "Token refreshed successfully");
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<Void> logout(
            @RequestBody(required = false) LogoutRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        String refreshToken = resolveRefreshToken(httpRequest, request == null ? null : request.getRefreshToken());
        authenticationService.logout(refreshToken);
        authCookieService.clearAuthCookies(httpResponse);
        return ApiResponse.success(null, "Logged out successfully");
    }

    @PostMapping("/forgot-password")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        String message = passwordResetService.forgotPassword(request);
        return ApiResponse.success(Map.of("message", message), message);
    }

    @PostMapping("/reset-password")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        passwordResetService.resetPassword(request);
        return ApiResponse.success(null, "Password reset successfully");
    }

    @PostMapping("/verify-email")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<Void> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        emailVerificationService.verifyEmail(request);
        return ApiResponse.success(null, "Email verified successfully");
    }

    @PostMapping("/resend-verification")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<Map<String, String>> resendVerification(
            @Valid @RequestBody ResendVerificationRequest request) {
        String message = emailVerificationService.resendVerification(request);
        return ApiResponse.success(Map.of("message", message), message);
    }

    @PostMapping("/change-password")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<Void> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            HttpServletRequest httpRequest) {
        String refreshToken = resolveRefreshToken(httpRequest, null);
        authenticationService.changePassword(request, refreshToken);
        return ApiResponse.success(null, "Password changed successfully");
    }

    @GetMapping("/sessions")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<List<SessionResponse>> listSessions(HttpServletRequest httpRequest) {
        String refreshToken = resolveRefreshToken(httpRequest, null);
        return ApiResponse.success(
                sessionManagementService.listSessions(refreshToken),
                "Sessions retrieved successfully");
    }

    @DeleteMapping("/sessions/{sessionId}")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<Void> revokeSession(
            @PathVariable UUID sessionId,
            HttpServletRequest httpRequest) {
        String refreshToken = resolveRefreshToken(httpRequest, null);
        sessionManagementService.revokeSession(sessionId, refreshToken);
        return ApiResponse.success(null, "Session revoked successfully");
    }

    @PostMapping("/sessions/revoke-others")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<Void> revokeOtherSessions(HttpServletRequest httpRequest) {
        String refreshToken = resolveRefreshToken(httpRequest, null);
        sessionManagementService.revokeOtherSessions(refreshToken);
        return ApiResponse.success(null, "Other sessions revoked successfully");
    }

    private String resolveRefreshToken(HttpServletRequest request, String bodyToken) {
        return authCookieService.readRefreshToken(request)
                .orElseGet(() -> bodyToken == null ? "" : bodyToken);
    }
}
