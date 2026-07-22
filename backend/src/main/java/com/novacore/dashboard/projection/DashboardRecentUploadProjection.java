package com.novacore.dashboard.projection;

import com.novacore.assets.AssetType;

import java.time.Instant;
import java.util.UUID;

public interface DashboardRecentUploadProjection {

    UUID getId();

    String getName();

    AssetType getAssetType();

    String getMimeType();

    Long getFileSize();

    UUID getSpaceId();

    String getSpaceName();

    Instant getCreatedAt();
}
