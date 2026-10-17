package com.novacore.auth.dto;

/**
 * Optional body for refresh. Prefer the HttpOnly refresh cookie when present.
 */
public class RefreshTokenRequest {

    private String refreshToken;

    public String getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }
}
