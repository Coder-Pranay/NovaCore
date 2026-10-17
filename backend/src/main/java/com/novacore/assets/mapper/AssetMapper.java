package com.novacore.assets.mapper;

import com.novacore.assets.Asset;
import com.novacore.assets.dto.AssetResponse;
import org.springframework.stereotype.Component;

@Component
public class AssetMapper {

    public AssetResponse toResponse(Asset asset) {
        AssetResponse response = new AssetResponse();
        response.setId(asset.getId());
        response.setOwnerId(asset.getOwner().getId());
        response.setSpaceId(asset.getSpace().getId());
        response.setName(asset.getName());
        response.setDescription(asset.getDescription());
        response.setAssetType(asset.getAssetType());
        response.setMimeType(asset.getMimeType());
        response.setFileSize(asset.getFileSize());
        response.setContentAvailable(
                asset.getStorageKey() != null && !asset.getStorageKey().isBlank());
        response.setOriginalFilename(asset.getOriginalFilename());
        response.setExtension(asset.getExtension());
        response.setFavorite(asset.isFavorite());
        response.setArchived(asset.isArchived());
        response.setCreatedAt(asset.getCreatedAt());
        response.setUpdatedAt(asset.getUpdatedAt());
        return response;
    }
}
