package com.novacore.auth;

import com.novacore.activity.ActionType;
import com.novacore.activity.ActivityLogService;
import com.novacore.activity.EntityType;
import com.novacore.auth.dto.ResendVerificationRequest;
import com.novacore.auth.dto.VerifyEmailRequest;
import com.novacore.auth.exception.SecurityTokenException;
import com.novacore.common.exception.ConflictException;
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
public class EmailVerificationService {

    private static final Logger log = LoggerFactory.getLogger(EmailVerificationService.class);
    private static final String GENERIC_RESEND =
            "If an account needs verification, a new email has been sent.";

    private final UserRepository userRepository;
    private final SecurityTokenService securityTokenService;
    private final EmailService emailService;
    private final AuthProperties authProperties;
    private final AuthCooldownService authCooldownService;
    private final ActivityLogService activityLogService;

    public EmailVerificationService(
            UserRepository userRepository,
            SecurityTokenService securityTokenService,
            EmailService emailService,
            AuthProperties authProperties,
            AuthCooldownService authCooldownService,
            ActivityLogService activityLogService) {
        this.userRepository = userRepository;
        this.securityTokenService = securityTokenService;
        this.emailService = emailService;
        this.authProperties = authProperties;
        this.authCooldownService = authCooldownService;
        this.activityLogService = activityLogService;
    }

    @Transactional
    public void sendVerificationEmail(User user) {
        if (user.isEmailVerified()) {
            return;
        }
        try {
            String plainToken = securityTokenService.issueToken(
                    user,
                    SecurityTokenType.EMAIL_VERIFICATION,
                    authProperties.getEmailVerificationTokenExpiration());
            dispatchVerificationEmail(user.getEmail(), plainToken);
        } catch (Exception ex) {
            log.error("Failed to send verification email for userId={}", user.getId(), ex);
        }
    }

    @Transactional
    public void verifyEmail(VerifyEmailRequest request) {
        SecurityToken token = securityTokenService.requireValidToken(
                request.getToken(),
                SecurityTokenType.EMAIL_VERIFICATION);

        User user = token.getUser();
        if (user.isEmailVerified()) {
            securityTokenService.consume(token);
            throw new ConflictException("Email is already verified");
        }

        user.setEmailVerified(true);
        user.setUpdatedAt(java.time.Instant.now());
        userRepository.save(user);

        securityTokenService.consume(token);
        securityTokenService.expireActiveTokens(user.getId(), SecurityTokenType.EMAIL_VERIFICATION);

        activityLogService.logActivity(
                user.getId(),
                EntityType.AUTH,
                user.getId(),
                ActionType.EMAIL_VERIFIED,
                "Email verified",
                "Email address verified successfully",
                Map.of());
    }

    /**
     * Always returns a generic message to prevent user enumeration.
     */
    @Transactional
    public String resendVerification(ResendVerificationRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        authCooldownService.enforceCooldown(
                "verify-resend:" + email,
                authProperties.getResendVerificationCooldown());

        userRepository.findByEmail(email).ifPresent(user -> {
            if (user.getStatus() != UserStatus.ACTIVE || user.isEmailVerified()) {
                return;
            }
            try {
                sendVerificationEmail(user);
            } catch (Exception ex) {
                log.error("Failed to resend verification email for userId={}", user.getId(), ex);
            }
        });
        return GENERIC_RESEND;
    }

    private void dispatchVerificationEmail(String email, String plainToken) {
        String verifyUrl = authProperties.getFrontendBaseUrl().replaceAll("/$", "")
                + "/verify-email?token=" + plainToken;
        emailService.send(
                email,
                "Verify your NovaCore email",
                """
                Welcome to NovaCore.

                Please verify your email by opening this link:
                %s

                If you did not create an account, you can ignore this email.
                """.formatted(verifyUrl));
    }
}
