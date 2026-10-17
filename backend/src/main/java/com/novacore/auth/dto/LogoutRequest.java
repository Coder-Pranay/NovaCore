package com.novacore.auth.dto;

/**
 * Optional body for logout. Prefer the HttpOnly refresh cookie when present.
 */
public class LogoutRequest {

    private String refreshToken;

    public String getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }
}
