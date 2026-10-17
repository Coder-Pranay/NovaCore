package com.novacore.security.config;

/**
 * Centralized path patterns for Spring Security authorization rules.
 * Paths are relative to the servlet context path ({@code /api}).
 */
public final class SecurityConstants {

    public static final String ACTUATOR_PATH = "/actuator/**";

    public static final String AUTH_REGISTER_PATH = "/v1/auth/register";
    public static final String AUTH_LOGIN_PATH = "/v1/auth/login";
    public static final String AUTH_REFRESH_PATH = "/v1/auth/refresh";
    public static final String AUTH_LOGOUT_PATH = "/v1/auth/logout";
    public static final String AUTH_FORGOT_PASSWORD_PATH = "/v1/auth/forgot-password";
    public static final String AUTH_RESET_PASSWORD_PATH = "/v1/auth/reset-password";
    public static final String AUTH_VERIFY_EMAIL_PATH = "/v1/auth/verify-email";
    public static final String AUTH_RESEND_VERIFICATION_PATH = "/v1/auth/resend-verification";

    /** Unauthenticated preview + password-gated access for public share links. */
    public static final String PUBLIC_LINK_OPEN_PATH = "/v1/public-links/open/**";

    public static final String[] AUTH_PUBLIC_PATHS = {
            AUTH_REGISTER_PATH,
            AUTH_LOGIN_PATH,
            AUTH_REFRESH_PATH,
            AUTH_LOGOUT_PATH,
            AUTH_FORGOT_PASSWORD_PATH,
            AUTH_RESET_PASSWORD_PATH,
            AUTH_VERIFY_EMAIL_PATH,
            AUTH_RESEND_VERIFICATION_PATH
    };

    private SecurityConstants() {
    }
}
