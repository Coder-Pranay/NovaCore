package com.novacore.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties(prefix = "novacore.auth")
public class AuthProperties {

    /**
     * When true, login is blocked until the user verifies their email.
     */
    private boolean requireEmailVerification = false;

    private Duration passwordResetTokenExpiration = Duration.ofMinutes(30);

    private Duration emailVerificationTokenExpiration = Duration.ofHours(24);

    private Duration resendVerificationCooldown = Duration.ofSeconds(60);

    private String frontendBaseUrl = "http://localhost:3000";

    private String mailFrom = "noreply@novacore.local";

    public boolean isRequireEmailVerification() {
        return requireEmailVerification;
    }

    public void setRequireEmailVerification(boolean requireEmailVerification) {
        this.requireEmailVerification = requireEmailVerification;
    }

    public Duration getPasswordResetTokenExpiration() {
        return passwordResetTokenExpiration;
    }

    public void setPasswordResetTokenExpiration(Duration passwordResetTokenExpiration) {
        this.passwordResetTokenExpiration = passwordResetTokenExpiration;
    }

    public Duration getEmailVerificationTokenExpiration() {
        return emailVerificationTokenExpiration;
    }

    public void setEmailVerificationTokenExpiration(Duration emailVerificationTokenExpiration) {
        this.emailVerificationTokenExpiration = emailVerificationTokenExpiration;
    }

    public Duration getResendVerificationCooldown() {
        return resendVerificationCooldown;
    }

    public void setResendVerificationCooldown(Duration resendVerificationCooldown) {
        this.resendVerificationCooldown = resendVerificationCooldown;
    }

    public String getFrontendBaseUrl() {
        return frontendBaseUrl;
    }

    public void setFrontendBaseUrl(String frontendBaseUrl) {
        this.frontendBaseUrl = frontendBaseUrl;
    }

    public String getMailFrom() {
        return mailFrom;
    }

    public void setMailFrom(String mailFrom) {
        this.mailFrom = mailFrom;
    }
}
