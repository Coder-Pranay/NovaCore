package com.novacore.sharing.dto;

import com.novacore.sharing.ShareResourceType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

public class CreatePublicLinkRequest {

    @NotNull
    private ShareResourceType resourceType;

    @NotNull
    private UUID resourceId;

    @NotBlank
    @Size(max = 255)
    private String resourceName;

    private Instant expiresAt;

    private boolean passwordProtected;

    @Size(min = 8, max = 100)
    private String password;

    public ShareResourceType getResourceType() {
        return resourceType;
    }

    public void setResourceType(ShareResourceType resourceType) {
        this.resourceType = resourceType;
    }

    public UUID getResourceId() {
        return resourceId;
    }

    public void setResourceId(UUID resourceId) {
        this.resourceId = resourceId;
    }

    public String getResourceName() {
        return resourceName;
    }

    public void setResourceName(String resourceName) {
        this.resourceName = resourceName;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    public boolean isPasswordProtected() {
        return passwordProtected;
    }

    public void setPasswordProtected(boolean passwordProtected) {
        this.passwordProtected = passwordProtected;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
