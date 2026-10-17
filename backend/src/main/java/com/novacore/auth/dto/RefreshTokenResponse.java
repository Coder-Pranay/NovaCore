package com.novacore.auth.dto;

/**
 * Refresh API body — rotated JWTs are delivered via HttpOnly cookies.
 */
public class RefreshTokenResponse {

    private String tokenType = "Cookie";
    private long expiresIn;

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    public long getExpiresIn() {
        return expiresIn;
    }

    public void setExpiresIn(long expiresIn) {
        this.expiresIn = expiresIn;
    }
}
