package com.novacore.auth.dto;

/**
 * Login API body — JWTs are delivered via HttpOnly cookies, not this payload.
 */
public class LoginResponse {

    private String tokenType = "Cookie";
    private long expiresIn;
    private AuthenticatedUserResponse user;

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

    public AuthenticatedUserResponse getUser() {
        return user;
    }

    public void setUser(AuthenticatedUserResponse user) {
        this.user = user;
    }
}
