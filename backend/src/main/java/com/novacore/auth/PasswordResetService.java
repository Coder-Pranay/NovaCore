package com.novacore.auth;

import com.novacore.activity.ActionType;
import com.novacore.activity.ActivityLogService;
import com.novacore.activity.EntityType;
import com.novacore.auth.dto.ForgotPasswordRequest;
import com.novacore.auth.dto.ResetPasswordRequest;
import com.novacore.mail.EmailService;
import com.novacore.users.User;
import com.novacore.users.UserRepository;
import com.novacore.users.UserStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
public class PasswordResetService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);
    private static final String GENERIC_SUCCESS =
            "If an account exists for that email, a password reset link has been sent.";

    private final UserRepository userRepository;
    private final SecurityTokenService securityTokenService;
    private final PasswordService passwordService;
    private final RefreshTokenService refreshTokenService;
    private final EmailService emailService;
    private final AuthProperties authProperties;
    private final ActivityLogService activityLogService;

    public PasswordResetService(
            UserRepository userRepository,
            SecurityTokenService securityTokenService,
            PasswordService passwordService,
            RefreshTokenService refreshTokenService,
            EmailService emailService,
            AuthProperties authProperties,
            ActivityLogService activityLogService) {
        this.userRepository = userRepository;
        this.securityTokenService = securityTokenService;
        this.passwordService = passwordService;
        this.refreshTokenService = refreshTokenService;
        this.emailService = emailService;
        this.authProperties = authProperties;
        this.activityLogService = activityLogService;
    }

    /**
     * Always returns a generic message to prevent user enumeration.
     */
    @Transactional
    public String forgotPassword(ForgotPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        userRepository.findByEmail(email).ifPresent(user -> {
            if (user.getStatus() != UserStatus.ACTIVE) {
                return;
            }
            try {
                String plainToken = securityTokenService.issueToken(
                        user,
                        SecurityTokenType.PASSWORD_RESET,
                        authProperties.getPasswordResetTokenExpiration());
                String resetUrl = authProperties.getFrontendBaseUrl().replaceAll("/$", "")
                        + "/reset-password?token=" + plainToken;
                emailService.send(
                        user.getEmail(),
                        "Reset your NovaCore password",
                        """
                        We received a request to reset your NovaCore password.

                        Open this link to choose a new password (expires soon):
                        %s

                        If you did not request this, you can ignore this email.
                        """.formatted(resetUrl));
            } catch (Exception ex) {
                log.error("Failed to send password reset email for userId={}", user.getId(), ex);
            }
        });
        return GENERIC_SUCCESS;
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        PasswordPolicy.validate(request.getPassword());

        SecurityToken token = securityTokenService.requireValidToken(
                request.getToken(),
                SecurityTokenType.PASSWORD_RESET);

        User user = token.getUser();
        user.setPasswordHash(passwordService.hashPassword(request.getPassword()));
        user.setUpdatedAt(java.time.Instant.now());
        userRepository.save(user);

        securityTokenService.consume(token);
        securityTokenService.expireActiveTokens(user.getId(), SecurityTokenType.PASSWORD_RESET);
        refreshTokenService.revokeAllForUser(user.getId());

        activityLogService.logActivity(
                user.getId(),
                EntityType.AUTH,
                user.getId(),
                ActionType.PASSWORD_RESET,
                "Password reset",
                "Password was reset via email token",
                Map.of("source", "forgot-password"));
    }
}
