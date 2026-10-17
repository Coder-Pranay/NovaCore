package com.novacore.auth;

import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MvcResult;

import jakarta.servlet.http.Cookie;

import java.util.List;
import java.util.Optional;

public final class AuthCookieTestHelper {

    public static final String ACCESS = "novacore_access";
    public static final String REFRESH = "novacore_refresh";
    public static final String SESSION = "novacore_session";

    private AuthCookieTestHelper() {
    }

    public static String requireCookieValue(MvcResult result, String name) {
        return readCookieValue(result, name)
                .orElseThrow(() -> new AssertionError("Missing Set-Cookie: " + name));
    }

    public static Optional<String> readCookieValue(MvcResult result, String name) {
        List<String> headers = result.getResponse().getHeaders(HttpHeaders.SET_COOKIE);
        return headers.stream()
                .filter(header -> header.startsWith(name + "="))
                .map(header -> {
                    String pair = header.split(";", 2)[0];
                    return pair.substring(name.length() + 1);
                })
                .filter(value -> !value.isBlank())
                .findFirst();
    }

    public static Cookie accessCookie(MvcResult loginResult) {
        return new Cookie(ACCESS, requireCookieValue(loginResult, ACCESS));
    }

    public static Cookie refreshCookie(MvcResult loginResult) {
        return new Cookie(REFRESH, requireCookieValue(loginResult, REFRESH));
    }

    public static Cookie accessCookie(String value) {
        return new Cookie(ACCESS, value);
    }

    public static Cookie refreshCookie(String value) {
        return new Cookie(REFRESH, value);
    }

    public static Cookie[] authCookies(MvcResult loginResult) {
        return new Cookie[] {
                accessCookie(loginResult),
                refreshCookie(loginResult),
                new Cookie(SESSION, requireCookieValue(loginResult, SESSION))
        };
    }

    public static boolean hasClearedCookie(MvcResult result, String name) {
        return result.getResponse().getHeaders(HttpHeaders.SET_COOKIE).stream()
                .anyMatch(header -> header.startsWith(name + "=")
                        && (header.contains("Max-Age=0") || header.contains("Max-Age=0;")));
    }
}
