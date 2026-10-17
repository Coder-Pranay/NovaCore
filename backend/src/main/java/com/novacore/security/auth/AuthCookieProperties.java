package com.novacore.security.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.NotBlank;

@Validated
@ConfigurationProperties(prefix = "novacore.auth.cookie")
public class AuthCookieProperties {

    @NotBlank
    private String accessName = "novacore_access";

    @NotBlank
    private String refreshName = "novacore_refresh";

    /**
     * Non-secret session flag (HttpOnly) readable by the Next.js middleware on the same host.
     * Path=/ so it is visible outside /api.
     */
    @NotBlank
    private String sessionName = "novacore_session";

    /**
     * When true, cookies include the Secure attribute (required for production HTTPS).
     */
    private boolean secure = false;

    @NotBlank
    private String sameSite = "Lax";

    @NotBlank
    private String accessPath = "/api";

    @NotBlank
    private String refreshPath = "/api/v1/auth";

    @NotBlank
    private String sessionPath = "/";

    public String getAccessName() {
        return accessName;
    }

    public void setAccessName(String accessName) {
        this.accessName = accessName;
    }

    public String getRefreshName() {
        return refreshName;
    }

    public void setRefreshName(String refreshName) {
        this.refreshName = refreshName;
    }

    public String getSessionName() {
        return sessionName;
    }

    public void setSessionName(String sessionName) {
        this.sessionName = sessionName;
    }

    public boolean isSecure() {
        return secure;
    }

    public void setSecure(boolean secure) {
        this.secure = secure;
    }

    public String getSameSite() {
        return sameSite;
    }

    public void setSameSite(String sameSite) {
        this.sameSite = sameSite;
    }

    public String getAccessPath() {
        return accessPath;
    }

    public void setAccessPath(String accessPath) {
        this.accessPath = accessPath;
    }

    public String getRefreshPath() {
        return refreshPath;
    }

    public void setRefreshPath(String refreshPath) {
        this.refreshPath = refreshPath;
    }

    public String getSessionPath() {
        return sessionPath;
    }

    public void setSessionPath(String sessionPath) {
        this.sessionPath = sessionPath;
    }
}
