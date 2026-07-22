package com.novacore.search.projection;

import com.novacore.assets.AssetType;

import java.time.Instant;
import java.util.UUID;

public interface AssetSearchProjection {

    UUID getId();

    String getName();

    String getDescription();

    AssetType getAssetType();

    boolean isFavorite();

    UUID getSpaceId();

    String getSpaceName();

    Instant getCreatedAt();
}
