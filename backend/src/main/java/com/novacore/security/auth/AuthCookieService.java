package com.novacore.security.auth;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Arrays;
import java.util.Optional;

/**
 * Issues and clears HttpOnly authentication cookies. Tokens never need to be readable by JavaScript.
 */
@Component
public class AuthCookieService {

    private final AuthCookieProperties properties;

    public AuthCookieService(AuthCookieProperties properties) {
        this.properties = properties;
    }

    public void writeAuthCookies(
            HttpServletResponse response,
            String accessToken,
            String refreshToken,
            Duration accessMaxAge,
            Duration refreshMaxAge) {
        addCookie(response, buildCookie(
                properties.getAccessName(),
                accessToken,
                properties.getAccessPath(),
                accessMaxAge));
        addCookie(response, buildCookie(
                properties.getRefreshName(),
                refreshToken,
                properties.getRefreshPath(),
                refreshMaxAge));
        addCookie(response, buildCookie(
                properties.getSessionName(),
                "1",
                properties.getSessionPath(),
                refreshMaxAge));
    }

    public void clearAuthCookies(HttpServletResponse response) {
        addCookie(response, clearCookie(properties.getAccessName(), properties.getAccessPath()));
        addCookie(response, clearCookie(properties.getRefreshName(), properties.getRefreshPath()));
        addCookie(response, clearCookie(properties.getSessionName(), properties.getSessionPath()));
    }

    public Optional<String> readAccessToken(HttpServletRequest request) {
        return readCookie(request, properties.getAccessName());
    }

    public Optional<String> readRefreshToken(HttpServletRequest request) {
        return readCookie(request, properties.getRefreshName());
    }

    public boolean hasSessionCookie(HttpServletRequest request) {
        return readCookie(request, properties.getSessionName()).isPresent();
    }

    public AuthCookieProperties getProperties() {
        return properties;
    }

    private ResponseCookie buildCookie(String name, String value, String path, Duration maxAge) {
        return ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(properties.isSecure())
                .path(path)
                .maxAge(maxAge)
                .sameSite(properties.getSameSite())
                .build();
    }

    private ResponseCookie clearCookie(String name, String path) {
        return ResponseCookie.from(name, "")
                .httpOnly(true)
                .secure(properties.isSecure())
                .path(path)
                .maxAge(Duration.ZERO)
                .sameSite(properties.getSameSite())
                .build();
    }

    private void addCookie(HttpServletResponse response, ResponseCookie cookie) {
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private Optional<String> readCookie(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null || cookies.length == 0) {
            return Optional.empty();
        }
        return Arrays.stream(cookies)
                .filter(cookie -> name.equals(cookie.getName()))
                .map(Cookie::getValue)
                .filter(value -> value != null && !value.isBlank())
                .findFirst();
    }
}
