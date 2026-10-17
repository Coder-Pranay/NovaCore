package com.novacore.sharing.dto;

import com.novacore.sharing.ShareResourceType;

import java.time.Instant;

public class PublicLinkPreviewResponse {

    private String token;
    private ShareResourceType resourceType;
    private String resourceName;
    private boolean passwordRequired;
    private Instant expiresAt;

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public ShareResourceType getResourceType() {
        return resourceType;
    }

    public void setResourceType(ShareResourceType resourceType) {
        this.resourceType = resourceType;
    }

    public String getResourceName() {
        return resourceName;
    }

    public void setResourceName(String resourceName) {
        this.resourceName = resourceName;
    }

    public boolean isPasswordRequired() {
        return passwordRequired;
    }

    public void setPasswordRequired(boolean passwordRequired) {
        this.passwordRequired = passwordRequired;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }
}
