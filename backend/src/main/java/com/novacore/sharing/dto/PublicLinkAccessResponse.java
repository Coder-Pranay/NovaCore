package com.novacore.sharing.dto;

import com.novacore.sharing.ShareResourceType;

import java.util.UUID;

public class PublicLinkAccessResponse {

    private ShareResourceType resourceType;
    private UUID resourceId;
    private String resourceName;
    private String description;

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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
