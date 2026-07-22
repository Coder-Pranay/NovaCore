package com.novacore.dashboard.projection;

import com.novacore.assets.AssetType;

public interface AssetTypeCountProjection {

    AssetType getAssetType();

    long getCount();
}
