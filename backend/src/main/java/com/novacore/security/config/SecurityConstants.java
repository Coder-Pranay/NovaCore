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

    public static final String[] AUTH_PUBLIC_PATHS = {
            AUTH_REGISTER_PATH,
            AUTH_LOGIN_PATH,
            AUTH_REFRESH_PATH
    };

    private SecurityConstants() {
    }
}
